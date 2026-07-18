/**
 * Shared utility functions for the conversion pipeline.
 */

/**
 * Extract brace-balanced content starting at position `start` where text[start] === '{'.
 * Returns [content, indexAfterClosingBrace].
 */
export function extractBraced(text: string, start: number): [string, number] {
    let depth = 0;
    let i = start;
    let content = "";

    for (; i < text.length; i++) {
        if (text[i] === "{") {
            if (depth === 0) {
                depth++;
                continue;
            }
            depth++;
            content += text[i];
        } else if (text[i] === "}") {
            depth--;
            if (depth === 0) return [content, i + 1];
            content += text[i];
        } else {
            content += text[i];
        }
    }

    return [content, i];
}

/**
 * Format a fraction-like part: single tokens get no parens, expressions get parens.
 *
 * Skips wrapping if the content is already wrapped in matching parentheses
 * (avoids double-wrapping when the content comes from a nested conversion).
 */
export function formatFracPart(part: string): string {
    const trimmed = part.trim();

    // Already wrapped in matching parens — don't double-wrap
    if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
        return trimmed;
    }

    // Check if it looks like a function call: word + optional superscripts + (content)
    // e.g. sin(x), log(n+1), sin²(x), f(g(x))
    // This avoids double-wrapping: sin(x) stays sin(x), not (sin(x))
    // while still wrapping expressions like a + sin(x).
    if (trimmed.endsWith(")")) {
        const lastParen = trimmed.lastIndexOf("(");
        if (lastParen > 0) {
            const beforeParen = trimmed.slice(0, lastParen);
            // Before the (...) should be only word chars, Greek, or superscripts (no spaces/punctuation)
            if (/^[a-zA-Z0-9αβγδεζηθικλμνξπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΠΡΣΤΥΦΧΨΩ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸ]+$/.test(beforeParen)) {
                return trimmed;
            }
        }
    }

    // Single token (letters, digits, Greek) — no wrapping needed
    if (/^[a-zA-Z0-9αβγδεζηθικλμνξπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΠΡΣΤΥΦΧΨΩ]+$/.test(trimmed)) {
        return trimmed;
    }

    // Everything else gets wrapped
    return `(${trimmed})`;
}
