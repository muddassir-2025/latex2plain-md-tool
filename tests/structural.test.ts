import { describe, it, expect } from "vitest";
import { convertOver, convertChoose, convertAtop } from "../src/converter/structural.js";

describe("convertOver", () => {
    it("converts {a \\over b} → a/b", () => {
        expect(convertOver("{a \\over b}")).toBe("a/b");
    });

    it("converts {n \\over 2} → n/2", () => {
        expect(convertOver("{n \\over 2}")).toBe("n/2");
    });

    it("wraps complex expressions: {a+b \\over c+d} → (a+b)/(c+d)", () => {
        expect(convertOver("{a+b \\over c+d}")).toBe("(a+b)/(c+d)");
    });

    it("leaves plain text unchanged", () => {
        expect(convertOver("hello world")).toBe("hello world");
    });
});

describe("convertChoose", () => {
    it("converts {n \\choose k} → C(n,k)", () => {
        expect(convertChoose("{n \\choose k}")).toBe("C(n,k)");
    });

    it("converts {N \\choose R} → C(N,R)", () => {
        expect(convertChoose("{N \\choose R}")).toBe("C(N,R)");
    });

    it("leaves plain text unchanged", () => {
        expect(convertChoose("hello world")).toBe("hello world");
    });
});

describe("convertAtop", () => {
    it("converts {a \\atop b} → a / b", () => {
        expect(convertAtop("{a \\atop b}")).toBe("a / b");
    });

    it("wraps complex expressions", () => {
        expect(convertAtop("{a+b \\atop c+d}")).toBe("(a+b) / (c+d)");
    });

    it("leaves plain text unchanged", () => {
        expect(convertAtop("hello world")).toBe("hello world");
    });
});
