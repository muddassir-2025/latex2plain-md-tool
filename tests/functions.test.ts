import { describe, it, expect } from "vitest";
import { convertFunctions, convertLim } from "../src/converter/functions.js";

// ─── convertLim ──────────────────────────────────────────────────────────────
//
// Note: convertLim runs the subscript content through convertInner(). When
// tested in isolation (no pipeline registered), convertInner returns the
// content unchanged.  Integration tests with \to / \infty are via pipeline.

describe("convertLim", () => {
    it("converts \\lim_{x \\to \\infty} (isolated — symbols stay raw)", () => {
        expect(convertLim("\\lim_{x \\to \\infty}")).toBe("lim (x \\to \\infty)");
    });

    it("converts \\lim_{n \\to 0} (isolated)", () => {
        expect(convertLim("\\lim_{n \\to 0}")).toBe("lim (n \\to 0)");
    });

    it("converts \\limsup_{k \\to \\infty} → lim sup (...)", () => {
        expect(convertLim("\\limsup_{k \\to \\infty}")).toBe("lim sup (k \\to \\infty)");
    });

    it("converts \\liminf_{n \\to \\infty} → lim inf (...)", () => {
        expect(convertLim("\\liminf_{n \\to \\infty}")).toBe("lim inf (n \\to \\infty)");
    });

    it("handles \\lim in a sentence (isolated)", () => {
        const input = "Evaluate \\lim_{x \\to 0} \\frac{\\sin x}{x}";
        expect(convertLim(input)).toBe("Evaluate lim (x \\to 0) \\frac{\\sin x}{x}");
    });

    it("leaves plain text unchanged", () => {
        expect(convertLim("hello world")).toBe("hello world");
    });

    it("leaves \\lim without subscript unchanged", () => {
        expect(convertLim("\\lim x")).toBe("\\lim x");
    });

    it("leaves unrelated commands unchanged", () => {
        expect(convertLim("\\frac{1}{2}")).toBe("\\frac{1}{2}");
    });
});

// ─── convertFunctions ────────────────────────────────────────────────────────

describe("convertFunctions", () => {
    it("converts sin x → sin(x)", () => {
        expect(convertFunctions("sin x")).toBe("sin(x)");
    });

    it("converts log n → log(n)", () => {
        expect(convertFunctions("log n")).toBe("log(n)");
    });

    it("converts ln x → ln(x)", () => {
        expect(convertFunctions("ln x")).toBe("ln(x)");
    });

    it("converts cos θ → cos(θ)", () => {
        expect(convertFunctions("cos θ")).toBe("cos(θ)");
    });

    it("converts tan x → tan(x)", () => {
        expect(convertFunctions("tan x")).toBe("tan(x)");
    });

    it("converts sin xy → sin(xy) (word token)", () => {
        expect(convertFunctions("sin xy")).toBe("sin(xy)");
    });

    it("converts sin (x+y) → sin(x+y) (already parenthesized)", () => {
        expect(convertFunctions("sin (x+y)")).toBe("sin(x+y)");
    });

    it("converts sin {x} → sin(x) (braced)", () => {
        expect(convertFunctions("sin {x}")).toBe("sin(x)");
    });

    it("handles multiple functions in a sentence", () => {
        expect(convertFunctions("sin x + cos y + tan z")).toBe("sin(x) + cos(y) + tan(z)");
    });

    it("handles sin (1/2) → sin(1/2) (fraction already parenthesized)", () => {
        expect(convertFunctions("sin (1/2)")).toBe("sin(1/2)");
    });

    it("handles sin (x) → sin(x)", () => {
        expect(convertFunctions("sin(x)")).toBe("sin(x)");
    });

    it("handles exp x → exp(x)", () => {
        expect(convertFunctions("exp x")).toBe("exp(x)");
    });

    it("handles arcsin x → arcsin(x)", () => {
        expect(convertFunctions("arcsin x")).toBe("arcsin(x)");
    });

    it("handles arctan x → arctan(x)", () => {
        expect(convertFunctions("arctan x")).toBe("arctan(x)");
    });

    it("handles sinh x → sinh(x)", () => {
        expect(convertFunctions("sinh x")).toBe("sinh(x)");
    });

    it("handles cosh x → cosh(x)", () => {
        expect(convertFunctions("cosh x")).toBe("cosh(x)");
    });

    it("does not affect non-function words (sinc → no match)", () => {
        expect(convertFunctions("sinc function")).toBe("sinc function");
    });

    it("leaves plain text unchanged", () => {
        expect(convertFunctions("hello world")).toBe("hello world");
    });
});

