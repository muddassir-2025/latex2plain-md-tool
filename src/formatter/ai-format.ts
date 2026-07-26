/**
 * AI-powered notes formatter using Groq API.
 *
 * Takes raw/unstructured/messy text and converts it into beautiful,
 * well-structured Markdown using Groq's Llama 3.
 *
 * ⚠️ Groq Free tier limits: 6,000 tokens/min (TPM).
 *    With max_tokens=2048 + prompt overhead (~520 tokens),
 *    each request costs ~2,600 tokens. Notes up to ~13,700 chars
 *    (~3,400 tokens) fit within one TPM window.
 *
 *    For larger notes: AI Format falls back to Smart Format.
 *
 * If the API is unreachable or rate-limited, the caller is expected
 * to fall back to the built-in smartFormat immediately (no retries
 * for rate limits — they won't resolve within a reasonable time).
 */

// ─── Configuration ─────────────────────────────────────────────────────────

// To use a different API key, set the GROQ_API_KEY environment variable.
// Get a free key at https://console.groq.com/keys
const API_KEY = process.env.GROQ_API_KEY;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const MODEL = "llama-3.1-8b-instant";

// ─── Token/character limits ─────────────────────────────────────────────────

/**
 * Maximum output tokens requested from Groq.
 *
 * 2,048 tokens = ~8,000 chars of output — plenty for formatted Markdown notes.
 * Keeps the total per-request cost ~2,600 tokens (with prompt overhead),
 * fitting comfortably within Groq Free tier's 6,000 TPM.
 */
const MAX_OUTPUT_TOKENS = 2048;

/**
 * Maximum input characters we'll send to AI.
 *
 * Based on 6,000 TPM limit with MAX_OUTPUT_TOKENS=2048:
 *   Total token budget:  6,000
 *   Output tokens:       -2,048
 *   System prompt:         -500
 *   Message overhead:      -20
 *   ─────────────────────────
 *   Available for notes:  3,432 tokens ≈ ~13,700 characters
 *
 * We set a conservative limit of 10,000 chars to leave headroom.
 * Beyond this, we fall back to Smart Format.
 */
const MAX_AI_INPUT_CHARS = 10_000;

// ─── System prompt — Master LaTeX Conversion Style ─────────────────────────

const SYSTEM_PROMPT = `You are an expert academic typesetter and note-formatting specialist. Turn messy, unstructured raw notes into clean, beautifully formatted Markdown with proper LaTeX math notation.

## Core Rules
1. **Preserve ALL information** — never delete, invent, or summarize away content.
2. **No added commentary** — don't insert opinions or external facts.
3. **Fix typos and grammar**, but keep the author's voice.
4. **Reorganize for logical flow** — infer section hierarchy from the content.

## LaTeX Math Rules
- Use standard AMS-LaTeX formatting (\`amsmath\`, \`amssymb\`).
- All variables should be italicized; functions (sin, cos, ln, det, max) use their roman \`\text{} \` or just plain text in Markdown.
- Fractions: always use \`\frac{}{} \`.
- Scaling fences: use \`\left( \right) \`, \`\left[ \right] \`, \`\left| \right| \` around fractions or integrals so they scale properly.
- Derivatives: \`\partial \` for partials, \`d \` or \`\mathrm{d} \` for exact derivatives.
- Multi-line equations: use \`\begin{aligned} ... \end{aligned} \` aligned at \`&=\`.
- Piecewise functions: use \`\begin{cases} ... \end{cases} \`.
- Greek letters: \`\alpha \`, \`\beta \`, \`\theta \`, \`\mu \`, etc.
- Sums/products: \`\sum_{}^{} \`, \`\prod_{}^{} \`.
- Integrals: \`\int_{}^{} \`, \`\iint \`, \`\oint \`.
- Matrices: \`\begin{pmatrix} ... \end{pmatrix} \`, \`\begin{bmatrix} ... \end{bmatrix} \`.

## Markdown Formatting
- Use \`# \` / \`## \` / \`### \` headers for natural section breaks.
- Bullet points (\`- \`) for unordered items; numbered lists (\`1. \`) for sequences or steps.
- **Bold** key terms, names, dates, or action items.
- Tables for comparable data (specs, schedules, comparisons).
- Code blocks (\`\`\` \`) for commands, paths, configs, or code.
- Blockquotes (\`> \`) for quotes or important callouts.
- Checkbox lists (\`- [ ] \`) for to-dos or action items.
- If something is ambiguous, flag it inline as \`**[unclear: ...]** \` — don't guess.

## Output Rules
Return ONLY the formatted Markdown. No preamble, no commentary. Don't wrap in a code fence. If the input contains mathematical expressions, render them using proper LaTeX syntax embedded in the Markdown.`;

