// Unicode superscript character map
const SUPERSCRIPT_MAP = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
    "n": "ⁿ", "i": "ⁱ", "a": "ᵃ", "b": "ᵇ", "c": "ᶜ",
    "d": "ᵈ", "e": "ᵉ", "f": "ᶠ", "g": "ᵍ", "h": "ʰ",
    "j": "ʲ", "k": "ᵏ", "l": "ˡ", "m": "ᵐ", "o": "ᵒ",
    "p": "ᵖ", "r": "ʳ", "s": "ˢ", "t": "ᵗ", "u": "ᵘ",
    "v": "ᵛ", "w": "ʷ", "x": "ˣ", "y": "ʸ", "z": "ᶻ",
};
/**
 * Convert a string of characters to superscript Unicode equivalents.
 * Falls back to original characters for unmapped ones.
 */
function toSuperscript(chars) {
    return chars.split("").map(c => SUPERSCRIPT_MAP[c] ?? c).join("");
}
/**
 * Convert LaTeX superscripts to Unicode:
 *   x^2      →  x²
 *   x^{12}   →  x¹²
 *   e^{-n}   →  e⁻ⁿ
 */
export function convertSuperscripts(text) {
    // Handle braced superscripts: ^{...}
    text = text.replace(/\^\{([^}]*)}/g, (_match, inner) => {
        return toSuperscript(inner);
    });
    // Handle single-char or multi-digit superscripts: ^2, ^12 (digits only)
    text = text.replace(/\^(\d+)/g, (_match, digits) => {
        return toSuperscript(digits);
    });
    // Handle single char superscript: ^a, ^n
    text = text.replace(/\^([a-zA-Z])/g, (_match, ch) => {
        return toSuperscript(ch);
    });
    return text;
}
