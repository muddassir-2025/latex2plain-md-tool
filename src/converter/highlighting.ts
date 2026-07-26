/**
 * Syntax highlighting for fenced code blocks in markdown.
 *
 * Uses highlight.js to convert fenced code blocks like:
 *   ```cpp
 *   int main() { return 0; }
 *   ```
 *
 * into raw HTML:
 *   <pre><code class="hljs language-cpp">...</code></pre>
 *
 * The raw HTML is passed through by md-to-pdf's markdown-it renderer.
 * highlight.js CSS classes are styled in pdf-style.ts.
 *
 * This runs AFTER the LaTeX-to-plain conversion pipeline, so code blocks
 * have already been protected, the rest of the text converted, and code
 * blocks restored.  We then find the restored fenced blocks and apply
 * syntax highlighting.
 */

import hljs from "highlight.js";

/**
 * Apply syntax highlighting to all fenced code blocks in a markdown string.
 *
 * @param markdown  Converted markdown (code blocks already restored)
 * @returns         Markdown with fenced code blocks replaced by highlighted HTML
 */
export function highlightCodeBlocks(markdown: string): string {
    // Match fenced code blocks: ```lang\n...\n```
    // Uses \1 backreference so 3+ backticks match correctly
    return markdown.replace(
        /(`{3,})([\w+#]*)\n([\s\S]*?)\1/g,
        (match: string, fence: string, lang: string, code: string) => {
            // Only highlight if a language is specified and highlight.js supports it
            if (lang && hljs.getLanguage(lang)) {
                try {
                    const highlighted = hljs.highlight(code.trimEnd(), {
                        language: lang,
                    }).value;
                    return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
                } catch {
                    // Fall through to plain code block on error
                }
            }

            // No language or unrecognised / error — return as plain code block
            return match;
        },
    );
}
