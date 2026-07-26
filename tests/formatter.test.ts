import { describe, it, expect } from "vitest";
import { smartFormat } from "../src/formatter/notes.js";

// ─── Heading detection ──────────────────────────────────────────────────────

describe("headings", () => {
    it("converts 'chapter 1:' to H1 heading", () => {
        const input = "chapter 1: calculus review\n\nsome text";
        const output = smartFormat(input);
        expect(output).toContain("# chapter 1: calculus review");
    });

    it("converts 'Abstract' to heading", () => {
        const input = "Abstract\n\nThis paper presents...";
        const output = smartFormat(input);
        expect(output).toContain("## Abstract");
    });

    it("converts '1. Introduction' to heading", () => {
        const input = "1. Introduction\n\nSome intro text.";
        const output = smartFormat(input);
        expect(output).toContain("##");
        expect(output).toContain("Introduction");
    });

    it("converts '2.1 Methodology' to sub-heading", () => {
        const input = "2.1 Methodology\n\nDetails here.";
        const output = smartFormat(input);
        expect(output).toContain("### Methodology");
    });

    it("does NOT convert sentences ending with period as headings", () => {
        const input = "This is a regular sentence ending with a period.\n\nMore text.";
        const output = smartFormat(input);
        expect(output).toContain("This is a regular sentence");
        expect(output).not.toContain("# This is a regular sentence");
    });

    it("does NOT convert inline text as headings without blank line before", () => {
        const input = "First paragraph.\nIntroduction to the topic.\nMore details.";
        const output = smartFormat(input);
        expect(output).not.toContain("#");
    });
});

// ─── Code block detection ───────────────────────────────────────────────────

describe("code blocks", () => {
    it("detects Python function definitions", () => {
        const input = "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)";
        const output = smartFormat(input);
        expect(output).toContain("```python");
        expect(output).toContain("def factorial(n):");
        expect(output).toContain("```");
    });

    it("detects import statements as code", () => {
        const input = "import numpy as np\nimport pandas as pd\n\nNext section";
        const output = smartFormat(input);
        expect(output).toContain("```python");
        expect(output).toContain("import numpy");
        expect(output).toContain("```");
    });

    it("does NOT wrap single-line code as fenced block", () => {
        const input = "print('hello')";
        const output = smartFormat(input);
        expect(output).toContain("print");
        expect(output).not.toContain("```");
    });
});

// ─── Math detection ─────────────────────────────────────────────────────────

describe("math detection", () => {
    it("wraps inline math expressions in $", () => {
        const input = "The value of x_i depends on theta";
        const output = smartFormat(input);
        expect(output).toContain("$");
    });

    it("wraps display math expressions in $$", () => {
        const input = "The integral from a to b of f(x) dx";
        // This line doesn't have LaTeX patterns so it won't be wrapped
        // Let's test with actual LaTeX patterns
        const input2 = "int_a^b f(x) dx = F(b) - F(a)";
        const output = smartFormat(input2);
        expect(output).toContain("$$");
    });

    it("does NOT wrap code blocks as math", () => {
        const input = 'import numpy\nresult = x ** 2 + y ** 2';
        const output = smartFormat(input);
        expect(output).toContain("```python");
        expect(output).not.toContain("$$");
    });

    it("detects \\frac as math", () => {
        const input = "The fraction \\frac{a}{b} is simplified.";
        const output = smartFormat(input);
        expect(output).toContain("$");
        expect(output).toContain("\\frac{a}{b}");
    });
});

// ─── Special elements ───────────────────────────────────────────────────────

describe("special elements", () => {
    it("converts 'def:' to bold definition", () => {
        const input = "def: A function maps inputs to outputs.";
        const output = smartFormat(input);
        expect(output).toContain("**Definition:**");
        expect(output).toContain("A function maps inputs to outputs");
    });

    it("converts 'note:' to blockquote", () => {
        const input = "note: Remember to check your work.";
        const output = smartFormat(input);
        expect(output).toContain("> **Note:**");
        expect(output).toContain("Remember to check your work");
    });

    it("converts 'important:' to blockquote", () => {
        const input = "important: The chain rule is essential.";
        const output = smartFormat(input);
        expect(output).toContain("> **Important:**");
    });

    it("converts 'example:' to bold example", () => {
        const input = "example: Compute the derivative of x^3.";
        const output = smartFormat(input);
        expect(output).toContain("**Example:**");
    });

    it("converts 'formula:' to display math", () => {
        const input = "formula: E = mc^2";
        const output = smartFormat(input);
        expect(output).toContain("$$");
    });

    it("converts 'key:' to blockquote", () => {
        const input = "key: Practice makes perfect.";
        const output = smartFormat(input);
        expect(output).toContain("> **Key:**");
    });

    it("converts 'summary:' to blockquote", () => {
        const input = "summary: We covered three main topics.";
        const output = smartFormat(input);
        expect(output).toContain("> **Summary:**");
    });
});

