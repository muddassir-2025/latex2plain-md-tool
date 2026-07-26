import { describe, it, expect } from "vitest";
import { convert } from "../src/converter/index.js";
import { protectUrls, restoreUrls } from "../src/converter/protect-urls.js";

// ─── URL protection ─────────────────────────────────────────────────────────

describe("protectUrls", () => {
    it("protects a standalone HTTPS URL with underscore", () => {
        const input = "Visit https://example.com/page_name for info.";
        const { text, blocks } = protectUrls(input);
        // URL should be replaced with placeholder
        expect(text).toContain("@@URL-");
        expect(text).not.toContain("page_name");
        expect(blocks.length).toBeGreaterThan(0);
    });

    it("protects a markdown link with underscore in URL", () => {
        const input = "Click [here](https://example.com/page_name)";
        const { text, blocks } = protectUrls(input);
        expect(text).toContain("@@URL-");
        expect(text).not.toContain("page_name");
    });

    it("protects a markdown image", () => {
        const input = "![logo](https://example.com/my_image.png)";
        const { text, blocks } = protectUrls(input);
        expect(text).toContain("@@URL-");
        expect(text).not.toContain("my_image");
    });

    it("restores protected URLs back to original", () => {
        const input = "Visit https://example.com/page_name";
        const { text, blocks } = protectUrls(input);
        const restored = restoreUrls(text, blocks);
        expect(restored).toBe(input);
    });

    it("protects multiple URLs with unique placeholders", () => {
        const input = "A https://a.com/b_c and B https://b.com/d_e";
        const { text, blocks } = protectUrls(input);
        expect(blocks.length).toBe(2);
        const restored = restoreUrls(text, blocks);
        expect(restored).toBe(input);
    });

    it("protects autolinks: <https://example.com>", () => {
        const input = "Visit <https://example.com/page_name>";
        const { text, blocks } = protectUrls(input);
        expect(text).toContain("@@URL-");
        const restored = restoreUrls(text, blocks);
        expect(restored).toBe(input);
    });

    it("protects reference-style links", () => {
        const input = "See [text][ref] for details.\n\n[ref]: https://example.com";
        const { text, blocks } = protectUrls(input);
        expect(text).toContain("@@URL-");
        expect(text).not.toContain("[text][ref]");
        const restored = restoreUrls(text, blocks);
        expect(restored).toBe(input);
    });
});

// ─── Inline code preservation ───────────────────────────────────────────────

describe("inline code preservation", () => {
    it("preserves LaTeX-looking text inside inline code", () => {
        const input = "Use `\\frac{x}{y}` to calculate the value.";
        const output = convert(input);
        // Inline code content should be preserved literally
        expect(output).toContain("\\frac{x}{y}");
        // The `frac` should NOT be converted to fraction format
        expect(output).not.toContain("(x/y)");
    });

    it("preserves dollar signs inside inline code", () => {
        const input = "The variable `$name` is set.";
        const output = convert(input);
        expect(output).toContain("$name");
    });

    it("preserves underscores inside inline code", () => {
        const input = "Use `variable_name` for the value.";
        const output = convert(input);
        // The underscore should NOT be converted to subscript
        expect(output).toContain("variable_name");
        expect(output).not.toContain("variableₙ");
    });

    it("preserves curly braces inside inline code", () => {
        const input = "The `{key: value}` object.";
        const output = convert(input);
        expect(output).toContain("{key: value}");
    });

    it("preserves stars inside inline code", () => {
        const input = "Use `*ptr` to dereference.";
        const output = convert(input);
        expect(output).toContain("*ptr");
    });

    it("preserves backslashes inside inline code", () => {
        const input = "Path is `C:\\Users\\name`";
        const output = convert(input);
        expect(output).toContain("C:\\Users\\name");
    });
});

// ─── URL underscore preservation (via pipeline) ─────────────────────────────

