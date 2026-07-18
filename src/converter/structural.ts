import { extractBraced, formatFracPart } from "./utils.js";

/**
 * Convert \binom{n}{k} → C(n,k).
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
                result += "C(" + num + "," + den + ")";
                i = afterDen;
            } else {
                result += "C(" + num + ")";
                i = afterNum;
            }
        } else {
            result += "\\binom";
            i = pos;
        }
    }

    return result;
}

/**
 * Convert \pmod{n} → (mod n).
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
            result += "(mod " + inner.trim() + ")";
            i = afterClose;
        } else {
            result += "\\pmod";
            i = pos;
        }
    }

    return result;
}

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

// ─── \over / \choose / \atop ─────────────────────────────────────────────────

/**
 * Convert {a \over b} → a/b.
 */
export function convertOver(text: string): string {
    return text.replace(/\{([^}]*)\s*\\over\s*([^}]*)\}/g, function (_match: string, num: string, den: string) {
        return "(" + formatFracPart(num) + "/" + formatFracPart(den) + ")";
    });
}

/**
 * Convert {n \choose k} → C(n,k).
 */
export function convertChoose(text: string): string {
    return text.replace(/\{([^}]*)\s*\\choose\s*([^}]*)\}/g, function (_match: string, top: string, bottom: string) {
        return "C(" + top.trim() + "," + bottom.trim() + ")";
    });
}

/**
 * Convert {a \atop b} → a / b.
 */
export function convertAtop(text: string): string {
    return text.replace(/\{([^}]*)\s*\\atop\s*([^}]*)\}/g, function (_match: string, top: string, bottom: string) {
        return "(" + formatFracPart(top) + " / " + formatFracPart(bottom) + ")";
    });
}