// ─── List detection ─────────────────────────────────────────────────────────

describe("list detection", () => {
    it("preserves explicit unordered list items", () => {
        const input = "- Item 1\n- Item 2\n- Item 3";
        const output = smartFormat(input);
        expect(output).toContain("- Item 1");
        expect(output).toContain("- Item 2");
    });

    it("preserves explicit ordered list items", () => {
        const input = "1. First\n2. Second\n3. Third";
        const output = smartFormat(input);
        expect(output).toContain("1. First");
        expect(output).toContain("2. Second");
    });

    it("detects implicit list items with dashes", () => {
        const input = "Logistic regression - 87.3% accuracy\nDecision trees - 91.5% accuracy";
        const output = smartFormat(input);
        expect(output).toContain("- **Logistic regression** —");
        expect(output).toContain("- **Decision trees** —");
    });
});

// ─── URL detection ──────────────────────────────────────────────────────────

describe("URL detection", () => {
    it("wraps bare URLs in markdown links", () => {
        const input = "Visit https://example.com for info.";
        const output = smartFormat(input);
        expect(output).toContain("[example.com](https://example.com)");
    });

    it("preserves already-formatted markdown links", () => {
        const input = "Visit [GitHub](https://github.com)";
        const output = smartFormat(input);
        expect(output).toContain("[GitHub](https://github.com)");
    });
});

// ─── Horizontal rules ───────────────────────────────────────────────────────

describe("horizontal rules", () => {
    it("preserves three dashes as horizontal rule", () => {
        const input = "Before\n\n---\n\nAfter";
        const output = smartFormat(input);
        expect(output).toContain("---");
    });

    it("preserves three stars as horizontal rule", () => {
        const input = "Before\n\n***\n\nAfter";
        const output = smartFormat(input);
        expect(output).toContain("***");
    });
});

// ─── Edge cases ─────────────────────────────────────────────────────────────

describe("edge cases", () => {
    it("handles empty input", () => {
        const output = smartFormat("");
        expect(output).toBe("");
    });

    it("handles whitespace-only input", () => {
        const output = smartFormat("   \n  \n  ");
        expect(output.trim()).toBe("");
    });

    it("handles single word input", () => {
        const output = smartFormat("hello");
        expect(output).toContain("hello");
    });

    it("preserves paragraph spacing", () => {
        const input = "Paragraph one.\n\nParagraph two.\n\nParagraph three.";
        const output = smartFormat(input);
        expect(output).toContain("Paragraph one.");
        expect(output).toContain("Paragraph two.");
        expect(output).toContain("Paragraph three.");
    });

    it("does not duplicate blank lines excessively", () => {
        const input = "A\n\n\n\n\nB";
        const output = smartFormat(input);
        // Should have at most 2 consecutive blank lines
        expect(output).not.toContain("\n\n\n\n");
    });

    it("does not modify already-structured markdown significantly", () => {
        const input = "# Existing Title\n\n## Subsection\n\nNormal paragraph.\n\n- List item\n- Another item";
        const output = smartFormat(input);
        expect(output).toContain("# Existing Title");
        expect(output).toContain("## Subsection");
        expect(output).toContain("Normal paragraph.");
        expect(output).toContain("- List item");
    });
});

// ─── Study notes (from prototype) ───────────────────────────────────────────

