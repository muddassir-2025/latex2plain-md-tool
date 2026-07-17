import { describe, it, expect } from "vitest";
import { cleanup } from "../src/converter/cleanup.js";

describe("cleanup", () => {
    it("trims trailing spaces from lines", () => {
        expect(cleanup("hello   \nworld  \n")).toBe("hello\nworld\n");
    });

    it("collapses multiple spaces on a line", () => {
        expect(cleanup("a   b")).toBe("a b\n");
    });

    it("collapses 3+ blank lines to one blank line", () => {
        const input = "A\n\n\n\nB";
        expect(cleanup(input)).toBe("A\n\nB\n");
    });

    it("preserves single blank line", () => {
        expect(cleanup("A\n\nB")).toBe("A\n\nB\n");
    });

    it("ensures single trailing newline", () => {
        expect(cleanup("hello")).toBe("hello\n");
        expect(cleanup("hello\n")).toBe("hello\n");
        expect(cleanup("hello\n\n\n")).toBe("hello\n");
    });

    it("handles empty string", () => {
        expect(cleanup("")).toBe("\n");
    });

    it("handles already clean text", () => {
        const input = "Line one\n\nLine two\n";
        expect(cleanup(input)).toBe(input);
    });
});