describe("URL underscore preservation", () => {
    it("preserves underscores in standalone URLs", () => {
        const input = "Visit https://example.com/page_name for details.";
        const output = convert(input);
        // Underscore in URL should NOT be converted to subscript
        expect(output).toContain("page_name");
        expect(output).not.toContain("pageₙ");
    });

    it("preserves underscores in markdown link URLs", () => {
        const input = "Click [here](https://example.com/page_name)";
        const output = convert(input);
        expect(output).toContain("page_name");
        expect(output).not.toContain("pageₙ");
    });

    it("preserves multiple URLs in one line", () => {
        const input = "A https://a.com/x_y and B https://b.com/x_y";
        const output = convert(input);
        expect(output).toContain("x_y");
    });

    it("preserves URLs with query parameters", () => {
        const input = "See https://example.com?page=1&name=test";
        const output = convert(input);
        expect(output).toContain("?page=1&name=test");
    });
});

// ─── Word underscore preservation ───────────────────────────────────────────

describe("word underscore preservation", () => {
    it("preserves underscores in regular text words", () => {
        const input = "The variable name is underscore_in_words.";
        const output = convert(input);
        // Underscore between two word parts should NOT be converted
        expect(output).toContain("underscore_in_words");
    });

    it("still converts LaTeX subscripts correctly", () => {
        const input = "The value $x_0$ is the initial state.";
        const output = convert(input);
        // x_0 should become x₀ (actual subscript)
        expect(output).toContain("x₀");
    });

    it("converts LaTeX subscripts with single letters", () => {
        const input = "Variables $x_i$ and $y_j$ are used.";
        const output = convert(input);
        expect(output).toContain("xᵢ");
        expect(output).toContain("yⱼ");
    });

    it("converts LaTeX subscripts with digits", () => {
        const input = "The value $a_1 + b_2$.";
        const output = convert(input);
        expect(output).toContain("a₁");
        expect(output).toContain("b₂");
    });

    it("preserves underscores in file names", () => {
        const input = "Save to my_file_name.txt";
        const output = convert(input);
        expect(output).toContain("my_file_name.txt");
    });
});

// ─── Markdown heading preservation ──────────────────────────────────────────

describe("heading preservation", () => {
    it("preserves H1 heading markers", () => {
        const input = "# Title";
        const output = convert(input);
        expect(output.startsWith("#")).toBe(true);
    });

    it("preserves H2 heading markers", () => {
        const input = "## Subtitle";
        const output = convert(input);
        expect(output.startsWith("##")).toBe(true);
    });

    it("preserves H3 heading markers", () => {
        const input = "### Section";
        const output = convert(input);
        expect(output.startsWith("###")).toBe(true);
    });

    it("converts LaTeX inside heading text", () => {
        const input = "## The formula $x^2$ is correct";
        const output = convert(input);
        expect(output).toContain("## The formula x² is correct");
    });
});

// ─── Markdown list preservation ─────────────────────────────────────────────

describe("list preservation", () => {
    it("preserves unordered list markers", () => {
        const input = "- Item 1\n- Item 2\n- Item 3";
        const output = convert(input);
        expect(output).toContain("- Item 1");
        expect(output).toContain("- Item 2");
        expect(output).toContain("- Item 3");
    });

    it("preserves ordered list markers", () => {
        const input = "1. First\n2. Second\n3. Third";
        const output = convert(input);
        expect(output).toContain("1. First");
        expect(output).toContain("2. Second");
        expect(output).toContain("3. Third");
    });

    it("preserves nested lists", () => {
        const input = "- Item 1\n  - Nested A\n  - Nested B\n- Item 2";
        const output = convert(input);
        expect(output).toContain("- Item 1");
        expect(output).toContain("- Nested A");
        expect(output).toContain("- Nested B");
        expect(output).toContain("- Item 2");
    });
});

// ─── Blockquote preservation ────────────────────────────────────────────────

describe("blockquote preservation", () => {
    it("preserves blockquote markers", () => {
        const input = "> This is a quote.\n> It has two lines.";
        const output = convert(input);
        expect(output).toContain("> This is a quote.");
        expect(output).toContain("> It has two lines.");
    });

    it("converts LaTeX inside blockquote text", () => {
        const input = "> The equation $\\alpha + \\beta = \\gamma$";
        const output = convert(input);
        expect(output).toContain("> The equation");
        expect(output).toContain("α + β = γ");
    });
});

