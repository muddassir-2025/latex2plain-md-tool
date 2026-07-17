import { describe, it, expect } from "vitest";
import { stripDollars } from "../src/converter/dollars.js";

describe("stripDollars", () => {
    it("strips inline $...$", () => {
        expect(stripDollars("$x$")).toBe("x");
    });

    it("strips inline math with spaces", () => {
        expect(stripDollars("The value is $f(n)$ here.")).toBe("The value is f(n) here.");
    });

    it("strips display $$ ... $$", () => {
        const input = "$$\nx + y\n$$";
        expect(stripDollars(input)).toBe("x + y");
    });

    it("strips multiline display math", () => {
        const input = "$$\n\\alpha \\neq \\beta\n$$";
        expect(stripDollars(input)).toBe("\\alpha \\neq \\beta");
    });

    it("strips multiple inline math on same line", () => {
        const input = "We have $a$ and $b$.";
        expect(stripDollars(input)).toBe("We have a and b.");
    });

    it("does not strip unpaired $", () => {
        const input = "This costs $5.";
        // single $ with no closing $ — should remain unchanged
        expect(stripDollars(input)).toBe("This costs $5.");
    });

    it("leaves plain text unchanged", () => {
        expect(stripDollars("hello world")).toBe("hello world");
    });
});
