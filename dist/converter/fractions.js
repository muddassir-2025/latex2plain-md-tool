/**
 * Extract the content of a brace-balanced group starting right after position `start`.
 * Assumes text[start] === '{'.
 * Returns [content, indexAfterClosingBrace].
 */
function extractBraced(text, start) {
    let depth = 0;
    let i = start;
    let content = "";
    for (; i < text.length; i++) {
        if (text[i] === "{") {
            if (depth === 0) {
                // opening brace — don't include in content
                depth++;
                continue;
            }
            depth++;
            content += text[i];
        }
        else if (text[i] === "}") {
            depth--;
            if (depth === 0) {
                return [content, i + 1];
            }
            content += text[i];
        }
        else {
            content += text[i];
        }
    }
    // Unmatched brace — return whatever we have
    return [content, i];
}
/**
 * Format a fraction numerator/denominator:
 * - If the value is a single character or simple token, no parens.
 * - If it contains operators or spaces, wrap in parens.
 */
function formatFracPart(part) {
    const trimmed = part.trim();
    // Single token: one or two chars without operators
    if (/^[a-zA-Z0-9αβγδεζηθικλμνξπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΠΡΣΤΥΦΧΨΩ]+$/.test(trimmed)) {
        return trimmed;
    }
    return `(${trimmed})`;
}
/**
 * Convert \frac{numerator}{denominator} to plain text fraction.
 *
 *   \frac{1}{2}      →  1/2
 *   \frac{a+b}{c}    →  (a+b)/c
 *   \frac{1}{n+1}    →  1/(n+1)
 */
export function convertFractions(text) {
    let result = "";
    let i = 0;
    while (i < text.length) {
        const matchIndex = text.indexOf("\\frac{", i);
        if (matchIndex === -1) {
            result += text.slice(i);
            break;
        }
        result += text.slice(i, matchIndex);
        // Extract numerator
        const [num, afterNum] = extractBraced(text, matchIndex + 5); // skip \frac
        // Extract denominator — must start with {
        if (afterNum >= text.length || text[afterNum] !== "{") {
            // Malformed — emit as-is
            result += text.slice(matchIndex, afterNum);
            i = afterNum;
            continue;
        }
        const [den, afterDen] = extractBraced(text, afterNum);
        result += `${formatFracPart(num)}/${formatFracPart(den)}`;
        i = afterDen;
    }
    return result;
}