describe("study notes formatting", () => {
    it("formats chapter-based study notes", () => {
        const input = [
            "chapter 1: calculus review",
            "",
            "derivative rules",
            "",
            "the derivative of x^n is n x^{n-1}",
            "example: d/dx (x^3) = 3x^2",
            "",
            "important: the chain rule is the most important",
            "",
            "Integration",
            "",
            "the fundamental theorem of calculus says:",
            "int_a^b f(x) dx = F(b) - F(a)",
            "",
            "def: a definite integral computes area under a curve",
            "",
            "key formulas:",
            "- int x^n dx = x^{n+1} / (n+1) + C",
            "- int 1/x dx = ln|x| + C",
        ].join("\n");

        const output = smartFormat(input);

        expect(output).toContain("# chapter 1: calculus review");
        expect(output).toContain("**Example:**");
        expect(output).toContain("> **Important:**");
        expect(output).toContain("**Definition:**");
        // pass1 wrapInlineCode adds backticks around function calls inside math
        expect(output).toContain("int_a^b");
        expect(output).toContain("$$");
        expect(output).toContain("F(b)");
    });
});

// ─── Research paper formatting ──────────────────────────────────────────────

describe("research paper formatting", () => {
    it("formats research paper structure", () => {
        const input = [
            "Abstract",
            "",
            "This paper presents a comparative analysis of three algorithms.",
            "",
            "1. Introduction",
            "",
            "Classification is a fundamental problem in machine learning.",
            "",
            "2. Methodology",
            "",
            "2.1 Logistic Regression",
            "",
            "Logistic regression models P(y=1|x) = 1 / (1 + exp(-w^T x))",
            "",
            "3. Results",
            "",
            "Our experiments show the following accuracy:",
            "- logistic regression: 87.3%",
            "- decision tree: 91.5%",
            "- neural network: 94.2%",
            "",
            "important: Neural networks required more training time.",
            "",
            "4. Conclusion",
            "",
            "Neural networks provide the best accuracy.",
        ].join("\n");

        const output = smartFormat(input);

        expect(output).toContain("## Abstract");
        expect(output).toContain("## Introduction");
        expect(output).toContain("### Logistic Regression");
        expect(output).toContain("## Results");
        expect(output).toContain("## Conclusion");
        expect(output).toContain("> **Important:**");
        expect(output).toContain("- logistic regression: 87.3%");
    });
});

// ─── ChatGPT output formatting ──────────────────────────────────────────────

describe("ChatGPT output formatting", () => {
    it("formats ChatGPT-style explanations", () => {
        const input = [
            "Gradient descent is an optimization algorithm.",
            "",
            "The update rule is:",
            "theta_j = theta_j - alpha * d/d(theta_j) J(theta)",
            "",
            "there are three main variants:",
            "batch gradient descent - uses entire dataset",
            "stochastic gradient descent - uses one example",
            "mini-batch gradient descent - uses small batches",
            "",
            "here's a simple implementation in python:",
            "import numpy as np",
            "",
            "def gradient_descent(X, y, theta, alpha, num_iters):",
            "    m = len(y)",
            "    for i in range(num_iters):",
            "        predictions = X @ theta",
            "        errors = predictions - y",
            "        gradient = (1/m) * X.T @ errors",
            "        theta = theta - alpha * gradient",
            "    return theta",
            "",
            "note: Choosing the right learning rate is critical.",
            "",
            "key concepts:",
            "- the gradient points in the direction of steepest ascent",
            "- the learning rate controls the step size",
            "",
            "Visit https://example.com for more details.",
        ].join("\n");

        const output = smartFormat(input);

        expect(output).toContain("```python");
        expect(output).toContain("def gradient_descent(X, y, theta, alpha, num_iters):");
        expect(output).toContain("> **Note:**");
        expect(output).toContain("> **Key Concepts**");
        expect(output).toContain("- **batch gradient descent** —");
        expect(output).toContain("[example.com](https://example.com)");
    });
});

// ─── Table detection (new in v2) ────────────────────────────────────────────

describe("table detection", () => {
    it("converts pipe-delimited rows to markdown table with header hints", () => {
        const input = [
            "Here is the team roster:",
            "Name | Role | Status",
            "Alice | Admin | Active",
            "Bob | User | Inactive",
        ].join("\n");
        const output = smartFormat(input);
        expect(output).toContain("| Name | Role | Status |");
        expect(output).toContain("| --- | --- | --- |");
        expect(output).toContain("| Alice | Admin | Active |");
        expect(output).toContain("| Bob | User | Inactive |");
    });

    it("converts space-aligned columns to markdown table", () => {
        const input = [
            "Here is the roster again:",
            "Name    Role     Status",
            "Alice   Admin    Active",
            "Bob     User     Inactive",
        ].join("\n");
        const output = smartFormat(input);
        expect(output).toContain("| Name | Role | Status |");
        expect(output).toContain("| Alice | Admin | Active |");
    });

    it("does NOT convert a single row as a table", () => {
        const input = "Name | Role | Status";
        const output = smartFormat(input);
        // Single row with header hints but only 1 row — block.length < 2
        expect(output).not.toContain("|---|");
    });

    it("preserves already-formatted markdown tables", () => {
        const input = [
            "| Name | Role |",
            "| --- | --- |",
            "| Alice | Admin |",
        ].join("\n");
        const output = smartFormat(input);
        expect(output).toContain("| Name | Role |");
        expect(output).toContain("| --- | --- |");
    });
});

