import { describe, it, expect } from "vitest";
import { convertFractions } from "../src/converter/fractions.js";

describe("convertFractions — standard braced form", () => {
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

    it("handles fraction in sentence", () => {
        const input = "The result is \\frac{x+1}{y} units.";
        expect(convertFractions(input)).toBe("The result is (x+1)/y units.");
    });

    it("leaves plain text unchanged", () => {
        expect(convertFractions("hello world")).toBe("hello world");
    });
});

describe("convertFractions — shorthand forms (no braces)", () => {
    it("converts \\frac12 → 1/2 (digits, no braces)", () => {
        expect(convertFractions("\\frac12")).toBe("1/2");
    });

    it("converts \\frac ab → a/b (letters, no braces)", () => {
        expect(convertFractions("\\frac ab")).toBe("a/b");
    });

    it("converts \\frac a b → a/b (letters, with spaces)", () => {
        expect(convertFractions("\\frac a b")).toBe("a/b");
    });

    it("converts \\frac38 → 3/8", () => {
        expect(convertFractions("\\frac38")).toBe("3/8");
    });

    it("converts \\frac{1}2 → 1/2 (first braced, second single)", () => {
        expect(convertFractions("\\frac{1}2")).toBe("1/2");
    });

    it("converts \\frac1{2} → 1/2 (first single, second braced)", () => {
        expect(convertFractions("\\frac1{2}")).toBe("1/2");
    });

    it("converts \\frac1{n+1} → 1/(n+1) (first single, second braced expr)", () => {
        expect(convertFractions("\\frac1{n+1}")).toBe("1/(n+1)");
    });

    it("converts \\frac{a}b → a/b (first braced, second single)", () => {
        expect(convertFractions("\\frac{a}b")).toBe("a/b");
    });

    it("converts \\frac{a+b}c → (a+b)/c (first braced expr, second single)", () => {
        expect(convertFractions("\\frac{a+b}c")).toBe("(a+b)/c");
    });

    it("handles mixed shorthand in sentence", () => {
        const input = "x = \\frac12 y + \\frac{a}{b}";
        expect(convertFractions(input)).toBe("x = 1/2 y + a/b");
    });
});