// ─── Table preservation ─────────────────────────────────────────────────────

describe("table preservation", () => {
    it("preserves table structure", () => {
        const input = "| Name | Age |\n|------|-----|\n| Ali  | 20  |\n| Omar | 21  |";
        const output = convert(input);
        // Table pipes and structure are preserved (spaces may be normalized by cleanup)
        expect(output).toContain("|");
        expect(output).toContain("Name");
        expect(output).toContain("Age");
        expect(output).toContain("Ali");
        expect(output).toContain("20");
        expect(output).toContain("Omar");
        expect(output).toContain("21");
        // Dashes for separator row preserved
        expect(output).toContain("---");
    });

    it("converts LaTeX inside table cells", () => {
        const input = "| $\\alpha$ | $\\beta$ |\n|-----------|----------|\n| 1 | 2 |";
        const output = convert(input);
        expect(output).toContain("| α | β |");
    });
});

// ─── Horizontal rule preservation ───────────────────────────────────────────

describe("horizontal rule preservation", () => {
    it("preserves three dashes as horizontal rule", () => {
        const input = "Before\n\n---\n\nAfter";
        const output = convert(input);
        expect(output).toContain("---");
    });

    it("preserves three stars as horizontal rule", () => {
        const input = "Before\n\n***\n\nAfter";
        const output = convert(input);
        expect(output).toContain("***");
    });

    it("preserves three underscores as horizontal rule", () => {
        const input = "Before\n\n___\n\nAfter";
        const output = convert(input);
        expect(output).toContain("___");
    });
});

// ─── Link preservation ──────────────────────────────────────────────────────

describe("link preservation", () => {
    it("preserves markdown link syntax", () => {
        const input = "OpenAI [website](https://openai.com) is here.";
        const output = convert(input);
        expect(output).toContain("[website](https://openai.com)");
    });

    it("preserves URLs with special characters in links", () => {
        const input = "Search [Google](https://google.com?q=test&lang=en)";
        const output = convert(input);
        expect(output).toContain("[Google](https://google.com?q=test&lang=en)");
    });
});

// ─── Image preservation ─────────────────────────────────────────────────────

describe("image preservation", () => {
    it("preserves markdown image syntax", () => {
        const input = "![Logo](https://example.com/logo.png)";
        const output = convert(input);
        expect(output).toContain("![Logo](https://example.com/logo.png)");
    });

    it("preserves image with underscores in path", () => {
        const input = "![my_image](https://example.com/my_image.png)";
        const output = convert(input);
        // Underscores in image URL should be preserved
        expect(output).toContain("my_image");
        expect(output).not.toContain("myᵢ"); // no subscript conversion
    });
});

// ─── Raw HTML preservation ────────────────────────────────────────────────

describe("raw HTML preservation", () => {
    it("preserves HTML tags with underscore attributes", () => {
        const input = "Use <span class=\"page_name\">text</span> with underscores.";
        const output = convert(input);
        // HTML tag and its attribute should be preserved
        expect(output).toContain("page_name");
        expect(output).not.toContain("pageₙ");
    });

    it("preserves HTML div tags", () => {
        const input = "<div>content</div>";
        const output = convert(input);
        expect(output).toContain("<div>");
        expect(output).toContain("</div>");
    });

    it("preserves HTML with underscores in class names", () => {
        const input = "<div class=\"my_class\" id=\"my_id\">content</div>";
        const output = convert(input);
        expect(output).toContain("my_class");
        expect(output).toContain("my_id");
    });
});

// ─── Paragraph structure preservation ───────────────────────────────────────

