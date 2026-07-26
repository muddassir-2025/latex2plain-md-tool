import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Create a mock fetch Response object */
function mockResponse(body: unknown, status = 200): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
    } as Response;
}

const TEST_API_KEY = "gsk_test-key-for-testing-purposes";

/**
 * Helper: import aiFormat with transient retries disabled (to avoid 2s delay).
 * Call this for tests that trigger timeout/network errors.
 */
async function importNoTransientRetry(): Promise<typeof import("../src/formatter/ai-format.js")> {
    vi.resetModules();
    const mod = await import("../src/formatter/ai-format.js");
    mod.retryConfig.transientRetries = 0;
    return await import("../src/formatter/ai-format.js");
}

// ─── Setup / Teardown ──────────────────────────────────────────────────────

beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", vi.fn());
    process.env.GROQ_API_KEY = TEST_API_KEY;
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    process.env.GROQ_API_KEY = TEST_API_KEY;
});

// ─── Missing API key ───────────────────────────────────────────────────────

describe("aiFormat — missing API key", () => {
    it("returns error when GROQ_API_KEY is not set", async () => {
        process.env.GROQ_API_KEY = "";
        vi.resetModules();

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("some text");

        expect(result.success).toBe(false);
        expect(result.error).toContain("GROQ_API_KEY is not set");
        expect(result.formatted).toBe("some text");
    });
});

// ─── Input validation ─────────────────────────────────────────────────────

describe("aiFormat — input validation", () => {
    it("returns error for empty input", async () => {
        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Empty input");
        expect(result.formatted).toBe("");
    });

    it("returns error for whitespace-only input", async () => {
        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("   \n  \n  ");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Empty input");
    });

    it("returns error for input exceeding MAX_AI_INPUT_CHARS (10,000)", async () => {
        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const largeInput = "x".repeat(10_001);
        const result = await aiFormat(largeInput);

        expect(result.success).toBe(false);
        expect(result.error).toContain("too large for AI Format");
        expect(result.error).toContain("10,000");
        expect(result.formatted).toBe(largeInput);
    });
});

// ─── Successful formatting ─────────────────────────────────────────────────

describe("aiFormat — successful formatting", () => {
    it("returns formatted content on success", async () => {
        const mockFetch = vi.fn().mockResolvedValue(
            mockResponse({
                choices: [{ message: { content: "# Calculus Review\n\n## Derivative Rules" } }],
            }),
        );
        vi.stubGlobal("fetch", mockFetch);

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("chapter 1: calculus review");

        expect(result.success).toBe(true);
        expect(result.formatted).toContain("# Calculus Review");
        expect(result.error).toBeUndefined();
    });

    it("sends correct request body to Groq API", async () => {
        const mockFetch = vi.fn().mockResolvedValue(
            mockResponse({
                choices: [{ message: { content: "# Formatted" } }],
            }),
        );
        vi.stubGlobal("fetch", mockFetch);

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        await aiFormat("test notes");

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const callArgs = mockFetch.mock.calls[0];
        expect(callArgs[0]).toBe("https://api.groq.com/openai/v1/chat/completions");

        const body = JSON.parse(callArgs[1].body as string);
        expect(body.model).toBe("llama-3.1-8b-instant");
        expect(body.messages).toHaveLength(2);
        expect(body.messages[0].role).toBe("system");
        expect(body.messages[1].role).toBe("user");
        expect(body.messages[1].content).toContain("test notes");
        expect(body.temperature).toBe(0.3);
        // max_tokens reduced from 16384 → 2048
        expect(body.max_tokens).toBe(2048);
    });
});

// ─── HTTP error handling ───────────────────────────────────────────────────

describe("aiFormat — HTTP error handling", () => {
    it("handles rate limiting (429) — no retry, immediate fallback", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({ error: "Rate limited" }, 429)));

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("some notes");

        expect(result.success).toBe(false);
        expect(result.error).toContain("AI rate limit exceeded (429)");
        expect(result.formatted).toBe("some notes");
    });

    it("handles TPM exceeded (413) — no retry, immediate fallback", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({ error: "TPM exceeded" }, 413)));

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("some notes");

        expect(result.success).toBe(false);
        expect(result.error).toContain("AI rate limit exceeded (413)");
    });

    it("handles payment required (402)", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({ error: "Quota exceeded" }, 402)));

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("some notes");

        expect(result.success).toBe(false);
        expect(result.error).toContain("AI quota exceeded");
    });

    it("handles authentication failure (401)", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({ error: "Unauthorized" }, 401)));

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("some notes");

        expect(result.success).toBe(false);
        expect(result.error).toContain("AI authentication failed");
    });

    it("handles generic server error (500)", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({ error: "Internal error" }, 500)));

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("some notes");

        expect(result.success).toBe(false);
        expect(result.error).toContain("AI service error (500)");
    });

    it("handles empty AI response (no choices)", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({ choices: [] }, 200)));

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("some notes");

        expect(result.success).toBe(false);
        expect(result.error).toContain("AI returned empty response");
    });

    it("handles empty content in response", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            mockResponse({ choices: [{ message: { content: "" } }] }, 200),
        ));

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("some notes");

        expect(result.success).toBe(false);
        expect(result.error).toContain("AI returned empty response");
    });

    it("handles null message in response", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            mockResponse({ choices: [{ message: null }] }, 200),
        ));

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("some notes");

        expect(result.success).toBe(false);
        expect(result.error).toContain("AI returned empty response");
    });
});

// ─── Network / error handling ─────────────────────────────────────────────

