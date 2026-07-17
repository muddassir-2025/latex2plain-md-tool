import { describe, it, expect } from "vitest";
import { convertFractions } from "../src/converter/fractions.js";

describe("convertFractions", () => {
    it("converts simple fraction: \\frac{1}{2} → 1/2", () => {
        expect(convertFractions("\\frac{1}{2}")).toBe("1/2");
    });

    it("converts single-letter fraction: \\frac{a}{b} → a/b", () => {
        expect(convertFractions("\\frac{a}{b}")).toBe("a/b");
    });

    it("wraps complex numerator: \\frac{a+b}{c} → (a+b)/c", () => {
        expect(convertFractions("\\frac{a+b}{c}")).toBe("(a+b)/c");
    });

    it("wraps complex denominator: \\frac{1}{n+1} → 1/(n+1)", () => {
        expect(convertFractions("\\frac{1}{n+1}")).toBe("1/(n+1)");
    });

    it("wraps both when complex: \\frac{a+b}{c+d} → (a+b)/(c+d)", () => {
        expect(convertFractions("\\frac{a+b}{c+d}")).toBe("(a+b)/(c+d)");
    });

    it("converts \\frac{x}{2} → x/2", () => {
        expect(convertFractions("\\frac{x}{2}")).toBe("x/2");
    });

    it("converts multiple fractions", () => {
        const input = "\\frac{1}{2} + \\frac{3}{4}";
        expect(convertFractions(input)).toBe("1/2 + 3/4");
    });

    it("leaves plain text unchanged", () => {
        expect(convertFractions("hello world")).toBe("hello world");
    });

    it("handles fraction in sentence", () => {
        const input = "The result is \\frac{x+1}{y} units.";
        expect(convertFractions(input)).toBe("The result is (x+1)/y units.");
    });
});
