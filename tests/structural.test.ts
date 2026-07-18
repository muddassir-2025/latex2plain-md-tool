import { describe, it, expect } from "vitest";
import { convertOver, convertChoose, convertAtop, convertBinom, convertPmod } from "../src/converter/structural.js";

// ─── \over ───────────────────────────────────────────────────────────────────

describe("convertOver", () => {
    it("converts {a \\over b} → (a/b)", () => {
        expect(convertOver("{a \\over b}")).toBe("(a/b)");
    });

    it("converts {n \\over 2} → (n/2)", () => {
        expect(convertOver("{n \\over 2}")).toBe("(n/2)");
    });

    it("wraps complex expressions: {a+b \\over c+d} → ((a+b)/(c+d))", () => {
        expect(convertOver("{a+b \\over c+d}")).toBe("((a+b)/(c+d))");
    });

    it("converts nested fraction: {a \\over \\frac{b}{c}} → (a/(b/c))", () => {
        expect(convertOver("{a \\over \\frac{b}{c}}")).toBe("(a/(b/c))");
    });

    it("converts nested root: {\\sqrt{a} \\over b} → ((√a)/b)", () => {
        expect(convertOver("{\\sqrt{a} \\over b}")).toBe("((√a)/b)");
    });

    it("leaves plain text unchanged", () => {
        expect(convertOver("hello world")).toBe("hello world");
    });
});

// ─── \choose ─────────────────────────────────────────────────────────────────

describe("convertChoose", () => {
    it("converts {n \\choose k} → C(n,k)", () => {
        expect(convertChoose("{n \\choose k}")).toBe("C(n,k)");
    });

    it("converts {N \\choose R} → C(N,R)", () => {
        expect(convertChoose("{N \\choose R}")).toBe("C(N,R)");
    });

    it("converts nested fraction: {\\frac{a}{b} \\choose c} → C((a/b),c)", () => {
        expect(convertChoose("{\\frac{a}{b} \\choose c}")).toBe("C((a/b),c)");
    });

    it("converts nested root: {\\sqrt{a} \\choose b} → C(√a,b)", () => {
        expect(convertChoose("{\\sqrt{a} \\choose b}")).toBe("C(√a,b)");
    });

    it("leaves plain text unchanged", () => {
        expect(convertChoose("hello world")).toBe("hello world");
    });
});

// ─── \atop ───────────────────────────────────────────────────────────────────

describe("convertAtop", () => {
    it("converts {a \\atop b} → (a / b)", () => {
        expect(convertAtop("{a \\atop b}")).toBe("(a / b)");
    });

    it("wraps complex expressions", () => {
        expect(convertAtop("{a+b \\atop c+d}")).toBe("((a+b) / (c+d))");
    });

    it("converts nested fraction: {a \\atop \\frac{b}{c}} → (a / (b/c))", () => {
        expect(convertAtop("{a \\atop \\frac{b}{c}}")).toBe("(a / (b/c))");
    });

    it("converts nested root: {\\sqrt{a} \\atop b} → ((√a) / b)", () => {
        expect(convertAtop("{\\sqrt{a} \\atop b}")).toBe("((√a) / b)");
    });

    it("leaves plain text unchanged", () => {
        expect(convertAtop("hello world")).toBe("hello world");
    });
});

// ─── \binom ──────────────────────────────────────────────────────────────────

describe("convertBinom", () => {
    it("converts \\binom{n}{k} → C(n,k)", () => {
        expect(convertBinom("\\binom{n}{k}")).toBe("C(n,k)");
    });

    it("converts nested fraction: \\binom{\\frac{1}{2}}{3} → C((1/2),3)", () => {
        expect(convertBinom("\\binom{\\frac{1}{2}}{3}")).toBe("C((1/2),3)");
    });

    it("converts nested root: \\binom{\\sqrt{a}}{b} → C(√a,b)", () => {
        expect(convertBinom("\\binom{\\sqrt{a}}{b}")).toBe("C(√a,b)");
    });

    it("leaves plain text unchanged", () => {
        expect(convertBinom("hello world")).toBe("hello world");
    });
});

// ─── \pmod ───────────────────────────────────────────────────────────────────

describe("convertPmod", () => {
    it("converts \\pmod{n} → (mod n)", () => {
        expect(convertPmod("\\pmod{n}")).toBe("(mod n)");
    });

    it("converts nested fraction: \\pmod{\\frac{a}{b}} → (mod (a/b))", () => {
        expect(convertPmod("\\pmod{\\frac{a}{b}}")).toBe("(mod (a/b))");
    });

    it("converts nested root: \\pmod{\\sqrt{a}} → (mod √a)", () => {
        expect(convertPmod("\\pmod{\\sqrt{a}}")).toBe("(mod √a)");
    });

    it("leaves plain text unchanged", () => {
        expect(convertPmod("hello world")).toBe("hello world");
    });
});