// ─── Edge cases ──────────────────────────────────────────────────────────────

describe("convertFunctions — edge cases", () => {
    it("handles function at start of string", () => {
        expect(convertFunctions("sin x + y")).toBe("sin(x) + y");
    });

    it("handles function at end of string", () => {
        expect(convertFunctions("x = sin y")).toBe("x = sin(y)");
    });

    it("handles function followed by period", () => {
        // \w+ stops at '.', so only 'x' is the argument
        expect(convertFunctions("sin x.")).toBe("sin(x).");
    });

    it("handles function followed by comma", () => {
        // \w+ stops at ',', so only 'x' is the argument
        expect(convertFunctions("sin x, cos y")).toBe("sin(x), cos(y)");
    });

    it("handles sin (x) with extra space → sin(x)", () => {
        expect(convertFunctions("sin (x)")).toBe("sin(x)");
    });

    it("handles superscript on function: sin² x → sin²(x)", () => {
        expect(convertFunctions("sin² x")).toBe("sin²(x)");
    });

    it("handles sin³ x → sin³(x)", () => {
        expect(convertFunctions("sin³ x")).toBe("sin³(x)");
    });
});

// ─── Integration tests (via full pipeline) ───────────────────────────────────

import { runPipeline } from "../src/converter/pipeline.js";

describe("full pipeline — functions integration", () => {
    it("converts \\sin x → sin(x)", () => {
        expect(runPipeline("\\sin x").trim()).toBe("sin(x)");
    });

    it("converts \\log n → log(n)", () => {
        expect(runPipeline("\\log n").trim()).toBe("log(n)");
    });

    it("converts \\cos \\theta → cos(θ)", () => {
        expect(runPipeline("\\cos \\theta").trim()).toBe("cos(θ)");
    });

    it("converts \\ln x → ln(x)", () => {
        expect(runPipeline("\\ln x").trim()).toBe("ln(x)");
    });

    it("converts \\lim_{x \\to \\infty} → lim (x → ∞)", () => {
        expect(runPipeline("\\lim_{x \\to \\infty}").trim()).toBe("lim (x → ∞)");
    });

    it("converts \\lim_{n \\to 0} → lim (n → 0)", () => {
        expect(runPipeline("\\lim_{n \\to 0}").trim()).toBe("lim (n → 0)");
    });

    it("converts \\limsup_{k \\to \\infty} → lim sup (k → ∞)", () => {
        expect(runPipeline("\\limsup_{k \\to \\infty}").trim()).toBe("lim sup (k → ∞)");
    });

    it("converts \\liminf_{n \\to \\infty} → lim inf (n → ∞)", () => {
        expect(runPipeline("\\liminf_{n \\to \\infty}").trim()).toBe("lim inf (n → ∞)");
    });

    it("handles \\lim with fraction: \\lim_{x \\to 0} \\frac{\\sin x}{x}", () => {
        const result = runPipeline("\\lim_{x \\to 0} \\frac{\\sin x}{x}").trim();
        // formatFracPart now recognizes sin(x) as self-contained (ends with ))
        expect(result).toBe("lim (x → 0) (sin(x)/x)");
    });

    it("converts \\sin x + \\cos y + \\tan z", () => {
        expect(runPipeline("\\sin x + \\cos y + \\tan z").trim()).toBe("sin(x) + cos(y) + tan(z)");
    });

    it("handles superscript on function: \\sin^2 x → sin²(x)", () => {
        expect(runPipeline("\\sin^2 x").trim()).toBe("sin²(x)");
    });

    it("handles function with braced arg: \\sin{x} → sin(x)", () => {
        expect(runPipeline("\\sin{x}").trim()).toBe("sin(x)");
    });

    it("handles \\sin(\\theta) → sin(θ)", () => {
        expect(runPipeline("\\sin(\\theta)").trim()).toBe("sin(θ)");
    });

    it("handles sin with nested frac: \\sin \\frac{1}{2} → sin(1/2)", () => {
        expect(runPipeline("\\sin \\frac{1}{2}").trim()).toBe("sin(1/2)");
    });
});
