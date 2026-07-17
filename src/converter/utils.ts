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
 */
export function formatFracPart(part: string): string {
    const trimmed = part.trim();
    if (/^[a-zA-Z0-9αβγδεζηθικλμνξπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΠΡΣΤΥΦΧΨΩ]+$/.test(trimmed)) {
        return trimmed;
    }
    return `(${trimmed})`;
}
