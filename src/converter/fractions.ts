/**
 * Convert \frac{numerator}{denominator} to plain text fraction.
 *
 * Handles standard and shorthand forms:
 *   \frac{1}{2}      →  1/2       (standard — both braced)
 *   \frac12          →  1/2       (shorthand — no braces, both single chars)
 *   \frac1{2}        →  1/2       (shorthand — first single char, second braced)
 *   \frac{1}2        →  1/2       (shorthand — first braced, second single char)
 *   \frac{a+b}{c}    →  (a+b)/c   (braced expression)
 *   \frac{1}{n+1}    →  1/(n+1)   (braced expression)
 */

import { extractBraced, formatFracPart } from "./utils.js";

/**
 * A single non-braced fraction argument (e.g. a digit, letter, or Greek char).
 */
const TOKEN_RE = /^[a-zA-Z0-9αβγδεζηθικλμνξπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΠΡΣΤΥΦΧΨΩ]/;

/**
 * Convert all \frac forms in text to plain-text fraction notation.
 */
export function convertFractions(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
        const matchIndex = text.indexOf("\\frac", i);
        if (matchIndex === -1) {
            result += text.slice(i);
            break;
        }

        const afterFrac = matchIndex + 5; // skip \frac
        let pos = afterFrac;

        // Guard: make sure \frac is not part of a longer command like \fracbox
        if (pos < text.length && /[a-zA-Z]/.test(text[pos]) && text[pos] !== "{") {
            result += text.slice(i, pos);
            i = pos;
            continue;
        }

        // Append everything before \frac
        result += text.slice(i, matchIndex);

        // ── Extract numerator ────────────────────────────────────────────────
        let num: string;
        let afterNum: number;

        // Skip whitespace before numerator
        while (pos < text.length && text[pos] === " ") pos++;

        if (pos >= text.length) {
            // \frac at end of string — emit as-is
            result += "\\frac";
            i = pos;
            break;
        }

        if (text[pos] === "{") {
            [num, afterNum] = extractBraced(text, pos);
        } else {
            const tokenMatch = text.slice(pos).match(TOKEN_RE);
            if (tokenMatch) {
                num = tokenMatch[0];
                afterNum = pos + tokenMatch[0].length;
            } else {
                // Not a valid \frac — emit as-is
                result += "\\frac";
                i = pos;
                continue;
            }
        }

        // ── Extract denominator ──────────────────────────────────────────────
        let den: string;
        let afterDen: number;

        // Skip whitespace before denominator
        let denPos = afterNum;
        while (denPos < text.length && text[denPos] === " ") denPos++;

        if (denPos >= text.length) {
            // No denominator — emit numerator only
            result += num;
            i = afterNum;
            continue;
        }

        if (text[denPos] === "{") {
            [den, afterDen] = extractBraced(text, denPos);
        } else {
            const tokenMatch = text.slice(denPos).match(TOKEN_RE);
            if (tokenMatch) {
                den = tokenMatch[0];
                afterDen = denPos + tokenMatch[0].length;
            } else {
                // Invalid denominator — emit \frac + numerator
                result += "\\frac" + num;
                i = afterNum;
                continue;
            }
        }

        result += formatFracPart(num) + "/" + formatFracPart(den);
        i = afterDen;
    }

    return result;
}
