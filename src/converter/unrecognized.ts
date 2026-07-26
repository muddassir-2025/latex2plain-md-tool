/**
 * Unrecognized LaTeX detection pass.
 *
 * After the full pipeline runs, any remaining `\commandName{...}` patterns
 * represent LaTeX that the pipeline couldn't convert. Instead of leaving
 * raw LaTeX code in the output, we wrap them in visible error markers
 * that get styled as red boxes in the PDF/HTML output.
 *
 * This runs BEFORE code block and URL restoration so that preserved
 * content (which was protected via placeholders) isn't scanned.
 * Placeholders use `@@...@@` format so they won't match `\command`.
 */

// ─── Commands that are legitimately left after conversion ──────────────────
//
// These should NOT be flagged:
//   \space, \,  \;  \!  \#  \$  \%  \{  \}  \_  \&  \S  \P
//   \\  (line breaks)
//   \ followed by non-letter

// ─── Pattern ───────────────────────────────────────────────────────────────
//
// Matches:    \<commandName><optional *><optional [opt]><optional {arg}>
// Where commandName is one or more ASCII letters.

const LA_CMD = /(?<!\w)\\([A-Za-z]+)(\*)?/;

/**
 * Extract balanced brace content starting from `openPos` where text[openPos] === '{'.
 * Returns [content, indexAfterClosingBrace] or null if unbalanced.
 */
function extractBracedSpan(text: string, openPos: number): [string, number] | null {
    let depth = 1; // we've seen the opening {
    let i = openPos + 1;
    while (i < text.length) {
        if (text[i] === "{") {
            depth++;
        } else if (text[i] === "}") {
            depth--;
            if (depth === 0) {
                const content = text.slice(openPos + 1, i);
                return [content, i + 1];
            }
        }
        i++;
    }
    return null; // unbalanced
}

/**
 * Extract balanced bracket content starting from `openPos` where text[openPos] === '['.
 * Returns [content, indexAfterClosingBracket] or null if unbalanced.
 * Brackets typically don't nest in LaTeX optional args, but we handle it anyway.
 */
function extractBracketSpan(text: string, openPos: number): [string, number] | null {
    let depth = 1;
    let i = openPos + 1;
    while (i < text.length) {
        if (text[i] === "[") {
            depth++;
        } else if (text[i] === "]") {
            depth--;
            if (depth === 0) {
                const content = text.slice(openPos + 1, i);
                return [content, i + 1];
            }
        }
        i++;
    }
    return null;
}

/**
 * Replace unrecognized LaTeX commands with visible HTML error markers.
 *
 * @param text  Post-pipeline text (code blocks and URL placeholders still intact)
 * @returns     Text with remaining \command{...} wrapped in error spans
 */
export function markUnrecognized(text: string): string {
    const result: string[] = [];
    let i = 0;

    while (i < text.length) {
        // Look for \commandName or \commandName*
        const rest = text.slice(i);
        const match = rest.match(LA_CMD);

        if (!match) {
            result.push(rest);
            break;
        }

        const cmdName = match[1];
        const hasStar = match[2] !== undefined;
        const fullCmd = match[0]; // e.g. "\mycmd" or "\mycmd*"
        const cmdEnd = i + match.index! + fullCmd.length; // position after command + optional *

        // Push everything before the match
        result.push(rest.slice(0, match.index!));

        // Now scan for optional [arg] and {arg} after the command
        let pos = cmdEnd;
        const consumed: string[] = [fullCmd]; // collect command and its arguments

        // Skip whitespace before arguments
        const skipWhitespace = (p: number): number => {
            while (p < text.length && (text[p] === " " || text[p] === "\t")) p++;
            return p;
        };

        let changed: boolean;
        do {
            changed = false;

            // Try [optional]
            pos = skipWhitespace(pos);
            if (pos < text.length && text[pos] === "[") {
                const span = extractBracketSpan(text, pos);
                if (span) {
                    consumed.push(`[${span[0]}]`);
                    pos = span[1];
                    changed = true;
                    continue;
                }
            }

            // Try {mandatory}
            pos = skipWhitespace(pos);
            if (pos < text.length && text[pos] === "{") {
                const span = extractBracedSpan(text, pos);
                if (span) {
                    consumed.push(`{${span[0]}}`);
                    pos = span[1];
                    changed = true;
                    continue;
                }
            }
        } while (changed);

        // Build the full raw LaTeX string that was consumed
        const rawLatex = consumed.join("");

        // Determine the salvaged content:
        // - If the command has {braced args}, extract their content and show it
        //   (the content may be partially converted by earlier pipeline steps)
        // - If the command has no arguments, show the full raw LaTeX in an error box
        // Extract braced content: "\cmd{a}{b}" → a, b
        const bracedArgs: string[] = [];
        for (const part of consumed.slice(1)) {
            // part is either "[opt]" or "{content}"
            const braceMatch = part.match(/^\{([\s\S]*)\}$/);
            if (braceMatch) bracedArgs.push(braceMatch[1]);
        }

        if (bracedArgs.length > 0) {
            // We have braced content — salvage it with a subtle indicator
            // The content may already be partially converted by the pipeline
            const salvaged = bracedArgs.join(", ");
            const escaped = salvaged
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            result.push(
                `<span class="latex-error">` +
                `<span class="latex-error-label">⚠️</span> ` +
                `<code class="latex-error-code">${escaped}</code>` +
                `</span>`
            );
        } else {
            // No braced content — show the full raw LaTeX in an error box
            const escapedCmd = rawLatex
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            result.push(
                `<span class="latex-error">` +
                `<span class="latex-error-label">⚠️</span> ` +
                `<code class="latex-error-code">${escapedCmd}</code>` +
                `</span>`
            );
        }

        i = pos;
    }

    return result.join("");
}