describe("paragraph structure preservation", () => {
    it("preserves blank lines between paragraphs", () => {
        const input = "Paragraph one.\n\nParagraph two.";
        const output = convert(input);
        expect(output).toContain("Paragraph one.");
        expect(output).toContain("Paragraph two.");
    });

    it("does not merge paragraphs", () => {
        const input = "First line.\n\nSecond line.";
        const output = convert(input);
        // There should be a blank line between the two paragraphs
        const lines = output.split("\n");
        const idx1 = lines.findIndex((l: string) => l.includes("First line."));
        const idx2 = lines.findIndex((l: string) => l.includes("Second line."));
        expect(idx1).toBeGreaterThanOrEqual(0);
        expect(idx2).toBeGreaterThan(idx1);
        // There should be blank lines between the paragraphs
        expect(lines.some((l: string) => l === "" && lines.indexOf(l) > idx1 && lines.indexOf(l) < idx2)).toBe(true);
    });
});

// ─── LaTeX-only conversion ──────────────────────────────────────────────────

describe("LaTeX conversion in normal text", () => {
    it("converts dollar-delimited math", () => {
        const input = "The equation is $x^2 + y^2 = z^2$.";
        const output = convert(input);
        expect(output).toContain("x²");
        expect(output).toContain("y²");
        expect(output).toContain("z²");
    });

    it("converts fractions in normal text", () => {
        const input = "The fraction $\\frac{a}{b}$ is simplified.";
        const output = convert(input);
        expect(output).toContain("(a/b)");
    });

    it("converts Greek letters in normal text", () => {
        const input = "The angle $\\theta$ is 90 degrees.";
        const output = convert(input);
        expect(output).toContain("θ");
    });
});

// ─── Realistic mixed document ───────────────────────────────────────────────

describe("realistic mixed document", () => {
    it("preserves all structures in a realistic document", () => {
        // Build input piece by piece to avoid template literal escaping issues
        const parts: string[] = [
            "# Math and Code Document",
            "",
            "## Introduction",
            "",
            "This document contains $\\alpha + \\beta = \\gamma$ and some code.",
            "",
            "## Examples",
            "",
            "Here is a C++ function:",
            "",
            "```cpp",
            "int factorial(int n) {",
            "    if (n <= 1) return 1;",
            "    return n * factorial(n - 1);",
            "}",
            "```",
            "",
            "## Variables",
            "",
            "The value $x_i$ depends on $x_{i-1}$.",
            "",
            "> **Note:** The formula $E = mc^2$ is famous.",
            "",
            "## Links",
            "",
            "Visit [GitHub](https://github.com) for more code.",
            "",
            "![Logo](https://example.com/logo.png)",
            "",
            "## List",
            "",
            "- First item with $\\theta$",
            "- Second item",
            "  - Nested A",
            "  - Nested B",
            "",
            "## Table",
            "",
            "| Symbol | Value |",
            "|--------|-------|",
            "| $\\pi$ | 3.14  |",
            "| $e$    | 2.71  |",
            "",
            "---",
            "",
            "The end.",
        ];
        const input = parts.join("\n");
        const output = convert(input);

        // Headings preserved
        expect(output).toContain("# Math and Code Document");
        expect(output).toContain("## Introduction");
        expect(output).toContain("## Examples");
        expect(output).toContain("## Variables");
        expect(output).toContain("## Links");
        expect(output).toContain("## List");
        expect(output).toContain("## Table");

        // Code blocks preserved
        expect(output).toContain("```cpp");
        expect(output).toContain("int factorial(int n)");

        // Math converted
        expect(output).toContain("α + β = γ");
        expect(output).toContain("xᵢ");
        expect(output).toContain("mc²");

        // Blockquote preserved
        expect(output).toContain("> **Note:**");

        // Link preserved
        expect(output).toContain("[GitHub](https://github.com)");

        // List preserved
        expect(output).toContain("- First item");
        expect(output).toContain("- Second item");
        expect(output).toContain("- Nested A");

        // Table preserved
        // Table structure preserved
        expect(output).toContain("|");
        expect(output).toContain("Symbol");
        expect(output).toContain("Value");
        expect(output).toContain("π");
        expect(output).toContain("3.14");

        // Horizontal rule preserved
        expect(output).toContain("---");
    });
});
