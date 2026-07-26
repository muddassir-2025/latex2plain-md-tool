/**
 * Smart Notes Formatter
 *
 * Takes raw unstructured text (study notes, research papers, ChatGPT output, etc.)
 * and produces properly structured Markdown by detecting:
 *
 *   - Code blocks (indented code, function definitions)
 *   - Headings (chapter/section/lecture, numbered, title-case)
 *   - Math expressions (LaTeX patterns)
 *   - Special elements (definitions, notes, examples, formulas)
 *   - Lists (explicit and implicit)
 *   - Blockquotes (callout patterns)
 *   - References (sections and list items)
 *   - URLs and links
 *   - Horizontal rules
 *
 * Multi-pass architecture:
 *   Pass 1 — Block detection (code, horizontal rules)
 *   Pass 2 — Special element detection (def, note, example, formula)
 *   Pass 3 — Math detection and wrapping
 *   Pass 4 — Heading detection
 *   Pass 5 — List and reference detection
 *   Pass 6 — URL/link detection
 *   Pass 7 — Cleanup and formatting
 */

// ─── Interface ────────────────────────────────────────────────────────────────

export interface FormatOptions {
    /** Language hint for detected code blocks (default: "text") */
    codeLanguage?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** LaTeX math patterns that indicate a line contains math expressions. */
const MATH_PATTERNS = [
    // Trig, log, box, and arrows
    /\\sin\b/,
    /\\cos\b/,
    /\\tan\b/,
    /\\cot\b/,
    /\\sec\b/,
    /\\csc\b/,
    /\\sinh\b/,
    /\\cosh\b/,
    /\\tanh\b/,
    /\\log\b/,
    /\\ln\b/,
    /\\lg\b/,
    /\\boxed/,
    /\\circ\b/,
    /\\rightarrow\b/,
    /\\leftarrow\b/,
    /\\Rightarrow\b/,
    /\\Leftarrow\b/,
    // More Greek letters
    /\\omega\b/,
    /\\phi\b/,
    /\\Phi\b/,
    /\\sigma\b/,
    /\\Sigma\b/,
    /\\lambda\b/,
    /\\mu\b/,
    /\\rho\b/,
    /\\tau\b/,
    /\\epsilon\b/,
    /\\varepsilon\b/,
    // Original patterns
    /\\frac\{/,
    /\\int(?:_|\^|\{)/,
    /\\sum(?:_|\^|\{)/,
    /\\lim(it)?(?:_|\{|:)/,
    /\\sqrt(\[|{)/,
    /\\alpha|\\beta|\\gamma|\\theta|\\pi|\\infty|\\delta/,
    /\\partial|\\nabla/,
    /\\to\b/,
    /\\times|\\cdot/,
    /\\binom/,
    /\\text\{/,
    /\\qquad|\\quad/,
    /\\\(/,
    /\\\)/,
    /\\\[/,
    /\\\]/,
    // Common patterns in study notes (without backslash)
    /int_[a-z]/i,
    /sum_[a-z]/i,
    /lim_/i,
    /[a-z]_[a-z0-9]\b/,
    /[a-zA-Z]\^[0-9]/,  // require letter before caret: x^3, not just ^3
    /[a-zA-Z]\^\{/,   // require letter before ^{: x^{n}
];

/** Check if a line looks like it contains LaTeX math. */
function looksLikeMath(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;

    // Must contain at least one math pattern
    const hasPattern = MATH_PATTERNS.some((p) => p.test(trimmed));
    if (hasPattern) return true;

    // Common math variable patterns: f(x)=..., etc.
    // but avoid matching URLs, code, or regular sentences
    if (
        trimmed.includes("=") &&
        /[a-z]\)\s*=\s*/.test(trimmed) &&
        !trimmed.startsWith("http") &&
        !trimmed.startsWith("#") &&
        trimmed.length < 80
    ) {
        return true;
    }

    return false;
}

/** Check if a line looks like a heading candidate. */
function looksLikeHeading(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;

    // Already a Markdown heading
    if (trimmed.startsWith("#")) return true;

    // Chapter/Lecture/Section/Part patterns
    if (/^(chapter|lecture|section|part|module|unit|lesson)\s+\d+/i.test(trimmed)) return true;

    // Numbered headings: 1. Title, 1.1 Title
    if (/^\d+\.\d+\s/.test(trimmed)) return true;
    if (/^\d+\.\s+[A-Z]/.test(trimmed)) return true;

    // Abstract, Introduction, Conclusion, etc.
    if (
        /^(abstract|introduction|background|related work|methodology|results?|discussion|conclusion|references?|appendix|acknowledgments)/i.test(
            trimmed,
        )
    )
        return true;

    // Exclude lines that are clearly sentences (end with period/question/exclamation)
    if (/[.?!]$/.test(trimmed)) return false;

    // Exclude lines with math-like patterns (those should be handled by math pass)
    if (/[_^]/.test(trimmed) || /\\/.test(trimmed)) return false;

    const words = trimmed.split(/\s+/);
    const numWords = words.length;

    // Single-word heading: capitalized word, > 2 chars, not a common stop word
    if (numWords === 1) {
        const word = words[0];
        // Must start uppercase, be at least 3 chars, and not be a common word
        if (
            /^[A-Z]/.test(word) &&
            word.length >= 3 &&
            !/^(The|And|For|But|Not|This|That|With|From|They|What|When|Where|Why|How|Which|While|Will|Would|Could|Should|May|Might|Can|Has|Had|Have|Are|Was|Were|Been|Does|Did|Just|Very|Also|Too|One|Two|Three)$/i.test(
                word.replace(/[:,;:]$/, ""),
            )
        ) {
            return true;
        }
    }

    // Relaxed title-case (2-7 words): first word uppercase, at least 50% uppercase starts
    if (numWords >= 2 && numWords <= 7 && trimmed.length <= 55) {
        // First word must start with uppercase
        if (/^[A-Z]/.test(words[0])) {
            // Count uppercase-starting words
            const upperCount = words.filter((w) => /^[A-Z]/.test(w)).length;
            // At least 50% of words start uppercase (excluding the first word which is guaranteed)
            if (upperCount >= Math.ceil(numWords / 2)) {
                // No comma (sentence-like)
                if (!trimmed.includes(",")) {
                    return true;
                }
            }
        }
    }

    return false;
}

/** Check if a line looks like the start of a code block. */
function looksLikeCode(line: string): boolean {
    const trimmed = line.trim();

    // Python function/class/import/for/while/if/with/def
    if (
        /^(def |class |import |from |for |while |if |elif |else:|try:|except |with |async |await )/.test(
            trimmed,
        )
    )
        return true;

    // C/Java/JS/C++ patterns
    if (
        /^(int |float |double |char |void |bool |string |const |static |public |private |protected |function |var |let |const |include|#include|using |namespace |template )/
            .test(trimmed)
    )
        return true;

    // Return/print/yield statements
    if (/^(return |print\s*\(|console\.|System\.out)/.test(trimmed)) return true;

    // Lambda expressions
    if (trimmed.includes("lambda") && trimmed.includes(":")) return true;

    // Variable assignment with type hints or operators
    if (/^\w+\s*[:=]\s*(int|float|str|bool|List|Dict|Tuple|Set|Optional)\b/.test(trimmed))
        return true;

    // Array/object literal start
    if (/^[\[{]\s*['"]/.test(trimmed)) return true;

    return false;
}

/** Detect the programming language from code content. */
function detectLanguage(lines: string[]): string {
    const combined = lines.join("\n");

    if (/import\s+(numpy|pandas|matplotlib|tensorflow|torch|sklearn|flask|django|os|sys|re|json)/.test(combined))
        return "python";
    if (/def\s+\w+\s*\(/.test(combined) && /:\s*$/.test(lines[0] || "")) return "python";
    if (/^(import |from\s+)/.test(lines[0] || "")) return "python";
    if (/#include\s*[<"]/.test(combined)) return "cpp";
    if (/public\s+(class|static|void|int|String)/.test(combined)) return "java";
    if (/^(const|let|var)\s/.test(lines[0] || "")) return "javascript";
    if (/: (string|number|boolean|void|any)\b/.test(combined) && /=>/.test(combined)) return "typescript";
    if (/^function\s/.test(lines[0] || "")) return "javascript";

    return "text";
}

// ─── Detection passes ─────────────────────────────────────────────────────────

interface PassResult {
    lines: string[];
}

/**
 * Pass 1: Block detection
 *
 * Detects and wraps:
 *   - Fenced/indented code blocks
 *   - Horizontal rules (---, ***, ___)
 */
function pass1_blocks(input: PassResult): PassResult {
    const inputLines = input.lines;
    const result: string[] = [];
    let i = 0;

    while (i < inputLines.length) {
        const line = inputLines[i];
        const trimmed = line.trim();

        if (trimmed === "") {
            result.push("");
            i++;
            continue;
        }

        // Detect horizontal rules
        if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed) || /^_{3,}$/.test(trimmed)) {
            result.push(trimmed);
            i++;
            continue;
        }

        // Detect code blocks: look for code-like lines
        if (looksLikeCode(trimmed)) {
            const codeLines: string[] = [line];
            let j = i + 1;

            while (j < inputLines.length) {
                const nextTrimmed = inputLines[j].trim();
                // Stop at blank line followed by heading-like or special
                if (nextTrimmed === "") {
                    // Check what comes after the blank line
                    const afterBlank = j + 1 < inputLines.length ? inputLines[j + 1].trim() : "";
                    if (
                        afterBlank &&
                        (looksLikeHeading(afterBlank) ||
                            /^(note|important|key|def|example|formula):/i.test(afterBlank) ||
                            /^\d+\.\d+\s/.test(afterBlank))
                    ) {
                        break;
                    }
                    // If the next non-blank line is code-like, continue
                    let k = j + 1;
                    while (k < inputLines.length && inputLines[k].trim() === "") k++;
                    if (k < inputLines.length && looksLikeCode(inputLines[k].trim())) {
                        codeLines.push("");
                        i = j;
                        j = k;
                        continue;
                    }
                    break;
                }

                // Stop at heading-like lines
                if (looksLikeHeading(nextTrimmed) && codeLines.length >= 2) break;
                // Stop at special markers
                if (
                    /^(note|important|key|def|example|formula|summary|conclusion|references?):/i.test(
                        nextTrimmed,
                    ) &&
                    codeLines.length >= 3
                )
                    break;

                codeLines.push(inputLines[j]);
                j++;
            }

            if (codeLines.length >= 2) {
                const lang = detectLanguage(codeLines);
                result.push("```" + lang);
                result.push(...codeLines);
                result.push("```");
                i = j;
                continue;
            }
        }

        result.push(line);
        i++;
    }

    return { lines: result };
}

/**
 * Pass 2: Special element detection (runs BEFORE math/headings)
 *
 * Converts:
 *   "def: term is ..." → "**Definition:** term is ..."
 *   "note: remember to ..." → "> **Note:** remember to ..."
 *   "important: the key is ..." → "> **Important:** the key is ..."
 *   "example: compute ..." → "**Example:** compute ..."
 *   "formula: E = mc^2" → "$$E = mc^2$$"
 *   "key concepts:" → "> **Key Concepts**"
 *   "summary: ..." → "> **Summary:** ..."
 */
function pass2_special(input: PassResult): PassResult {
    const lines = input.lines;
    const result: string[] = [];
    let inCode = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith("```")) {
            inCode = !inCode;
            result.push(line);
            continue;
        }

        if (inCode || trimmed.startsWith("#") || trimmed.startsWith("$$") || trimmed.startsWith("```")) {
            result.push(line);
            continue;
        }

        // Standalone multi-word callouts (MUST run BEFORE single-word to avoid partial matches)
        // e.g. "key concepts:" should not be matched as "key" + " concepts:"
        const headingCalloutMatch = trimmed.match(
            /^(key concepts|main ideas|important notes|learning objectives|key takeaways|key points)[:\s]*$/i,
        );
        if (headingCalloutMatch) {
            const label = headingCalloutMatch[1]
                .split(/\s+/)
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(" ");
            result.push("> **" + label + "**");
            continue;
        }

        // Definition
        const defMatch = trimmed.match(/^(def(?:inition)?[:\s]+)(.+)/i);
        if (defMatch) {
            result.push("**Definition:** " + defMatch[2]);
            continue;
        }

        // Formula (block display math)
        const formulaMatch = trimmed.match(/^(formula|equation)[:\s]+(.+)/i);
        if (formulaMatch) {
            result.push("$$" + formulaMatch[2].trim() + "$$");
            continue;
        }

        // Example
        const exampleMatch = trimmed.match(/^(example|e\.g\.)[:\s]+(.+)/i);
        if (exampleMatch) {
            result.push("**Example:** " + exampleMatch[2]);
            continue;
        }

        // Note/Important/Key/Remember/Summary — use blockquote
        const calloutMatch = trimmed.match(
            /^(note|important|key|remember|summary|warning|caution|hint|tip)[:\s]+(.+)/i,
        );
        if (calloutMatch) {
            const label =
                calloutMatch[1].charAt(0).toUpperCase() + calloutMatch[1].slice(1).toLowerCase();
            result.push("> **" + label + ":** " + calloutMatch[2]);
            continue;
        }

        result.push(line);
    }

    return { lines: result };
}

/**
 * Pass 3: Math detection (runs AFTER special elements)
 *
 * Wraps math expressions in $ (inline) or $$ (display) delimiters.
 * Avoids wrapping code blocks, headings, or already-delimited content.
 */
function pass3_math(input: PassResult): PassResult {
    const lines = input.lines;
    const result: string[] = [];
    let inCode = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // Track code block state
        if (trimmed.startsWith("```")) {
            inCode = !inCode;
            result.push(line);
            continue;
        }

        // Skip code blocks, headings, blockquotes, lists, and already-wrapped math
        if (
            inCode ||
            trimmed.startsWith("#") ||
            trimmed.startsWith(">") ||
            trimmed.startsWith("**") ||  // Skip lines already formatted as bold (e.g. "**Example:** ...")
            trimmed.startsWith("```") ||
            trimmed.startsWith("$$") ||
            trimmed.startsWith("$")
        ) {
            result.push(line);
            continue;
        }

        // Same-line bracket math: [ formula ] → $$ formula $$
        const bracketMatch = /^\[\s*(.+?)\s*\]$/.exec(trimmed);
        if (bracketMatch && bracketMatch[1].length < 200) {
            result.push("$$" + bracketMatch[1] + "$$");
            continue;
        }

        if (looksLikeMath(trimmed)) {
            // Determine display vs inline math
            // Display: standalone line with = sign and formula indicators
            const hasFormulaIndicators =
                trimmed.includes("_") || trimmed.includes("^") || trimmed.includes("\\");
            const isDisplay =
                trimmed.length > 20 &&
                trimmed.includes("=") &&
                hasFormulaIndicators;

            if (isDisplay) {
                result.push("$$" + trimmed + "$$");
            } else {
                result.push("$" + trimmed + "$");
            }
        } else {
            result.push(line);
        }
    }

    return { lines: result };
}

/**
 * Pass 4: Heading detection (runs AFTER special elements and math)
 *
 * Promotes heading-like lines to Markdown headings (#, ##, ###).
 * Context-aware: only promotes if preceded by a blank line (or is the first line).
 */
function pass4_headings(input: PassResult): PassResult {
    const lines = input.lines;
    const result: string[] = [];
    let inCode = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Track code block state
        if (trimmed.startsWith("```")) {
            inCode = !inCode;
            result.push(line);
            continue;
        }

        if (inCode || !trimmed || trimmed.startsWith("#") || trimmed.startsWith(">")) {
            result.push(line);
            continue;
        }

        // Only detect headings if preceded by a blank line (or is first line)
        const precededByBlank = i === 0 || lines[i - 1].trim() === "" || result[result.length - 1].trim() === "";

        if (!precededByBlank) {
            result.push(line);
            continue;
        }

        if (looksLikeHeading(trimmed)) {
            // Check if it's a numbered list (consecutive numbered lines) rather than a heading
            const isNumberedLine = /^\d+\.\s/.test(trimmed);
            if (isNumberedLine) {
                // If the NEXT line is also numbered, this is a list, not a heading
                const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : "";
                if (/^\d+\.\s/.test(nextLine)) {
                    result.push(line);
                    continue;
                }
            }

            // Count heading level based on depth indicators
            let level = 2; // default ##

            // Chapter/Lecture → #
            if (
                /^(chapter|lecture|part)\s+\d+/i.test(trimmed) ||
                /^abstract/i.test(trimmed)
            ) {
                level = 1;
            }

            // Sub-numbering (1.1, 2.3.1) → ### for sub, #### for sub-sub
            const match = trimmed.match(/^(\d+(?:\.\d+)*)\s/);
            if (match) {
                const parts = match[1].split(".").length;
                level = Math.min(parts + 1, 4);
            }

            // Remove numbering from the heading text
            const cleanText = trimmed.replace(/^\d+(?:\.\d+)*\.?\s*/, "").trim();
            const headingText = cleanText || trimmed;

            result.push(`${"#".repeat(level)} ${headingText}`);
        } else {
            result.push(line);
        }
    }

    return { lines: result };
}

/**
 * Pass 5: List and reference detection
 *
 * Detects implicit list items (lines starting with -, *, numbers, or
 * patterns like "term — description") and ensures proper list formatting.
 * Also detects reference sections.
 */
function pass5_lists(input: PassResult): PassResult {
    const lines = input.lines;
    const result: string[] = [];
    let inCode = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // Track code block state
        if (trimmed.startsWith("```")) {
            inCode = !inCode;
            result.push(line);
            continue;
        }

        // Pass through code blocks, headings, blockquotes, math
        if (
            inCode ||
            trimmed.startsWith("#") ||
            trimmed.startsWith(">") ||
            trimmed.startsWith("$$") ||
            trimmed.startsWith("$")
        ) {
            result.push(line);
            continue;
        }

        // Already a list item
        if (/^[-*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
            result.push(line);
            continue;
        }

        // Detect implicit unordered list: "term — description" or "term - description"
        const implicitUnordered = trimmed.match(/^(.+?)\s*[—–-]\s+(.+)/);
        if (implicitUnordered && implicitUnordered[1].length < 30) {
            result.push("- " + implicitUnordered[1].trim() + " — " + implicitUnordered[2].trim());
            continue;
        }

        // Detect reference items: "1. Author, Title" or "[1] Author" in reference sections
        if (/^\d+\.\s+/.test(trimmed) && trimmed.length > 30) {
            // Check if it looks like a reference (Author, year, title pattern)
            if (/[A-Z][a-z]+.*\d{4}/.test(trimmed) || /[A-Z][a-z]+,\s/.test(trimmed)) {
                result.push(trimmed);
                continue;
            }
            // If preceded by references heading, treat as list item
            const prevLine = lines.indexOf(line) > 0 ? lines[lines.indexOf(line) - 1].trim() : "";
            if (/^#/.test(prevLine) && /references/i.test(prevLine)) {
                result.push(trimmed);
                continue;
            }
        }

        result.push(line);
    }

    return { lines: result };
}

/**
 * Pass 6: URL/link detection
 *
 * Wraps bare URLs in markdown link syntax where appropriate.
 * Detects patterns like:
 *   https://example.com → [example.com](https://example.com)
 *   "see https://example.com for details" → "see [example.com](https://example.com) for details"
 */
function pass6_urls(input: PassResult): PassResult {
    const lines = input.lines;
    const result: string[] = [];
    let inCode = false;

    // URL regex
    const urlRegex = /(^|\s)(https?:\/\/[^\s<>"']+)/g;

    for (const line of lines) {
        const trimmed = line.trim();

        // Track code block state
        if (trimmed.startsWith("```")) {
            inCode = !inCode;
            result.push(line);
            continue;
        }

        // Skip code blocks, headings
        if (inCode || trimmed.startsWith("```") || trimmed.startsWith("#")) {
            result.push(line);
            continue;
        }

        // Replace bare URLs with markdown links
        const processed = trimmed.replace(urlRegex, (_match, before, url) => {
            // Shorten display text by removing protocol
            const display = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
            return `${before}[${display}](${url})`;
        });

        result.push(processed);
    }

    return { lines: result };
}

/**
 * Pass 7: Cleanup
 *
 * Normalizes spacing, removes duplicate blank lines, ensures paragraph
 * separation, and final formatting touches.
 */
function pass7_cleanup(input: PassResult): PassResult {
    const lines = input.lines;
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Collapse 3+ blank lines to 2
        if (line === "" && result.length > 0 && result[result.length - 1] === "") {
            // Check if the next line is also blank — skip this one
            if (i + 1 < lines.length && lines[i + 1] === "") {
                continue;
            }
        }

        // Trim trailing whitespace
        result.push(line.trimEnd());
    }

    // Ensure file ends with exactly one newline
    while (result.length > 0 && result[result.length - 1] === "") {
        result.pop();
    }

    return { lines: result };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Smart-format raw text into structured Markdown.
 *
 * @param rawText  The raw unstructured input text
 * @param opts     Optional formatting options
 * @returns        Structured Markdown text
 */
export function smartFormat(rawText: string, opts?: FormatOptions): string {
    let pass: PassResult = { lines: rawText.split("\n") };

    // Run each pass sequentially
    pass = pass1_blocks(pass);
    pass = pass2_special(pass);     // Special elements BEFORE math (example: x^3 → **Example:** x^3, not $example: Compute x^3$)
    pass = pass3_math(pass);        // Math detection
    pass = pass4_headings(pass);    // Headings after special/math
    pass = pass5_lists(pass);
    pass = pass6_urls(pass);
    pass = pass7_cleanup(pass);

    return pass.lines.join("\n");
}
