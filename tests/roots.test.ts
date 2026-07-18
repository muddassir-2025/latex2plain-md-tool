import { describe, it, expect } from "vitest";
import { convertRoots } from "../src/converter/roots.js";

describe("convertRoots", () => {
    it("converts \\sqrt{x} → √x", () => {
        expect(convertRoots("\\sqrt{x}")).toBe("√x");
    });

    it("wraps expression: \\sqrt{x+1} → √(x+1)", () => {
        expect(convertRoots("\\sqrt{x+1}")).toBe("√(x+1)");
    });

    it("converts cube root: \\sqrt[3]{x} → ∛x", () => {
        expect(convertRoots("\\sqrt[3]{x}")).toBe("∛x");
    });

    it("converts fourth root: \\sqrt[4]{x} → ∜x", () => {
        expect(convertRoots("\\sqrt[4]{x}")).toBe("∜x");
    });

    it("wraps cube root expression: \\sqrt[3]{x+1} → ∛(x+1)", () => {
        expect(convertRoots("\\sqrt[3]{x+1}")).toBe("∛(x+1)");
    });

    it("converts multiple roots", () => {
        expect(convertRoots("\\sqrt{a} + \\sqrt{b}")).toBe("√a + √b");
    });

    it("leaves plain text unchanged", () => {
        expect(convertRoots("hello world")).toBe("hello world");
    });

    it("converts \\sqrt{n} → √n", () => {
        expect(convertRoots("\\sqrt{n}")).toBe("√n");
    });

    it("converts root with fraction: \\sqrt{\\frac{a}{b}} → √((a/b))", () => {
        expect(convertRoots("\\sqrt{\\frac{a}{b}}")).toBe("√((a/b))");
    });
});
