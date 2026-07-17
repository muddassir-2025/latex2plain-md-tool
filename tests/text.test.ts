import { describe, it, expect } from "vitest";
import { convertText } from "../src/converter/text.js";

describe("convertText", () => {
    it("converts \\text{hello}", () => {
        expect(convertText("\\text{hello}")).toBe("hello");
    });

    it("converts \\text{Speed = 5}", () => {
        expect(convertText("\\text{Speed = 5}")).toBe("Speed = 5");
    });

    it("handles multiple \\text occurrences", () => {
        const input = "\\text{for all } n \\ge \\text{n_0}";
        expect(convertText(input)).toBe("for all  n \\ge n_0");
    });

    it("handles \\text with nested braces", () => {
        expect(convertText("\\text{f(x)}")).toBe("f(x)");
    });

    it("leaves non-text content unchanged", () => {
        expect(convertText("\\alpha + \\beta")).toBe("\\alpha + \\beta");
    });

    it("handles text at start and end of string", () => {
        expect(convertText("\\text{start} middle \\text{end}")).toBe("start middle end");
    });
});
