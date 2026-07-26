import { describe, it, expect } from "vitest";
import { smartFormat } from "../src/formatter/notes.js";

// ─── Heading detection ──────────────────────────────────────────────────────

describe("headings", () => {
    it("converts 'chapter 1:' to H1 heading", () => {
        const input = "chapter 1: calculus review\n\nsome text";
        const output = smartFormat(input);
        expect(output).toContain("# chapter 1: calculus review");
    });

    it("converts 'Abstract' to H1 heading", () => {
        const input = "Abstract\n\nThis paper presents...";
        const output = smartFormat(input);
        expect(output).toContain("# Abstract");
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
        expect(output).toContain("- Logistic regression —");
        expect(output).toContain("- Decision trees —");
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
        expect(output).toContain("$$int_a^b f(x) dx = F(b) - F(a)$$");
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

        expect(output).toContain("# Abstract");
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
        expect(output).toContain("- batch gradient descent —");
        expect(output).toContain("[example.com](https://example.com)");
    });
});