describe("aiFormat — network/error handling", () => {
    it("handles timeout errors (transient retries disabled)", async () => {
        const { aiFormat } = await importNoTransientRetry();
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("The operation was aborted")));

        const result = await aiFormat("some notes");

        expect(result.success).toBe(false);
        expect(result.error).toContain("AI request failed");
        expect(result.error).toContain("aborted");
    });

    it("handles 'fetch failed' errors", async () => {
        const { aiFormat } = await importNoTransientRetry();
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));

        const result = await aiFormat("some notes");

        expect(result.success).toBe(false);
        expect(result.error).toContain("AI request failed");
        expect(result.error).toContain("fetch failed");
    });

    it("handles DNS resolution errors", async () => {
        const { aiFormat } = await importNoTransientRetry();
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("getaddrinfo ENOTFOUND api.groq.com")));

        const result = await aiFormat("some notes");

        expect(result.success).toBe(false);
        expect(result.error).toContain("AI request failed");
        expect(result.error).toContain("ENOTFOUND");
    });

    it("handles non-Error rejections gracefully", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue("Some string error"));

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("some notes");

        expect(result.success).toBe(false);
        expect(result.error).toContain("AI formatting failed");
    });
});

// ─── No input truncation (replaced with hard limit) ────────────────────────

describe("aiFormat — input limits", () => {
    it("does NOT truncate — returns error instead for large input", async () => {
        // Input > 10K chars should be rejected immediately without calling fetch
        const largeInput = "This is a note that is too long. ".repeat(500);
        expect(largeInput.length).toBeGreaterThan(10_000);

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat(largeInput);

        expect(result.success).toBe(false);
        expect(result.error).toContain("too large for AI Format");
        expect(result.formatted).toBe(largeInput);
    });

    it("sends normal-sized input normally (under 10K limit)", async () => {
        const normalInput = "Some normal notes that are well within the limit";

        const mockFetch = vi.fn().mockResolvedValue(
            mockResponse({ choices: [{ message: { content: "# Normal Notes" } }] }, 200),
        );
        vi.stubGlobal("fetch", mockFetch);

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        await aiFormat(normalInput);

        const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
        expect(body.messages[1].content).not.toContain("truncated");
        expect(body.messages[1].content).toContain("normal notes");
    });
});

// ─── Result type integrity ─────────────────────────────────────────────────

describe("aiFormat — result type integrity", () => {
    it("returns success shape on successful formatting", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
            mockResponse({ choices: [{ message: { content: "# Formatted" } }] }, 200),
        ));

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("test");

        expect(result).toHaveProperty("success", true);
        expect(result).toHaveProperty("formatted");
        expect(result).not.toHaveProperty("error");
    });

    it("returns error shape on failure", async () => {
        const { aiFormat } = await importNoTransientRetry();
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));

        const result = await aiFormat("test");

        expect(result).toHaveProperty("success", false);
        expect(result).toHaveProperty("formatted");
        expect(result).toHaveProperty("error");
    });
});

// ─── Retry behavior ────────────────────────────────────────────────────────

describe("aiFormat — retry behavior", () => {
    it("retries ONCE on transient (timeout/network) error, then succeeds", async () => {
        vi.resetModules();
        const mod = await import("../src/formatter/ai-format.js");
        // Set small delay for fast test
        mod.retryConfig.transientDelayMs = 5;

        // First call fails with timeout, second succeeds
        const mockFetch = vi.fn()
            .mockRejectedValueOnce(new Error("fetch failed"))
            .mockResolvedValueOnce(mockResponse({ choices: [{ message: { content: "# Retry Succeeded" } }] }, 200));
        vi.stubGlobal("fetch", mockFetch);

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("test notes");

        expect(result.success).toBe(true);
        expect(result.formatted).toContain("Retry Succeeded");
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("returns error after exhausting all retry attempts", async () => {
        vi.resetModules();
        const mod = await import("../src/formatter/ai-format.js");
        mod.retryConfig.transientRetries = 0; // No transient retry
        // With maxRetries=0 and transientRetries=0, only 1 attempt is made
        // When it fails (timeout/network), it falls through to final error

        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("test notes");

        expect(result.success).toBe(false);
        expect(result.error).toContain("Transient error");
        expect(result.formatted).toBe("test notes");
    });

    it("does NOT retry on 429 — falls back immediately", async () => {
        const mockFetch = vi.fn().mockResolvedValue(mockResponse({ error: "Rate limited" }, 429));
        vi.stubGlobal("fetch", mockFetch);

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result = await aiFormat("test notes");

        expect(result.success).toBe(false);
        expect(result.error).toContain("AI rate limit exceeded");
        // Only 1 call — no retry
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("does NOT retry on 401 or 402 errors", async () => {
        // 401 test
        const mockFetch401 = vi.fn().mockResolvedValue(mockResponse({ error: "Unauthorized" }, 401));
        vi.stubGlobal("fetch", mockFetch401);

        const { aiFormat } = await import("../src/formatter/ai-format.js");
        const result401 = await aiFormat("test notes");
        expect(result401.success).toBe(false);
        expect(result401.error).toContain("AI authentication failed");
        expect(mockFetch401).toHaveBeenCalledTimes(1);

        vi.resetModules();
        // 402 test
        const mockFetch402 = vi.fn().mockResolvedValue(mockResponse({ error: "Quota exceeded" }, 402));
        vi.stubGlobal("fetch", mockFetch402);

        const { aiFormat: aiFormat2 } = await import("../src/formatter/ai-format.js");
        const result402 = await aiFormat2("test notes");
        expect(result402.success).toBe(false);
        expect(result402.error).toContain("AI quota exceeded");
        expect(mockFetch402).toHaveBeenCalledTimes(1);
    });
});