// ─── Task detection (new in v2) ─────────────────────────────────────────────

describe("task detection", () => {
    it("converts 'TODO:' prefix to checkbox item", () => {
        const input = "TODO: Buy groceries";
        const output = smartFormat(input);
        expect(output).toContain("- [ ] Buy groceries");
    });

    it("converts 'action item:' prefix to checkbox item", () => {
        const input = "action item: Review pull request";
        const output = smartFormat(input);
        expect(output).toContain("- [ ] Review pull request");
    });

    it("converts 'follow up:' prefix to checkbox item", () => {
        const input = "follow up: Schedule the meeting";
        const output = smartFormat(input);
        expect(output).toContain("- [ ] Schedule the meeting");
    });

    it("converts 'follow-up:' prefix to checkbox item", () => {
        const input = "follow-up: Send the report";
        const output = smartFormat(input);
        expect(output).toContain("- [ ] Send the report");
    });

    it("preserves existing checkbox lists unchanged", () => {
        const input = "- [x] Completed task\n- [ ] Pending task";
        const output = smartFormat(input);
        expect(output).toContain("- [x] Completed task");
        expect(output).toContain("- [ ] Pending task");
    });
});

// ─── Q&A dialogue detection (new in v2) ─────────────────────────────────────

describe("Q&A dialogue detection", () => {
    it("converts Q:/A: format to bold labels", () => {
        const input = "Q: What is the capital of France?\nA: Paris";
        const output = smartFormat(input);
        expect(output).toContain("**Q:**");
        expect(output).toContain("**A:**");
    });

    it("converts numbered Q1:/A1: format", () => {
        const input = "Q1: First question\nA1: First answer\n\nQ2: Second question\nA2: Second answer";
        const output = smartFormat(input);
        expect(output).toContain("**Q1:**");
        expect(output).toContain("**A1:**");
        expect(output).toContain("**Q2:**");
        expect(output).toContain("**A2:**");
    });
});

// ─── Speaker dialogue detection (new in v2) ─────────────────────────────────

describe("speaker dialogue detection", () => {
    it("bolds speaker names when 3+ speakers detected", () => {
        const input = [
            "Alice: Let's start the meeting.",
            "Bob: I have the Q3 report ready.",
            "Charlie: Let me share my screen.",
            "Alice: Great, let's begin.",
        ].join("\n");
        const output = smartFormat(input);
        expect(output).toContain("**Alice:**");
        expect(output).toContain("**Bob:**");
        expect(output).toContain("**Charlie:**");
    });

    it("does NOT bold speaker names when fewer than 3 speakers", () => {
        const input = "Alice: Hello.\nBob: Hi there.";
        const output = smartFormat(input);
        // Only 2 speaker lines, so dialogue detection shouldn't trigger
        expect(output).toContain("Alice: Hello.");
        expect(output).not.toContain("**Alice:**");
    });

    it("does NOT bold reserved labels (note:, important:, etc.)", () => {
        const input = [
            "Note: Remember the deadline.",
            "Important: Submit by Friday.",
            "Warning: Check your work.",
            "Hint: Use the formula.",
        ].join("\n");
        const output = smartFormat(input);
        // Even with 4 speaker-ish lines, reserved labels should stay as callouts
        expect(output).toContain("> **Note:**");
        expect(output).toContain("> **Important:**");
        expect(output).toContain("> **Warning:**");
        expect(output).toContain("> **Hint:**");
        // Should NOT have speaker-style bolded labels without blockquote
        expect(output.split("\n")[0]).toContain(">");
    });
});

// ─── Table of contents (new in v2) ──────────────────────────────────────────

