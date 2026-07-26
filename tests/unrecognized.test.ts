import { describe, it, expect } from "vitest";
import { markUnrecognized } from "../src/converter/unrecognized.js";

describe("markUnrecognized — basic detection", () => {
    it("flags unknown \\commandName", () => {
        const result = markUnrecognized("Some text \\unknownCommand here");
        expect(result).toContain("latex-error");
        expect(result).toContain("unknownCommand");
        // The raw command appears inside the error span — that's correct
        expect(result).toMatch(/unknownCommand[^<]*<\/code>/);
    });

    it("flags unknown \\commandName{with args} — shows salvaged content", () => {
        const result = markUnrecognized("Before \\myCommand{arg1} after");
        expect(result).toContain("latex-error");
        // The command name is stripped; only braced content is displayed (salvaged)
        expect(result).not.toContain("myCommand");
        expect(result).toContain("arg1");
    });

    it("flags multiple unknown commands — shows salvaged content", () => {
        const result = markUnrecognized("\\first{x} and \\second{y}");
        // Count actual error span elements
        expect(result.match(/class="latex-error"/g)).toHaveLength(2);
        // Command names are stripped; only braced content shown
        expect(result).not.toContain("first");
        expect(result).not.toContain("second");
        expect(result).toContain("x");
        expect(result).toContain("y");
    });

    it("flags command with star variant — shows salvaged content", () => {
        const result = markUnrecognized("\\myCommand*{arg}");
        expect(result).toContain("latex-error");
        // Command name is stripped; only braced content displayed
        expect(result).not.toContain("myCommand*");
        expect(result).toContain("arg");
    });

    it("flags command with optional and mandatory args — shows only braced content", () => {
        const result = markUnrecognized("\\myCmd[opt]{arg}");
        expect(result).toContain("latex-error");
        // Optional args are discarded; only braced content is salvaged
        expect(result).not.toContain("opt");
        expect(result).toContain("arg");
    });

    it("flags command with nested braces — shows full inner content", () => {
        const result = markUnrecognized("\\myCmd{outer{inner}}");
        expect(result).toContain("latex-error");
        // Nested braces are preserved in the salvaged content
        expect(result).toContain("outer{inner}");
    });

    it("flags command with multiple braced args — joins with comma", () => {
        const result = markUnrecognized("\\myCmd{a}{b}{c}");
        expect(result).toContain("latex-error");
        // Multiple braced args are joined with ", " in the salvaged output
        expect(result).toContain("a, b, c");
    });
});

describe("markUnrecognized — non-command patterns are left alone", () => {
    it("ignores backslash + non-letter like \\# \\% \\$", () => {
        const result = markUnrecognized("Price: \\$10 \\% off \\#1");
        expect(result).not.toContain("latex-error");
    });

    it("ignores backslash followed by space", () => {
        const result = markUnrecognized("This is not a command: \\ ");
        expect(result).not.toContain("latex-error");
    });

    it("ignores single backslash at end", () => {
        const result = markUnrecognized("Line break\\\\");
        expect(result).not.toContain("latex-error");
    });

    it("flags \\quad (correctly — it looks like a command to the detector)", () => {
        // \\quad is converted by the pipeline before this step runs,
        // but if called directly, the detector flags it (correct behavior)
        // Note: space before \\quad is required so lookbehind doesn't see a word char
        const result = markUnrecognized("Some text \\quad here");
        expect(result).toContain("latex-error");
    });
});

describe("markUnrecognized — formatting of error markers", () => {
    it("wraps in <span class=\"latex-error\">", () => {
        const result = markUnrecognized("\\unknown{x}");
        expect(result).toMatch(/<span class="latex-error">/);
        expect(result).toMatch(/<\/span>/);
    });

    it("includes warning emoji label", () => {
        const result = markUnrecognized("\\unknown{x}");
        expect(result).toContain("⚠️");
    });

    it("escapes HTML in the error output", () => {
        const result = markUnrecognized("\\cmd{<script>}");
        expect(result).not.toContain("<script>");
        expect(result).toContain("&lt;script&gt;");
    });

    it("leaves normal text unchanged", () => {
        const result = markUnrecognized("Normal text with no commands.");
        expect(result).toBe("Normal text with no commands.");
    });

    it("leaves already-converted Unicode alone", () => {
        const result = markUnrecognized("Formula: ∫ x² dx = ∞");
        expect(result).toContain("∫");
        expect(result).toContain("∞");
        expect(result).toContain("x²");
    });
});

describe("markUnrecognized — edge cases", () => {
    it("handles empty string", () => {
        expect(markUnrecognized("")).toBe("");
    });

    it("handles string with only a backslash", () => {
        const result = markUnrecognized("\\");
        expect(result).not.toContain("latex-error");
    });

    it("handles command at end of string without braces", () => {
        const result = markUnrecognized("Ends with \\unknown");
        expect(result).toContain("latex-error");
        expect(result).toContain("unknown");
    });

    it("handles command immediately followed by punctuation", () => {
        const result = markUnrecognized("See \\unknown.");
        expect(result).toContain("latex-error");
        expect(result).toContain("unknown");
    });

    it("handles math expression in $$ that contains unknown command", () => {
        // $$ delimiters are stripped by the pipeline, so the content inside
        // would be scanned. An unknown command like \unknown inside would be flagged.
        const result = markUnrecognized("\\unknown{x}");
        expect(result).toContain("latex-error");
    });
});
