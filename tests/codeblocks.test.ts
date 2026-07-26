import { describe, it, expect } from "vitest";
import { protectCodeBlocks, restoreCodeBlocks } from "../src/converter/codeblocks.js";
import { highlightCodeBlocks } from "../src/converter/highlighting.js";
import { convert } from "../src/converter/index.js";

// ─── protectCodeBlocks ──────────────────────────────────────────────────────

describe("protectCodeBlocks", () => {
    it("replaces a fenced code block with a placeholder", () => {
        const input = "Before\n```ts\nconst x = 1;\n```\nAfter";
        const { text, blocks } = protectCodeBlocks(input);
        expect(text).toContain("@@CODEBLOCK-0@@");
        expect(text).not.toContain("const x = 1;");
        expect(blocks).toHaveLength(1);
        expect(blocks[0].content).toContain("const x = 1;");
    });

    it("replaces inline code with a placeholder", () => {
        const input = "Use `\\alpha` here.";
        const { text, blocks } = protectCodeBlocks(input);
        expect(text).toContain("@@CODEBLOCK-0@@");
        expect(text).not.toContain("\\alpha");
        expect(blocks[0].content).toBe("`\\alpha`");
    });

    it("handles multiple code blocks", () => {
        const input = "```\nA\n```\ntext\n```\nB\n```";
        const { text, blocks } = protectCodeBlocks(input);
        expect(blocks).toHaveLength(2);
        expect(text).toContain("@@CODEBLOCK-0@@");
        expect(text).toContain("@@CODEBLOCK-1@@");
    });

    it("does not touch text outside code blocks", () => {
        const input = "Math: $x^2$\n```\ncode\n```";
        const { text } = protectCodeBlocks(input);
        expect(text).toContain("Math: $x^2$");
    });
});

// ─── restoreCodeBlocks ──────────────────────────────────────────────────────

describe("restoreCodeBlocks", () => {
    it("restores blocks back to original content", () => {
        const input = "Before\n```ts\nconst x = 1;\n```\nAfter";
        const { text, blocks } = protectCodeBlocks(input);
        const restored = restoreCodeBlocks(text, blocks);
        expect(restored).toBe(input);
    });
});

// ─── End-to-end: code blocks through the full pipeline ─────────────────────

describe("pipeline — code blocks preserved", () => {
    it("preserves a C++ fenced code block through conversion", () => {
        const input = `# C++ Example

Here is a function:

\`\`\`cpp
int solve(vector<int>& nums, int l, int r) {
    if (l == r) {
        return nums[l];
    }

    int mid = l + (r - l) / 2;
    return max({leftBest, rightBest});
}
\`\`\``;
        const output = convert(input);
        expect(output).toContain("```cpp");
        expect(output).toContain("int solve(vector<int>& nums, int l, int r)");
        expect(output).toContain("return max({leftBest, rightBest});");
        // Indentation preserved
        expect(output).toContain("    if (l == r)");
        expect(output).toContain("        return nums[l]");
        // Blank line inside the code block
        expect(output).toContain("\n\n    int mid");
    });

    it("preserves a Python fenced code block", () => {
        const input = `\`\`\`python
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
\`\`\``;
        const output = convert(input);
        expect(output).toContain("```python");
        expect(output).toContain("def fibonacci(n: int) -> int:");
        expect(output).toContain("return fibonacci(n - 1) + fibonacci(n - 2)");
    });

    it("preserves a JavaScript fenced code block", () => {
        const input = `\`\`\`javascript
function greet(name) {
    console.log(\`Hello, \${name}!\`);
}
\`\`\``;
        const output = convert(input);
        expect(output).toContain("```javascript");
        expect(output).toContain("function greet(name)");
    });

    it("preserves LaTeX-looking text inside a code block", () => {
        const input = `Text $x^2$ is math, but this is code:

\`\`\`
\\frac{x}{y}   # this is NOT a fraction
\\sqrt{2}      # this is NOT a square root
\`\`\``;
        const output = convert(input);
        // Math outside code block gets converted
        expect(output).toContain("x²");
        // But inside the code block, everything is literal
        expect(output).toContain("\\frac{x}{y}");
        expect(output).toContain("\\sqrt{2}");
    });

    it("preserves special characters inside code blocks", () => {
        const input = `\`\`\`
$variable = "hello";
if (x < 0) { return -1; } else { return x & 0xFF; }
list<int> nums = {1, 2, 3};
#ifdef DEBUG
    printf("x = %d\\n", x);
#endif
int* ptr = &value;
\`\`\``;
        const output = convert(input);
        // These should NOT be converted by LaTeX pipeline
        expect(output).toContain("$variable");
        expect(output).toContain("x < 0");
        expect(output).toContain("return -1;");
        expect(output).toContain("x & 0xFF");
        expect(output).toContain("#ifdef DEBUG");
        expect(output).toContain("printf");
        expect(output).toContain("int* ptr = &value");
    });

    it("handles multiple code blocks with normal text between", () => {
        const input = `# First block

\`\`\`python
print("Hello")
\`\`\`

Some $math$ here.

# Second block

\`\`\`cpp
int x = 42;
\`\`\``;
        const output = convert(input);
        expect(output).toContain("```python");
        expect(output).toContain("print");
        expect(output).toContain("math");
        expect(output).toContain("```cpp");
        expect(output).toContain("int x = 42;");
    });

    it("handles code blocks with blank lines inside", () => {
        const input = `\`\`\`text
Line 1

Line 2


Line 3
\`\`\``;
        const output = convert(input);
        // Blank lines are preserved inside code blocks
        expect(output).toContain("Line 1");
        expect(output).toContain("Line 2");
        expect(output).toContain("Line 3");
    });

    it("handles code blocks with no language identifier", () => {
        const input = `\`\`\`
plain code block
\`\`\``;
        const output = convert(input);
        expect(output).toContain("```");
        expect(output).toContain("plain code block");
    });

    it("handles code blocks with very long lines", () => {
        const longLine = "a".repeat(500);
        const input = `\`\`\`text
${longLine}
\`\`\``;
        const output = convert(input);
        expect(output).toContain(longLine);
    });

    it("converts LaTeX outside code blocks but not inside", () => {
        const input = `The formula is $\\frac{a}{b}$.

\`\`\`text
But \\frac{a}{b} in code is literal
\`\`\``;
        const output = convert(input);
        // Outside code block: fraction is converted
        expect(output).toContain("(a/b)");
        // Inside code block: \\frac is preserved literally
        expect(output).toContain("\\frac{a}{b}");
    });
});