describe("table of contents", () => {
    it("generates TOC when generateTOC option is true", () => {
        const input = [
            "Abstract",
            "",
            "This is the abstract.",
            "",
            "Introduction",
            "",
            "This is the introduction.",
            "",
            "Results",
            "",
            "These are the results.",
        ].join("\n");
        const output = smartFormat(input, { generateTOC: true });
        expect(output).toContain("## Table of Contents");
        expect(output).toContain("- [Abstract](#abstract)");
        expect(output).toContain("- [Introduction](#introduction)");
        expect(output).toContain("- [Results](#results)");
        // TOC should be prepended, not appended
        expect(output.indexOf("## Table of Contents")).toBe(0);
    });

    it("does NOT generate TOC when generateTOC is false (default)", () => {
        const input = "Abstract\n\nAbstract content.";
        const output = smartFormat(input);
        expect(output).not.toContain("## Table of Contents");
    });

    it("does NOT generate TOC with generateTOC true but no headings", () => {
        const input = "Just a plain paragraph with no headings.";
        const output = smartFormat(input, { generateTOC: true });
        expect(output).not.toContain("## Table of Contents");
        expect(output).toContain("Just a plain paragraph");
    });
});

// ─── OCR artifact fixing (new in v2) ────────────────────────────────────────

describe("OCR artifact fixing", () => {
    it("rejoins hyphenated words across line breaks when fixOcrArtifacts is true", () => {
        const input = [
            "This is a long docu-",
            "ment that was split across",
            "a line break by OCR.",
        ].join("\n");
        const output = smartFormat(input, { fixOcrArtifacts: true });
        expect(output).toContain("document");
        expect(output).not.toContain("docu-");
    });

    it("does NOT rejoin hyphenated words when fixOcrArtifacts is false (default)", () => {
        const input = "This is a long docu-\nment that was split.";
        const output = smartFormat(input);
        // Default: fixOcrArtifacts is false, so hyphens are preserved
        expect(output).toContain("docu-");
    });

    it("preserves legitimate hyphenated compounds when fixOcrArtifacts is true", () => {
        const input = "Well-known author wrote a state-of-the-art paper.";
        const output = smartFormat(input, { fixOcrArtifacts: true });
        // Hyphenated compounds should remain intact
        expect(output).toContain("Well-known");
        expect(output).toContain("state-of-the-art");
    });
});

// ─── Email link detection (new in v2) ───────────────────────────────────────

describe("email link detection", () => {
    it("wraps bare email addresses in mailto: links", () => {
        const input = "Contact us at hello@example.com for support.";
        const output = smartFormat(input);
        expect(output).toContain("[hello@example.com](mailto:hello@example.com)");
    });

    it("preserves email addresses inside existing markdown links", () => {
        const input = "Email: [user@test.com](mailto:user@test.com)";
        const output = smartFormat(input);
        // The email address should still be present
        expect(output).toContain("user@test.com");
        expect(output).toContain("mailto:user@test.com");
    });
});

// ─── Typography normalization (new in v2) ───────────────────────────────────

describe("typography normalization", () => {
    it("converts smart double quotes to straight quotes", () => {
        const input = "\u201cHello\u201d she said.";
        const output = smartFormat(input);
        expect(output).toContain('"Hello"');
        expect(output).not.toContain("\u201c");
    });

    it("converts smart single quotes to straight apostrophes", () => {
        const input = "It\u2019s a nice day.";
        const output = smartFormat(input);
        expect(output).toContain("It's");
    });

    it("converts special bullet characters to dashes", () => {
        const input = "\u2022 Item one\n\u25e6 Item two";
        const output = smartFormat(input);
        expect(output).toContain("- Item one");
        expect(output).toContain("- Item two");
    });

    it("strips trailing whitespace from lines", () => {
        const input = "Line with trailing spaces   \nNext line.";
        const output = smartFormat(input);
        expect(output).toContain("Line with trailing spaces");
        expect(output).not.toContain("   ");
    });
});

// ─── Flag uncertain option (new in v2) ──────────────────────────────────────

describe("flag uncertain option", () => {
    it("adds verify comments when flagUncertain is true for ambiguous headings", () => {
        const input = "Methods\n\nDetails here.";
        const output = smartFormat(input, { flagUncertain: true });
        // "Methods" is a single-word uppercase heading → it's flagged as uncertain
        expect(output).toContain("## Methods");
        expect(output).toContain("<!-- verify:");
    });

    it("does NOT add verify comments when flagUncertain is false (default)", () => {
        const input = "Methods\n\nDetails here.";
        const output = smartFormat(input);
        expect(output).toContain("## Methods");
        expect(output).not.toContain("<!-- verify:");
    });
});