// ─── Retry configuration ────────────────────────────────────────────────────

/**
 * Retry configuration.
 *
 * maxRetries=0 for rate-limit failures — they won't resolve within
 * a reasonable time on Groq Free tier (6K TPM). We fall back to
 * Smart Format immediately instead of making the user wait minutes.
 *
 * For transient network errors, we allow 1 quick retry with a 2s delay.
 * Exported as mutable so tests can override values.
 */
export const retryConfig: {
    maxRetries: number;
    transientRetries: number;
    transientDelayMs: number;
} = {
    maxRetries: 0,
    transientRetries: 1,
    transientDelayMs: 2_000,
};

// ─── Interface ─────────────────────────────────────────────────────────────

export interface AiFormatResult {
    success: boolean;
    formatted: string;
    error?: string;
}

// ─── Format function ───────────────────────────────────────────────────────

/**
 * Format raw text using Groq AI.
 *
 * @param input       Raw/unstructured text to format
 * @returns           AiFormatResult with formatted markdown or error info
 */
export async function aiFormat(input: string): Promise<AiFormatResult> {
    // ── Input validation ──────────────────────────────────────────────────

    if (!API_KEY) {
        return {
            success: false,
            formatted: input,
            error: "GROQ_API_KEY is not set. Set it to use AI Formatting, or use Smart Format instead.",
        };
    }

    if (!input.trim()) {
        return { success: false, formatted: input, error: "Empty input" };
    }

    // If input is too large for the AI, fall back immediately with a clear message
    if (input.length > MAX_AI_INPUT_CHARS) {
        return {
            success: false,
            formatted: input,
            error: `Input is ${input.length.toLocaleString()} characters — too large for AI Format (max ${MAX_AI_INPUT_CHARS.toLocaleString()} chars for Groq Free tier). Falling back to Smart Format.`,
        };
    }

    // ── Retry loop ──────────────────────────────────────────────────────────
    // Rate-limit retries: none (maxRetries = 0 → fall back immediately)
    // Transient (network/timeout) retries: 1 quick retry with 2s delay
    const { maxRetries, transientRetries, transientDelayMs } = retryConfig;
    let lastError: string = "Unknown error";
    // Total attempts: 1 initial + maxRetries (rate-limit) + transientRetries (network)
    const maxAttempts = 1 + maxRetries + transientRetries;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, transientDelayMs));
        }

        try {
            const response = await fetch(GROQ_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        {
                            role: "user",
                            content: `Please format the following notes into beautiful Markdown:\n\n${input}`,
                        },
                    ],
                    temperature: 0.3,
                    max_tokens: MAX_OUTPUT_TOKENS,
                }),
                signal: AbortSignal.timeout(15_000),  // 15-second timeout per attempt
            });

            if (response.ok) {
                const data = await response.json();
                const formattedContent = data?.choices?.[0]?.message?.content?.trim();

                if (!formattedContent) {
                    return {
                        success: false,
                        formatted: input,
                        error: "AI returned empty response",
                    };
                }

                return {
                    success: true,
                    formatted: formattedContent,
                };
            }

            const errorBody = await response.text().catch(() => "Unknown error");
            const status = response.status;

            // Rate limit or TPM exceeded — NO RETRY, fall back immediately
            if (status === 429 || status === 413) {
                return {
                    success: false,
                    formatted: input,
                    error: `AI rate limit exceeded (${status}). Groq Free tier allows ~6K tokens/min. Try again in a minute, or use Smart Format.`,
                };
            }

            // Quota or auth errors — no retry
            if (status === 402) {
                return {
                    success: false,
                    formatted: input,
                    error: `AI quota exceeded. Check your billing at https://console.groq.com.`,
                };
            }
            if (status === 401) {
                return {
                    success: false,
                    formatted: input,
                    error: `AI authentication failed. Check your GROQ_API_KEY.`,
                };
            }

            return {
                success: false,
                formatted: input,
                error: `AI service error (${status}): ${errorBody}`,
            };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);

            // Timeout or network errors — 1 quick retry
            if (attempt === 0 && (
                message.includes("timeout") || message.includes("timed out") || message.includes("aborted") ||
                message.includes("fetch") || message.includes("network") || message.includes("ENOTFOUND")
            )) {
                lastError = `AI request failed (${message}). Retrying once...`;
                continue;
            }

            return {
                success: false,
                formatted: input,
                error: `AI formatting failed: ${message}`,
            };
        }
    }

    // All retries exhausted (only happens for transient errors that failed twice)
    return {
        success: false,
        formatted: input,
        error: `${lastError} Transient error. Falling back to Smart Format.`,
    };
}
