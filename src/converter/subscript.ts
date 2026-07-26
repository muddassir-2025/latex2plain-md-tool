// Unicode subscript character map
const SUBSCRIPT_MAP: Record<string, string> = {
    "0": "₀",
    "1": "₁",
    "2": "₂",
    "3": "₃",
    "4": "₄",
    "5": "₅",
    "6": "₆",
    "7": "₇",
    "8": "₈",
    "9": "₉",
    a: "ₐ",
    e: "ₑ",
    i: "ᵢ",
    j: "ⱼ",
    o: "ₒ",
    r: "ᵣ",
    u: "ᵤ",
    v: "ᵥ",
    x: "ₓ",
    h: "ₕ",
    k: "ₖ",
    l: "ₗ",
    m: "ₘ",
    n: "ₙ",
    p: "ₚ",
    s: "ₛ",
    t: "ₜ",
    "+": "₊",
    "-": "₋",
    "=": "₌",
    "(": "₍",
    ")": "₎",
};

/**
 * Convert a string of characters to subscript Unicode equivalents.
 * Falls back to original characters for unmapped ones.
 */
function toSubscript(chars: string): string {
    return chars
        .split("")
        .map((c) => SUBSCRIPT_MAP[c] ?? c)
        .join("");
}

/**
 * Convert LaTeX subscripts to Unicode:
 *   x_0      →  x₀
 *   x_12     →  x₁₂
 *   x_{123}  →  x₁₂₃
 *   H_{2O}   →  H₂O   (partially mapped)
 */
export function convertSubscripts(text: string): string {
    // Handle braced subscripts: _{...}
    text = text.replace(/_{([^}]*)}/g, (_match, inner: string) => {
        return toSubscript(inner);
    });

    // Handle single-char or multi-digit subscripts: _0, _12 (digits only)
    text = text.replace(/_(\d+)/g, (_match, digits: string) => {
        return toSubscript(digits);
    });

    // Handle single char subscript: _a, _n, _x (one char)
    // Only match when the captured char is NOT followed by another alphanumeric
    // (avoids converting word-internal underscores like `page_name` → `pageₙame`)
    text = text.replace(/_([a-zA-Z0-9])(?![a-zA-Z0-9])/g, (_match, ch: string) => {
        return toSubscript(ch);
    });

    return text;
}
