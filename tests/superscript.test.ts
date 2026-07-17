import { describe, it, expect } from "vitest";
import { convertSuperscripts } from "../src/converter/superscript.js";

describe("convertSuperscripts", () => {
    it("converts single digit superscript: x^2 → x²", () => {
        expect(convertSuperscripts("x^2")).toBe("x²");
    });

    it("converts multi-digit without braces: x^12 → x¹²", () => {
        expect(convertSuperscripts("x^12")).toBe("x¹²");
    });

    it("converts braced superscript: x^{12} → x¹²", () => {
        expect(convertSuperscripts("x^{12}")).toBe("x¹²");
    });

    it("converts braced with sign: e^{-n} → e⁻ⁿ", () => {
        expect(convertSuperscripts("e^{-n}")).toBe("e⁻ⁿ");
    });

    it("converts letter superscript: x^n → xⁿ", () => {
        expect(convertSuperscripts("x^n")).toBe("xⁿ");
    });

    it("handles multiple superscripts", () => {
        expect(convertSuperscripts("a^2 + b^2")).toBe("a² + b²");
    });

    it("leaves plain text unchanged", () => {
        expect(convertSuperscripts("hello world")).toBe("hello world");
    });

    it("converts x^{+} → x⁺", () => {
        expect(convertSuperscripts("x^{+}")).toBe("x⁺");
    });
});
