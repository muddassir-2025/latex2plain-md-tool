import { describe, it, expect } from "vitest";
import { protectCodeBlocks, restoreCodeBlocks } from "../src/converter/codeblocks.js";

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

describe("restoreCodeBlocks", () => {
    it("restores blocks back to original content", () => {
        const input = "Before\n```ts\nconst x = 1;\n```\nAfter";
        const { text, blocks } = protectCodeBlocks(input);
        const restored = restoreCodeBlocks(text, blocks);
        expect(restored).toBe(input);
    });
});
