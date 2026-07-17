import { describe, it, expect } from "vitest";
import { convertSubscripts } from "../src/converter/subscript.js";

describe("convertSubscripts", () => {
    it("converts single digit subscript: n_0 → n₀", () => {
        expect(convertSubscripts("n_0")).toBe("n₀");
    });

    it("converts multiple digits without braces: x_12 → x₁₂", () => {
        expect(convertSubscripts("x_12")).toBe("x₁₂");
    });

    it("converts braced subscript: x_{123} → x₁₂₃", () => {
        expect(convertSubscripts("x_{123}")).toBe("x₁₂₃");
    });

    it("converts H_2O → H₂O", () => {
        expect(convertSubscripts("H_2O")).toBe("H₂O");
    });

    it("converts braced text subscript: a_{n} → aₙ", () => {
        expect(convertSubscripts("a_{n}")).toBe("aₙ");
    });

    it("handles multiple subscripts in one string", () => {
        expect(convertSubscripts("x_0 + y_1")).toBe("x₀ + y₁");
    });

    it("leaves plain text unchanged", () => {
        expect(convertSubscripts("hello world")).toBe("hello world");
    });

    it("converts n_0 in context", () => {
        expect(convertSubscripts("for all n ≥ n_0")).toBe("for all n ≥ n₀");
    });
});