// ─── Syntax highlighting ────────────────────────────────────────────────────

describe("highlightCodeBlocks", () => {
    it("highlights a known language code block", () => {
        const input = `Before
\`\`\`javascript
const x = 1;
\`\`\`
After`;
        const result = highlightCodeBlocks(input);
        // Should replace fenced block with highlighted HTML
        expect(result).toContain("<pre><code class=\"hljs language-javascript\">");
        expect(result).not.toContain("```javascript");
        // Text before/after preserved
        expect(result).toContain("Before");
        expect(result).toContain("After");
    });

    it("leaves unknown language blocks as plain fences", () => {
        const input = `\`\`\`unknown_lang
some code
\`\`\``;
        const result = highlightCodeBlocks(input);
        // Unknown language — should remain as fenced block
        expect(result).toContain("```unknown_lang");
        expect(result).not.toContain("hljs");
    });

    it("leaves no-language blocks as plain fences", () => {
        const input = `\`\`\`
plain code
\`\`\``;
        const result = highlightCodeBlocks(input);
        expect(result).toContain("```");
        expect(result).toContain("plain code");
        expect(result).not.toContain("hljs");
    });

    it("highlights multiple code blocks", () => {
        const input = `\`\`\`python
x = 1
\`\`\`
\`\`\`cpp
int y = 2;
\`\`\``;
        const result = highlightCodeBlocks(input);
        expect(result).toContain("hljs language-python");
        expect(result).toContain("hljs language-cpp");
    });

    it("highlights c++ language identifier", () => {
        const input = `\`\`\`c++
int main() { return 0; }
\`\`\``;
        const result = highlightCodeBlocks(input);
        // The c++ identifier should be captured as the language
        expect(result).toContain("hljs");
        expect(result).toContain("language-c++");
        // The content is wrapped in hljs spans, but the code text is still there
        expect(result).toContain("main");
        expect(result).toContain("return");
        expect(result).toContain(">0<");
        // The fenced code block markers should be gone
        expect(result).not.toContain("```");
    });
});

// ─── End-to-end: convert + highlightCodeBlocks ─────────────────────────────
describe("full pipeline — convert + highlight", () => {
    it("converts LaTeX and highlights code blocks", () => {
        const input = `# Demo

Math: $x^2 + y^2 = z^2$

\`\`\`cpp
int main() {
    return 0;
}
\`\`\``;
        const converted = convert(input);
        const highlighted = highlightCodeBlocks(converted);

        // LaTeX converted — check the output contains superscript chars
        expect(highlighted).toContain("x²");
        expect(highlighted).toContain("y²");
        expect(highlighted).toContain("z²");

        // Code block highlighted with hljs class
        expect(highlighted).toContain("hljs language-cpp");
        expect(highlighted).toContain("hljs");
    });
});
