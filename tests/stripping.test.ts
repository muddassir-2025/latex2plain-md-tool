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
    stripBoxes,
    stripPhantomCommands,
    stripAccents,
    stripExtensibleArrows,
} from "../src/converter/stripping.js";

describe("stripDisplayMath", () => {
    it("strips \\[...\\] delimiters", () => {
        expect(stripDisplayMath("\\[x^2\\]")).toBe("x^2");
    });
    it("strips multiline display math", () => {
        expect(stripDisplayMath("\\[\n\\alpha + \\beta\n\\]")).toBe("\\alpha + \\beta");
    });
    it("handles multiple instances", () => {
        expect(stripDisplayMath("\\[a\\] and \\[b\\]")).toBe("a and b");
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
    it("strips multiple", () => {
        expect(stripStyleCommands("\\displaystyle\\textstyle x")).toBe("x");
    });
});

describe("stripInvisibleDelimiters", () => {
    it("strips \\left.", () => {
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
    it("strips \\mathnormal{}", () => {
        expect(stripFontCommands("\\mathnormal{ABC}")).toBe("ABC");
    });
    it("strips \\mathcal{}", () => {
        expect(stripFontCommands("\\mathcal{A}")).toBe("A");
    });
    it("strips \\operatorname{}", () => {
        expect(stripFontCommands("\\operatorname{argmax}")).toBe("argmax");
    });
    it("strips \\boldsymbol{}", () => {
        expect(stripFontCommands("\\boldsymbol{x}")).toBe("x");
    });
    it("strips \\textbf{}", () => {
        expect(stripFontCommands("\\textbf{bold}")).toBe("bold");
    });
    it("strips \\textit{}", () => {
        expect(stripFontCommands("\\textit{italic}")).toBe("italic");
    });
    it("strips \\textrm{}", () => {
        expect(stripFontCommands("\\textrm{roman}")).toBe("roman");
    });
    it("strips \\emph{}", () => {
        expect(stripFontCommands("\\emph{emphasized}")).toBe("emphasized");
    });
    it("handles nested braces", () => {
        expect(stripFontCommands("\\textbf{f(x)}")).toBe("f(x)");
    });
    it("handles multiple font commands", () => {
        expect(stripFontCommands("\\mathbf{x} + \\mathrm{y}")).toBe("x + y");
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
    it("handles both", () => {
        expect(stripColorCommands("\\color{red}{a} and \\textcolor{blue}{b}")).toBe("a and b");
    });
    it("leaves plain text unchanged", () => {
        expect(stripColorCommands("hello world")).toBe("hello world");
    });
});

describe("stripCancelCommands", () => {
    it("strips \\cancel{x}", () => {
        expect(stripCancelCommands("\\cancel{x}")).toBe("x");
    });
    it("strips \\cancelto{0}{x} → 0", () => {
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
        expect(stripUnderlineOverline("\\underline{a} and \\overline{b}")).toBe("a and b");
    });
});

describe("stripOverUnderBraces", () => {
    it("strips \\underbrace{x+y}", () => {
        expect(stripOverUnderBraces("\\underbrace{x+y}")).toBe("x+y");
    });
    it("strips \\overbrace{x+y}", () => {
        expect(stripOverUnderBraces("\\overbrace{x+y}")).toBe("x+y");
    });
    it("leaves sub/superscript intact", () => {
        expect(stripOverUnderBraces("\\underbrace{x+y}_{n}")).toBe("x+y_{n}");
        expect(stripOverUnderBraces("\\overbrace{x+y}^{n}")).toBe("x+y^{n}");
    });
    it("leaves plain text unchanged", () => {
        expect(stripOverUnderBraces("hello world")).toBe("hello world");
    });
});

describe("stripBoxes", () => {
    it("strips \\boxed{text}", () => {
        expect(stripBoxes("\\boxed{y=C1+C2e^{-x}}")).toBe("y=C1+C2e^{-x}");
    });
    it("strips \\fbox{text}", () => {
        expect(stripBoxes("\\fbox{content}")).toBe("content");
    });
    it("strips multiline boxed", () => {
        const input = "\\boxed{\ny=C1+C2e^{-x}+1/3x^3+4x\n}";
        expect(stripBoxes(input)).toBe("\ny=C1+C2e^{-x}+1/3x^3+4x\n");
    });
    it("leaves plain text unchanged", () => {
        expect(stripBoxes("hello world")).toBe("hello world");
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
    it("strips \\widehat{AB}", () => {
        expect(stripAccents("\\widehat{AB}")).toBe("AB");
    });
    it("strips \\widetilde{AB}", () => {
        expect(stripAccents("\\widetilde{AB}")).toBe("AB");
    });
    it("handles expressions in accents", () => {
        expect(stripAccents("\\vec{AB}")).toBe("AB");
    });
    it("handles multiple accents", () => {
        expect(stripAccents("\\vec{v} = \\hat{x} + \\bar{y}")).toBe("v = x + y");
    });
    it("leaves plain text unchanged", () => {
        expect(stripAccents("hello world")).toBe("hello world");
    });
});

describe("stripExtensibleArrows", () => {
    it("strips \\xrightarrow{text} → text", () => {
        expect(stripExtensibleArrows("\\xrightarrow{n \\to \\infty}")).toBe("n \\to \\infty");
    });
    it("strips \\xleftarrow{text} → text", () => {
        expect(stripExtensibleArrows("\\xleftarrow{text}")).toBe("text");
    });
    it("leaves plain text unchanged", () => {
        expect(stripExtensibleArrows("hello world")).toBe("hello world");
    });
});
