/**
 * Protect URLs and Markdown link/image syntax from the LaTeX conversion pipeline.
 *
 * URLs often contain underscores (`_`), carets (`^`), and other characters that
 * would be falsely interpreted as LaTeX subscript/superscript markers by the
 * conversion pipeline. This module protects them with placeholders before the
 * pipeline runs and restores them afterwards.
 *
 * Protected patterns:
 *   - Standalone URLs:  https://example.com/page_name
 *   - Markdown links:   [text](url)
 *   - Markdown images:  ![alt](url)
 *   - Reference-style links: [text][ref]
 *   - Autolinks:        <https://example.com>
 *
 * Placeholder format:  @@URL-N@@  (unique per occurrence, hyphen avoids
 * subscript/superscript matching)
 */

import { CodeBlock } from "../types/mapping.js";

const URL_PROTOCOL = /https?:\/\/|ftp:\/\/|mailto:/i;

/**
 * Scan text for URL-like patterns and replace them with unique placeholders.
 * Returns the modified text and the list of protected URL blocks.
 */
export function protectUrls(text: string): { text: string; blocks: CodeBlock[] } {
    const blocks: CodeBlock[] = [];
    let counter = 0;

    // 1. Protect autolinks: <https://...>
    text = text.replace(/<(\w+:\/\/[^>]+)>/g, (_match) => {
        const id = `@@URL-${counter++}@@`;
        blocks.push({ id, content: _match });
        return id;
    });

    // 2. Protect Markdown images: ![alt](url)
    text = text.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (_match) => {
        const id = `@@URL-${counter++}@@`;
        blocks.push({ id, content: _match });
        return id;
    });

    // 3. Protect Markdown links: [text](url)
    //    Must run after images (images start with !, links don't)
    text = text.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_match) => {
        const id = `@@URL-${counter++}@@`;
        blocks.push({ id, content: _match });
        return id;
    });

    // 4. Protect reference-style links: [text][ref]  and [ref]
    text = text.replace(/\[([^\]]*)\]\[([^\]]*)\]/g, (_match) => {
        const id = `@@URL-${counter++}@@`;
        blocks.push({ id, content: _match });
        return id;
    });

    // 5. Protect standalone URLs (not already inside a markdown link/image)
    //    Match protocols followed by non-whitespace, non-quote, non-paren chars
    text = text.replace(
        /(^|\s)(https?:\/\/[^\s<>"'\]\[\)]+|ftp:\/\/[^\s<>"'\]\[\)]+|mailto:[^\s<>"'\]\[\)]+)/g,
        (_match, before: string, url: string) => {
            const id = `@@URL-${counter++}@@`;
            blocks.push({ id, content: url });
            return `${before}${id}`;
        },
    );

    return { text, blocks };
}

/**
 * Restore all URL placeholders back to their original content.
 */
export function restoreUrls(text: string, blocks: CodeBlock[]): string {
    for (const block of blocks) {
        text = text.replace(block.id, () => block.content);
    }
    return text;
}
