/**
 * Structural LaTeX commands: \binom, \pmod, \over, \choose, \atop.
 *
 * All now support recursive conversion via convertInner so that nested
 * LaTeX inside these commands is properly converted.
 *
 * \over / \choose / \atop have been ported from simple regex to loop-based
 * brace extraction, enabling proper nested-brace support.
 */

import { extractBraced, formatFracPart } from "./utils.js";
import { convertFractions } from "./fractions.js";
import { convertRoots } from "./roots.js";
import { convertInner } from "./convert-inner.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Recursively convert a piece of LaTeX content (fractions, roots, and full
 * pipeline via convertInner).
 *
 * Order: fractions first (same-type), then roots (cross-type), then full
 * pipeline (for all other conversions).  When the pipeline is active,
 * convertInner is redundant with the first two calls but essential for
 * unit-test isolation where no pipeline reference is set.
 */
function recursivelyConvert(text: string): string {
    let result = convertFractions(text);
    result = convertRoots(result);
    result = convertInner(result);
    return result;
}

/**
 * Find the matching opening brace by scanning backwards from `fromPos`.
 * Returns the index of the matching `{`, or -1 if not found.
 */
function findMatchingOpenBrace(text: string, fromPos: number): number {
    let depth = 0;
    for (let j = fromPos; j >= 0; j--) {
        if (text[j] === "}") depth++;
        else if (text[j] === "{") {
            if (depth === 0) return j;
            depth--;
        }
    }
    return -1;
}

/**
 * Find the matching closing brace by scanning forwards from `fromPos`.
 * Returns the index of the matching `}`, or -1 if not found.
 */
function findMatchingCloseBrace(text: string, fromPos: number): number {
    let depth = 0;
    for (let j = fromPos; j < text.length; j++) {
        if (text[j] === "{") depth++;
        else if (text[j] === "}") {
            if (depth === 0) return j;
            depth--;
        }
    }
    return -1;
}

/**
 * Extract numerator and denominator from a brace group containing a command.
 * Assumes the structure: { numerator \cmd denominator }
 *
 * Returns [num, den, braceStart, afterClose] or null if parsing fails.
 */
function extractBraceGroup(
    text: string,
    cmdIdx: number,
    cmdLen: number,
): [string, string, number, number] | null {
    // Find opening brace (scan backwards from just before the command)
    const braceStart = findMatchingOpenBrace(text, cmdIdx - 1);
    if (braceStart === -1) return null;

    // Find closing brace (scan forwards from just after the command)
    const braceEnd = findMatchingCloseBrace(text, cmdIdx + cmdLen);
    if (braceEnd === -1) return null;

    const num = text.slice(braceStart + 1, cmdIdx).trim();
    const den = text.slice(cmdIdx + cmdLen, braceEnd).trim();

    return [num, den, braceStart, braceEnd + 1];
}

// ─── \binom ──────────────────────────────────────────────────────────────────

/**
 * Convert \binom{n}{k} → C(n,k).
 *
 * Now recursively converts numerator and denominator:
 *   \binom{\frac{1}{2}}{3} → C((1/2),3)
 */
export function convertBinom(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
        const matchIndex = text.indexOf("\\binom", i);
        if (matchIndex === -1) {
            result += text.slice(i);
            break;
        }

        result += text.slice(i, matchIndex);
        let pos = matchIndex + 6;

        while (pos < text.length && text[pos] === " ") pos++;

        if (pos < text.length && text[pos] === "{") {
            const [num, afterNum] = extractBraced(text, pos);

            let after = afterNum;
            while (after < text.length && text[after] === " ") after++;

            if (after < text.length && text[after] === "{") {
                const [den, afterDen] = extractBraced(text, after);
                const convertedNum = recursivelyConvert(num);
                const convertedDen = recursivelyConvert(den);
                result += "C(" + convertedNum + "," + convertedDen + ")";
                i = afterDen;
            } else {
                const convertedNum = recursivelyConvert(num);
                result += "C(" + convertedNum + ")";
                i = afterNum;
            }
        } else {
            result += "\\binom";
            i = pos;
        }
    }

    return result;
}

// ─── \pmod ───────────────────────────────────────────────────────────────────

/**
 * Convert \pmod{n} → (mod n).
 *
 * Now recursively converts the content:
 *   \pmod{\frac{a}{b}} → (mod (a/b))
 */
