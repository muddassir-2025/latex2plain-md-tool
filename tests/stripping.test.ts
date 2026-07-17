import { describe, it, expect } from "vitest";
import {
    stripDisplayMath,
    stripStyleCommands,
    stripInvisibleDelimiters,
    stripFontCommands,
    stripColorCommands,
    stripCancelCommands,
    stripSout,
    stripUnderlineOverline,
    stripOverUnderBraces,
    stripPhantomCommands,
    stripAccents,
} from "../src/converter/stripping.js";

describe("stripDisplayMath", () => {
    it("strips \\[...\\] delimiters", () => {
        expect(stripDisplayMath("\\[x^2\\]")).toBe("x^2");
    });

    it("strips multiline display math", () => {
        const input = "\\[\n\\alpha + \\beta\n\\]";
        expect(stripDisplayMath(input)).toBe("\\alpha + \\beta");
    });

    it("handles multiple instances", () => {
        const input = "\\[a\\] and \\[b\\]";
        expect(stripDisplayMath(input)).toBe("a and b");
    });

    it("leaves plain text unchanged", () => {
        expect(stripDisplayMath("hello world")).toBe("hello world");
    });
});

describe("stripStyleCommands", () => {
    it("strips \\displaystyle", () => {
        expect(stripStyleCommands("\\displaystyle\\sum_{i=1}^n")).toBe("\\sum_{i=1}^n");
    });

    it("strips \\textstyle", () => {
        expect(stripStyleCommands("\\textstyle\\frac{1}{2}")).toBe("\\frac{1}{2}");
    });

    it("strips \\scriptstyle", () => {
        expect(stripStyleCommands("\\scriptstyle x")).toBe("x");
    });

    it("strips \\scriptscriptstyle", () => {
        expect(stripStyleCommands("\\scriptscriptstyle x")).toBe("x");
    });

    it("strips multiple style commands", () => {
        expect(stripStyleCommands("\\displaystyle\\textstyle x")).toBe("x");
    });
});

describe("stripInvisibleDelimiters", () => {
    it("strips \\left.", () => {
        // \left. is stripped along with trailing whitespace
        expect(stripInvisibleDelimiters("\\left. x \\right)")).toBe("x \\right)");
    });

    it("strips \\right.", () => {
        expect(stripInvisibleDelimiters("\\left( x \\right.")).toBe("\\left( x ");
    });

    it("strips both", () => {
        expect(stripInvisibleDelimiters("\\left.\\frac{1}{2}\\right.")).toBe("\\frac{1}{2}");
    });

    it("leaves plain text unchanged", () => {
        expect(stripInvisibleDelimiters("hello world")).toBe("hello world");
    });
});

describe("stripFontCommands", () => {
    it("strips \\mathrm{}", () => {
        expect(stripFontCommands("\\mathrm{sin}")).toBe("sin");
    });

    it("strips \\mathbf{}", () => {
        expect(stripFontCommands("\\mathbf{x}")).toBe("x");
    });

    it("strips \\mathit{}", () => {
        expect(stripFontCommands("\\mathit{variables}")).toBe("variables");
    });

    it("strips \\mathsf{}", () => {
        expect(stripFontCommands("\\mathsf{A}")).toBe("A");
    });

    it("strips \\mathtt{}", () => {
        expect(stripFontCommands("\\mathtt{code}")).toBe("code");
    });

    it("strips \\mathcal{}", () => {
        expect(stripFontCommands("\\mathcal{A}")).toBe("A");
    });

    it("strips \\operatorname{}", () => {
        expect(stripFontCommands("\\operatorname{argmax}")).toBe("argmax");
    });

    it("strips \\mathnormal{}", () => {
        expect(stripFontCommands("\\mathnormal{ABC}")).toBe("ABC");
    });

    it("handles nested braces in font commands", () => {
        expect(stripFontCommands("\\mathrm{f(x)}")).toBe("f(x)");
    });

    it("handles multiple font commands", () => {
        const input = "\\mathbf{x} + \\mathrm{y}";
        expect(stripFontCommands(input)).toBe("x + y");
    });

    it("leaves plain text unchanged", () => {
        expect(stripFontCommands("hello world")).toBe("hello world");
    });
});

describe("stripColorCommands", () => {
    it("strips \\color{red}{text}", () => {
        expect(stripColorCommands("\\color{red}{hello}")).toBe("hello");
    });

    it("strips \\textcolor{red}{text}", () => {
        expect(stripColorCommands("\\textcolor{blue}{world}")).toBe("world");
    });

    it("handles both color commands", () => {
        const input = "\\color{red}{a} and \\textcolor{blue}{b}";
        expect(stripColorCommands(input)).toBe("a and b");
    });

    it("leaves plain text unchanged", () => {
        expect(stripColorCommands("hello world")).toBe("hello world");
    });
});

