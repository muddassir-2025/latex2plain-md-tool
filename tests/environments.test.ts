import { describe, it, expect } from "vitest";
import { stripEnvironments, stripHlines } from "../src/converter/environments.js";

describe("stripEnvironments", () => {
    it("strips \\begin{align}...\\end{align}", () => {
        const input = "\\begin{align}\nx &= 1 \\\\\ny &= 2\n\\end{align}";
        const result = stripEnvironments(input);
        expect(result).not.toContain("\\begin{align}");
        expect(result).not.toContain("\\end{align}");
        expect(result).toContain("x");
        expect(result).toContain("1");
    });

    it("strips \\begin{equation}...\\end{equation}", () => {
        const input = "\\begin{equation}\nE = mc^2\n\\end{equation}";
        const result = stripEnvironments(input);
        expect(result).not.toContain("\\begin{equation}");
        expect(result).not.toContain("\\end{equation}");
        expect(result).toContain("E = mc^2");
    });

    it("strips \\begin{bmatrix}...\\end{bmatrix}", () => {
        const input = "\\begin{bmatrix}\n1 & 2 \\\\\n3 & 4\n\\end{bmatrix}";
        const result = stripEnvironments(input);
        expect(result).not.toContain("\\begin{bmatrix}");
        expect(result).not.toContain("\\end{bmatrix}");
        expect(result).toContain("1");
        expect(result).toContain("2");
        expect(result).toContain("3");
        expect(result).toContain("4");
    });

    it("converts \\\\ to ; inside environments", () => {
        const input = "\\begin{matrix}\na \\\\ b\n\\end{matrix}";
        expect(stripEnvironments(input)).toBe("a ; b");
    });

    it("removes & separators inside environments", () => {
        const input = "\\begin{aligned}\nx &= 1 \\\\\ny &= 2\n\\end{aligned}";
        const result = stripEnvironments(input);
        expect(result).not.toContain("&");
    });

    it("strips \\begin{cases}...\\end{cases}", () => {
        const input = "\\begin{cases}\nx & \\text{if } a \\\\\ny & \\text{otherwise}\n\\end{cases}";
        const result = stripEnvironments(input);
        expect(result).not.toContain("\\begin{cases}");
        expect(result).not.toContain("\\end{cases}");
        expect(result).toContain("x");
        expect(result).toContain("y");
    });

    it("strips \\begin{pmatrix} environment", () => {
        const input = "\\begin{pmatrix}\n1 & 2\n\\end{pmatrix}";
        const result = stripEnvironments(input);
        expect(result).not.toContain("\\begin{pmatrix}");
        expect(result).not.toContain("\\end{pmatrix}");
    });

    it("strips \\begin{vmatrix} environment", () => {
        const input = "\\begin{vmatrix}\na & b\n\\end{vmatrix}";
        const result = stripEnvironments(input);
        expect(result).not.toContain("\\begin{vmatrix}");
        expect(result).not.toContain("\\end{vmatrix}");
    });

    it("leaves unknown environments unchanged", () => {
        const input = "\\begin{unknown}{arg}\ncontent\n\\end{unknown}";
        expect(stripEnvironments(input)).toBe(input);
    });

    it("handles multiple environments", () => {
        const input = "\\begin{align}\na = b\n\\end{align}\n\\begin{equation}\nc = d\n\\end{equation}";
        const result = stripEnvironments(input);
        expect(result).not.toContain("\\begin{align}");
        expect(result).not.toContain("\\begin{equation}");
    });

    it("leaves plain text unchanged", () => {
        expect(stripEnvironments("hello world")).toBe("hello world");
    });

    it("handles starred environments like align*", () => {
        const input = "\\begin{align*}\nx &= 1\n\\end{align*}";
        const result = stripEnvironments(input);
        expect(result).not.toContain("\\begin{align*}");
        expect(result).not.toContain("\\end{align*}");
        expect(result).toContain("x");
    });
});

describe("stripHlines", () => {
    it("strips \\hline", () => {
        expect(stripHlines("\\hline")).toBe("");
    });

    it("strips \\hline with trailing space", () => {
        expect(stripHlines("\\hline ")).toBe("");
    });

    it("strips \\hdashline", () => {
        expect(stripHlines("\\hdashline")).toBe("");
    });

    it("leaves plain text unchanged", () => {
        expect(stripHlines("hello world")).toBe("hello world");
    });
});
