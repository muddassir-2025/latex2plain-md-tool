/**
 * Function-aware LaTeX conversions.
 *
 * 1. Parenthesization: \sin x → sin(x), \log n → log(n), etc.
 *    Runs after all other conversions so arguments are already plain.
 *
 * 2. \lim formatting: \lim_{x \to \infty} → lim (x → ∞)
 *    Runs before symbol mappings so we can grab the raw \lim command and
 *    pipe the subscript content through the full converter.
 */

import { extractBraced } from "./utils.js";
import { convertInner } from "./convert-inner.js";

// ─── Function names that get parenthesized arguments ─────────────────────────

export const FUNCTION_NAMES = [
    "sin",
    "cos",
    "tan",
    "csc",
    "sec",
    "cot",
    "sinh",
    "cosh",
    "tanh",
    "coth",
    "sech",
    "csch",
    "arcsin",
    "arccos",
    "arctan",
    "log",
    "ln",
    "lg",
    "exp",
];

// ─── Superscript Unicode ranges (from superscript.ts) ────────────────────────

const SUPERSCRIPT_CHARS =
    "\u2070\u00B9\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079" + // ⁰¹²³⁴⁵⁶⁷⁸⁹
    "\u207A\u207B\u207C\u207D\u207E" + // ⁺⁻⁼⁽⁾
    "\u1D43\u1D47\u1D9C\u1D48\u1D49" + // ᵃᵇᶜᵈᵉ
    "\u1DA0\u1D4D\u02B0\u2071\u02B2" + // ᶠᵍʰⁱʲ
    "\u1D4F\u02E1\u1D50\u207F\u1D52" + // ᵏˡᵐⁿᵒ
    "\u1D56\u02B3\u02E2\u1D57\u1D58" + // ᵖʳˢᵗᵘ
    "\u1D5B\u02B7\u02E3\u02B8"; // ᵛʷˣʸ

// ─── Lim name formatting ─────────────────────────────────────────────────────

/**
 * Convert raw \lim command to display name.
 *   \lim     → "lim"
 *   \limsup  → "lim sup"
 *   \liminf  → "lim inf"
 */
function formatLimName(cmd: string): string {
    switch (cmd) {
        case "\\limsup":
            return "lim sup";
        case "\\liminf":
            return "lim inf";
        default:
            return "lim";
    }
}

// ─── convertLim ──────────────────────────────────────────────────────────────

/**
 * Convert \lim_{...} (and \limsup, \liminf) to plain "func (converted)" form.
 *
 * This runs BEFORE symbol mappings so we consume the raw \lim command before
 * the operator mapper turns it into plain "lim" (which would be ambiguous).
 *
 *   \lim_{x \to \infty}        →  lim (x → ∞)
 *   \lim_{n \to 0} \frac{1}{n} →  lim (n → 0) (1/n)
 *   \limsup_{k \to \infty}     →  lim sup (k → ∞)
 */
export function convertLim(text: string): string {
    const LIM_PATTERN = /(\\lim(?:sup|inf)?)\s*_{/;

    let result = "";
    let i = 0;

    while (i < text.length) {
        const rest = text.slice(i);
        const match = rest.match(LIM_PATTERN);
        if (!match) {
            result += rest;
            break;
        }

        // Append everything before the match
        result += rest.slice(0, match.index!);

        const fullMatch = match[0]; // e.g. "\lim_{"
        const cmd = match[1];       // e.g. "\lim", "\limsup"
        const name = formatLimName(cmd);

        // Position of the opening { in the original text
        const bracePos = i + match.index! + fullMatch.length - 1;

        // Extract balanced brace content
        const [content, afterClose] = extractBraced(text, bracePos);

        // Recursively convert the subscript content (processes arrows, infinity, etc.)
        const convertedContent = convertInner(content).trim();

        result += `${name} (${convertedContent})`;
        i = afterClose;
    }

    return result;
}

// ─── convertFunctions ────────────────────────────────────────────────────────

/**
 * Add parentheses after function names that take an implicit argument.
 *
 * Runs AFTER all structural conversions (fractions, roots, sub/superscripts)
 * so that arguments are already in their final plain-text form.
 *
 * Examples:
 *   sin x           →  sin(x)
 *   sin (x+y)       →  sin(x+y)       (already parenthesized — no double-wrap)
 *   sin {x}         →  sin(x)         (braces stripped)
 *   cos θ           →  cos(θ)         (Greek letter handled by \S fallback)
 *   log n           →  log(n)
 *   sin² x          →  sin²(x)        (superscript preserved)
 */
export function convertFunctions(text: string): string {
    // Order of alternatives matters:
    //   1. {content}  — braced group
    //   2. (content)  — already parenthesized
    //   3. \w+        — word token (letters, digits, underscore)
    //   4. \S         — single non-whitespace char (fallback for Greek letters etc.)
    const funcRe = new RegExp(
        `\\b(${FUNCTION_NAMES.join("|")})\\b` +
            // Optional superscript decoration (e.g. ², ³, ⁿ)
            `([${SUPERSCRIPT_CHARS}]*)` +
            `\\s*` +
            `(?:` +
            `\\{([^}]*)\\}|` +   // braced: {content}
            `(\\([^)]*\\))|` +   // already parenthesized: (content)
            `(\\w+)|` +          // word token (letters, digits, underscore)
            `(\\S)` +            // single non-space char (Greek, operators, etc.)
            `)`,
        "g",
    );

    const callback = (
        _match: string,
        name: string,
        superscript: string | undefined,
        braced: string | undefined,
        parenthesized: string | undefined,
        wordToken: string | undefined,
        anyToken: string | undefined,
    ): string => {
        const sup = superscript || "";
        if (braced !== undefined) {
            return `${name}${sup}(${braced})`;
        }
        if (parenthesized !== undefined) {
            // Already wrapped — just remove the space
            return `${name}${sup}${parenthesized}`;
        }
        // Word token or single non-space char
        const token = wordToken ?? anyToken!;
        return `${name}${sup}(${token})`;
    };

    // Loop to handle chained function calls via outer pass
    let prev: string;
    do {
        prev = text;
        text = text.replace(funcRe, callback);
    } while (text !== prev);

    return text;
}
