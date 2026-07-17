/**
 * Replace fenced code blocks and inline code with placeholders.
 * Returns the modified text and the list of protected blocks.
 *
 * Placeholder format: @@CODEBLOCK-N@@ (hyphen avoids subscript/superscript matching)
 */
export function protectCodeBlocks(text) {
    const blocks = [];
    let counter = 0;
    // Protect fenced code blocks first (``` ... ```) — greedy match across newlines
    text = text.replace(/(`{3,})([\s\S]*?)\1/g, (_match, _fence, _content) => {
        const id = `@@CODEBLOCK-${counter++}@@`;
        blocks.push({ id, content: _match });
        return id;
    });
    // Protect inline code (` ... `)
    text = text.replace(/`([^`\n]+)`/g, (_match) => {
        const id = `@@CODEBLOCK-${counter++}@@`;
        blocks.push({ id, content: _match });
        return id;
    });
    return { text, blocks };
}
/**
 * Restore all code block placeholders back to their original content.
 */
export function restoreCodeBlocks(text, blocks) {
    for (const block of blocks) {
        text = text.replace(block.id, () => block.content);
    }
    return text;
}