describe("stripCancelCommands", () => {
    it("strips \\cancel{x}", () => {
        expect(stripCancelCommands("\\cancel{x}")).toBe("x");
    });

    it("strips \\cancelto{0}{x} → 0 (keep the 'to' value)", () => {
        expect(stripCancelCommands("\\cancelto{0}{x}")).toBe("0");
    });

    it("handles expressions", () => {
        expect(stripCancelCommands("\\cancel{x+y}")).toBe("x+y");
    });

    it("leaves plain text unchanged", () => {
        expect(stripCancelCommands("hello world")).toBe("hello world");
    });
});

describe("stripSout", () => {
    it("strips \\sout{text}", () => {
        expect(stripSout("\\sout{removed}")).toBe("removed");
    });

    it("leaves plain text unchanged", () => {
        expect(stripSout("hello world")).toBe("hello world");
    });
});

describe("stripUnderlineOverline", () => {
    it("strips \\underline{text}", () => {
        expect(stripUnderlineOverline("\\underline{important}")).toBe("important");
    });

    it("strips \\overline{text}", () => {
        expect(stripUnderlineOverline("\\overline{text}")).toBe("text");
    });

    it("handles both", () => {
        const input = "\\underline{a} and \\overline{b}";
        expect(stripUnderlineOverline(input)).toBe("a and b");
    });
});

describe("stripOverUnderBraces", () => {
    it("strips \\underbrace{x+y}", () => {
        expect(stripOverUnderBraces("\\underbrace{x+y}")).toBe("x+y");
    });

    it("strips \\overbrace{x+y}", () => {
        expect(stripOverUnderBraces("\\overbrace{x+y}")).toBe("x+y");
    });

    it("leaves subscript/superscript after the brace intact (handled later by pipeline)", () => {
        // _{n} and ^{n} are NOT part of the underbrace/overbrace content
        // They're sub/superscripts handled later in the pipeline
        expect(stripOverUnderBraces("\\underbrace{x+y}_{n}")).toBe("x+y_{n}");
        expect(stripOverUnderBraces("\\overbrace{x+y}^{n}")).toBe("x+y^{n}");
    });

    it("leaves plain text unchanged", () => {
        expect(stripOverUnderBraces("hello world")).toBe("hello world");
    });
});

describe("stripPhantomCommands", () => {
    it("strips \\phantom{text}", () => {
        expect(stripPhantomCommands("\\phantom{invisible}")).toBe("invisible");
    });

    it("strips \\hphantom{text}", () => {
        expect(stripPhantomCommands("\\hphantom{space}")).toBe("space");
    });

    it("strips \\vphantom{text}", () => {
        expect(stripPhantomCommands("\\vphantom{height}")).toBe("height");
    });

    it("leaves plain text unchanged", () => {
        expect(stripPhantomCommands("hello world")).toBe("hello world");
    });
});

describe("stripAccents", () => {
    it("strips \\vec{v}", () => {
        expect(stripAccents("\\vec{v}")).toBe("v");
    });

    it("strips \\hat{x}", () => {
        expect(stripAccents("\\hat{x}")).toBe("x");
    });

    it("strips \\bar{y}", () => {
        expect(stripAccents("\\bar{y}")).toBe("y");
    });

    it("strips \\tilde{z}", () => {
        expect(stripAccents("\\tilde{z}")).toBe("z");
    });

    it("strips \\dot{x}", () => {
        expect(stripAccents("\\dot{x}")).toBe("x");
    });

    it("strips \\ddot{x}", () => {
        expect(stripAccents("\\ddot{x}")).toBe("x");
    });

    it("strips \\check{x}", () => {
        expect(stripAccents("\\check{x}")).toBe("x");
    });

    it("strips \\breve{x}", () => {
        expect(stripAccents("\\breve{x}")).toBe("x");
    });

    it("strips \\acute{x}", () => {
        expect(stripAccents("\\acute{x}")).toBe("x");
    });

    it("strips \\grave{x}", () => {
        expect(stripAccents("\\grave{x}")).toBe("x");
    });

    it("handles expressions in accents", () => {
        expect(stripAccents("\\vec{AB}")).toBe("AB");
    });

    it("handles multiple accents", () => {
        const input = "\\vec{v} = \\hat{x} + \\bar{y}";
        expect(stripAccents(input)).toBe("v = x + y");
    });

    it("leaves plain text unchanged", () => {
        expect(stripAccents("hello world")).toBe("hello world");
    });
});