export function convertPmod(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
        const matchIndex = text.indexOf("\\pmod", i);
        if (matchIndex === -1) {
            result += text.slice(i);
            break;
        }

        result += text.slice(i, matchIndex);
        let pos = matchIndex + 5;

        while (pos < text.length && text[pos] === " ") pos++;

        if (pos < text.length && text[pos] === "{") {
            const [inner, afterClose] = extractBraced(text, pos);
            const converted = recursivelyConvert(inner);
            result += "(mod " + converted.trim() + ")";
            i = afterClose;
        } else {
            result += "\\pmod";
            i = pos;
        }
    }

    return result;
}

// ─── References (\label, \ref, \eqref, \notag, \tag*) ────────────────────────

/**
 * Convert reference commands: \label{name} → "", \ref{name} → name, \eqref{name} → (name)
 */
export function convertRefs(text: string): string {
    text = text.replace(/\\label\{([^}]*)\}/g, "");
    text = text.replace(/\\ref\{([^}]*)\}/g, function (_match: string, label: string) {
        return label.trim();
    });
    text = text.replace(/\\eqref\{([^}]*)\}/g, function (_match: string, label: string) {
        return "(" + label.trim() + ")";
    });
    return text;
}

/**
 * Remove \notag and handle \tag*{...} → (content).
 */
export function convertNotag(text: string): string {
    text = text.replace(/\\notag\s*/g, "");
    text = text.replace(/\\tag\*\{([^}]*)\}/g, function (_match: string, inner: string) {
        return "(" + inner.trim() + ")";
    });
    return text;
}

// ─── \over ───────────────────────────────────────────────────────────────────

/**
 * Convert {a \over b} → (a/b).
 *
 * Uses loop-based brace extraction with recursive conversion:
 *   {a \over \frac{b}{c}} → (a/(b/c))
 */
export function convertOver(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
        const cmdIdx = text.indexOf("\\over", i);
        if (cmdIdx === -1) {
            result += text.slice(i);
            break;
        }

        const group = extractBraceGroup(text, cmdIdx, 5);
        // Skip if braces were already consumed by an inner match (nested \over)
        if (!group || group[2] < i) {
            result += text.slice(i, cmdIdx + 5);
            i = cmdIdx + 5;
            continue;
        }

        const [num, den, braceStart, afterClose] = group;
        result += text.slice(i, braceStart);
        result += "(" + formatFracPart(recursivelyConvert(num)) + "/" + formatFracPart(recursivelyConvert(den)) + ")";
        i = afterClose;
    }

    return result;
}

// ─── \choose ─────────────────────────────────────────────────────────────────

/**
 * Convert {n \choose k} → C(n,k).
 *
 * Uses loop-based brace extraction with recursive conversion:
 *   { {\frac{1}{2}} \choose 3 } → C((1/2),3)
 */
export function convertChoose(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
        const cmdIdx = text.indexOf("\\choose", i);
        if (cmdIdx === -1) {
            result += text.slice(i);
            break;
        }

        const group = extractBraceGroup(text, cmdIdx, 7);
        // Skip if braces were already consumed by an inner match (nested \choose)
        if (!group || group[2] < i) {
            result += text.slice(i, cmdIdx + 7);
            i = cmdIdx + 7;
            continue;
        }

        const [num, den, braceStart, afterClose] = group;
        result += text.slice(i, braceStart);
        result += "C(" + recursivelyConvert(num) + "," + recursivelyConvert(den) + ")";
        i = afterClose;
    }

    return result;
}

// ─── \atop ───────────────────────────────────────────────────────────────────

/**
 * Convert {a \atop b} → (a / b).
 *
 * Uses loop-based brace extraction with recursive conversion:
 *   {a+b \atop \frac{c}{d}} → ((a+b) / (c/d))
 */
export function convertAtop(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
        const cmdIdx = text.indexOf("\\atop", i);
        if (cmdIdx === -1) {
            result += text.slice(i);
            break;
        }

        const group = extractBraceGroup(text, cmdIdx, 5);
        // Skip if braces were already consumed by an inner match (nested \atop)
        if (!group || group[2] < i) {
            result += text.slice(i, cmdIdx + 5);
            i = cmdIdx + 5;
            continue;
        }

        const [num, den, braceStart, afterClose] = group;
        result += text.slice(i, braceStart);
        result += "(" + formatFracPart(recursivelyConvert(num)) + " / " + formatFracPart(recursivelyConvert(den)) + ")";
        i = afterClose;
    }

    return result;
}
