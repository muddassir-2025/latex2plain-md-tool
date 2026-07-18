/**
 * Convert LaTeX root commands to Unicode:
 *
 *   \sqrt{x}     →  √x
 *   \sqrt{x+1}   →  √(x+1)
 *   \sqrt[2]{x}  →  √x
 *   \sqrt[3]{x}  →  ∛x
 *   \sqrt[4]{x}  →  ∜x
 */

import { extractBraced, formatFracPart } from "./utils.js";
import { convertFractions } from "./fractions.js";
import { convertInner } from "./convert-inner.js";

const NTH_ROOT_SYMBOLS: Record<string, string> = {
    "2": "√",
    "3": "∛",
    "4": "∜",
};

/**
 * Format the radicand: single-token gets no parens, expressions get parens.
 */
function formatRadicand(inner: string): string {
    const trimmed = inner.trim();
    if (/^[a-zA-Z0-9αβγδεζηθικλμνξπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΠΡΣΤΥΦΧΨΩ]+$/.test(trimmed)) {
        return trimmed;
    }
    return `(${trimmed})`;
}

export function convertRoots(text: string): string {
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
            // Recursively convert the radicand
            let convertedRadicand = convertRoots(inner);      // same-type nesting
            convertedRadicand = convertFractions(convertedRadicand); // cross-type
            convertedRadicand = convertInner(convertedRadicand);     // injected pipeline
            const symbol = NTH_ROOT_SYMBOLS[nthRoot] ?? `${nthRoot}√`;
            result += `${symbol}${formatRadicand(convertedRadicand)}`;
            i = afterClose;
        } else {
            // No braces — grab one token
            const tokenMatch = text.slice(pos).match(/^([a-zA-Z0-9])/);
            if (tokenMatch) {
                const symbol = NTH_ROOT_SYMBOLS[nthRoot] ?? `${nthRoot}√`;
                result += `${symbol}${tokenMatch[1]}`;
                i = pos + tokenMatch[1].length;
            } else {
                result += "\\sqrt";
                i = pos;
            }
        }
    }

    return result;
}