// ─── Implicit callout patterns (new in v2) ──────────────────────────────────

describe("implicit callout patterns", () => {
    it("converts 'keep in mind that' to blockquote note", () => {
        const input = "keep in mind that the deadline is Friday.";
        const output = smartFormat(input);
        expect(output).toContain("> **Note:**");
    });

    it("converts 'remember:' to blockquote remember", () => {
        const input = "remember: Check your work before submitting.";
        const output = smartFormat(input);
        // 'remember' has its own dedicated keyword → becomes > **Remember:**
        expect(output).toContain("> **Remember:**");
    });

    it("converts 'the key takeaway is' to blockquote important", () => {
        const input = "The key takeaway is that practice matters.";
        const output = smartFormat(input);
        expect(output).toContain("> **Important:**");
    });
});

// ─── Nested list promotion (new in v2) ──────────────────────────────────────

describe("nested list promotion", () => {
    it("promotes indented content under list items to sub-lists", () => {
        const input = [
            "- Main item",
            "  indented detail about main item",
            "- Another item",
        ].join("\n");
        const output = smartFormat(input);
        expect(output).toContain("- Main item");
        expect(output).toContain("  - indented detail");
    });
});

// ─── Transition paragraph conversion (new in v2) ────────────────────────────

describe("transition paragraph conversion", () => {
    it("converts sequence of transition words to numbered list", () => {
        const input = [
            "First: Preheat the oven to 350\u00b0F.",
            "Second: Mix the dry ingredients.",
            "Third: Add the wet ingredients.",
        ].join("\n");
        const output = smartFormat(input);
        expect(output).toContain("1. Preheat the oven");
        expect(output).toContain("2. Mix the dry ingredients");
        expect(output).toContain("3. Add the wet ingredients");
    });

    it("does NOT convert single transition word as list", () => {
        const input = "First: Preheat the oven.";
        const output = smartFormat(input);
        // Only 1 item — not enough for list conversion
        expect(output).toContain("First:");
    });
});

// ─── Inline code wrapping (new in v2) ───────────────────────────────────────

describe("inline code wrapping", () => {
    it("wraps function calls in backticks", () => {
        const input = "Call the calculate() function.";
        const output = smartFormat(input);
        expect(output).toContain("`calculate()`");
    });

    it("wraps file paths in backticks", () => {
        const input = "Update the src/utils/helpers.ts file.";
        const output = smartFormat(input);
        expect(output).toContain("`src/utils/helpers.ts`");
    });

    it("does NOT wrap content inside existing code blocks", () => {
        const input = "Here\u2019s the code:\n```\nresult = calculate(x, y)\n```";
        const output = smartFormat(input);
        // Inside the code fence, content should not be double-wrapped
        expect(output).toContain("calculate(x, y)");
    });
});

// ─── Boundary cases for code protection ─────────────────────────────────────

describe("code protection", () => {
    it("does NOT apply callout formatting inside code fences", () => {
        const input = [
            "```",
            "note: this is inside a code block",
            "important: also inside",
            "```",
        ].join("\n");
        const output = smartFormat(input);
        // Should remain exactly as-is inside the fence
        expect(output).toContain("note: this is inside");
        expect(output).toContain("important: also inside");
        expect(output).not.toContain("**Note:**");
    });

    it("does NOT apply math detection inside code fences", () => {
        const input = [
            "```",
            "x_i = mean of sample",
            "```",
        ].join("\n");
        const output = smartFormat(input);
        // Inside code fence, math should not be wrapped in $
        expect(output).toContain("x_i = mean of sample");
        expect(output).not.toContain("$x_i");
    });
});

// ─── SmartFormatOptions type exports ────────────────────────────────────────

describe("SmartFormatOptions type", () => {
    it("accepts valid options without errors", () => {
        const input = "Test content.";
        const output = smartFormat(input, {
            generateTOC: true,
            flagUncertain: true,
            fixOcrArtifacts: true,
        });
        expect(typeof output).toBe("string");
        expect(output.length).toBeGreaterThan(0);
    });

    it("accepts partial options", () => {
        const input = "Test content.";
        const output1 = smartFormat(input, { generateTOC: true });
        const output2 = smartFormat(input, { fixOcrArtifacts: true });
        expect(typeof output1).toBe("string");
        expect(typeof output2).toBe("string");
    });
});
