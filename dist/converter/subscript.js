// Unicode subscript character map
const SUBSCRIPT_MAP = {
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
    "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
    "a": "ₐ", "e": "ₑ", "o": "ₒ", "x": "ₓ",
    "h": "ₕ", "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ",
    "p": "ₚ", "s": "ₛ", "t": "ₜ",
    "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
};
/**
 * Convert a string of characters to subscript Unicode equivalents.
 * Falls back to original characters for unmapped ones.
 */
function toSubscript(chars) {
    return chars.split("").map(c => SUBSCRIPT_MAP[c] ?? c).join("");
}
/**
 * Convert LaTeX subscripts to Unicode:
 *   x_0      →  x₀
 *   x_12     →  x₁₂
 *   x_{123}  →  x₁₂₃
 *   H_{2O}   →  H₂O   (partially mapped)
 */
export function convertSubscripts(text) {
    // Handle braced subscripts: _{...}
    text = text.replace(/_{([^}]*)}/g, (_match, inner) => {
        return toSubscript(inner);
    });
    // Handle single-char or multi-digit subscripts: _0, _12 (digits only)
    text = text.replace(/_(\d+)/g, (_match, digits) => {
        return toSubscript(digits);
    });
    // Handle single char subscript: _a, _n, _x (one char)
    text = text.replace(/_([a-zA-Z0-9])/g, (_match, ch) => {
        return toSubscript(ch);
    });
    return text;
}
