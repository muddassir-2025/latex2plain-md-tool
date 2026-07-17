/**
 * Convert LaTeX root commands to Unicode:
 *
 *   \sqrt{x}     →  √x
 *   \sqrt{x+1}   →  √(x+1)
 *   \sqrt[2]{x}  →  √x
 *   \sqrt[3]{x}  →  ∛x
 *   \sqrt[4]{x}  →  ∜x
 */
const NTH_ROOT_SYMBOLS = {
    "2": "√",
    "3": "∛",
    "4": "∜",
};
/**
 * Extract brace-balanced content starting at position `start` where text[start] === '{'.
 * Returns [content, indexAfterClosingBrace].
 */
function extractBraced(text, start) {
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
        }
        else if (text[i] === "}") {
            depth--;
            if (depth === 0)
                return [content, i + 1];
            content += text[i];
        }
        else {
            content += text[i];
        }
    }
    return [content, i];
}
/**
 * Format the radicand: single-token gets no parens, expressions get parens.
 */
function formatRadicand(inner) {
    const trimmed = inner.trim();
    if (/^[a-zA-Z0-9αβγδεζηθικλμνξπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΠΡΣΤΥΦΧΨΩ]+$/.test(trimmed)) {
        return trimmed;
    }
    return `(${trimmed})`;
}
export function convertRoots(text) {
    let result = "";
    let i = 0;
    while (i < text.length) {
        const matchIndex = text.indexOf("\\sqrt", i);
        if (matchIndex === -1) {
            result += text.slice(i);
            break;
        }
        result += text.slice(i, matchIndex);
        let pos = matchIndex + 5; // skip \sqrt
        // Check for optional [n] argument
        let nthRoot = "2";
        if (pos < text.length && text[pos] === "[") {
            const closeIdx = text.indexOf("]", pos);
            if (closeIdx !== -1) {
                nthRoot = text.slice(pos + 1, closeIdx).trim();
                pos = closeIdx + 1;
            }
        }
        // Extract the radicand from { }
        if (pos < text.length && text[pos] === "{") {
            const [inner, afterClose] = extractBraced(text, pos);
            const symbol = NTH_ROOT_SYMBOLS[nthRoot] ?? `${nthRoot}√`;
            result += `${symbol}${formatRadicand(inner)}`;
            i = afterClose;
        }
        else {
            // No braces — grab one token
            const tokenMatch = text.slice(pos).match(/^([a-zA-Z0-9])/);
            if (tokenMatch) {
                const symbol = NTH_ROOT_SYMBOLS[nthRoot] ?? `${nthRoot}√`;
                result += `${symbol}${tokenMatch[1]}`;
                i = pos + tokenMatch[1].length;
            }
            else {
                result += "\\sqrt";
                i = pos;
            }
        }
    }
    return result;
}
