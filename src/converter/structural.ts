/**
 * Structural LaTeX command converters.
 *
 * Handles commands that take brace arguments and need structural output:
 *
 *   \binom{n}{k}     →  C(n,k)
 *   \pmod{n}         →  (mod n)
 *   \label{foo}      →  (removed — internal anchor)
 *   \ref{foo}        →  (keeps the label name)
 *   \eqref{foo}      →  (label name)
 *   \notag           →  (removed)
 *   \tag*{...}       →  (content)   (starred tag variant)
 */

/**
 * Extract brace-balanced content starting at position `start` where text[start] === '{'.
 * Returns [content, indexAfterClosingBrace].
 */
function extractBraced(text: string, start: number): [string, number] {
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
        } else if (text[i] === "}") {
            depth--;
            if (depth === 0) return [content, i + 1];
            content += text[i];
        } else {
            content += text[i];
        }
    }

    return [content, i];
}

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
        let pos = matchIndex + 6; // skip \binom

        // Skip whitespace before first brace
        while (pos < text.length && text[pos] === " ") pos++;

        if (pos < text.length && text[pos] === "{") {
            const [num, afterNum] = extractBraced(text, pos);

            // Skip whitespace between braces
            let after = afterNum;
            while (after < text.length && text[after] === " ") after++;

            if (after < text.length && text[after] === "{") {
                const [den, afterDen] = extractBraced(text, after);
                result += `C(${num},${den})`;
                i = afterDen;
            } else {
                // Only one argument — emit as C(n)
                result += `C(${num})`;
                i = afterNum;
            }
        } else {
            // No braces — just emit as-is
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
        let pos = matchIndex + 5; // skip \pmod

        // Skip optional whitespace before brace
        while (pos < text.length && text[pos] === " ") pos++;

        if (pos < text.length && text[pos] === "{") {
            const [inner, afterClose] = extractBraced(text, pos);
            result += `(mod ${inner.trim()})`;
            i = afterClose;
        } else {
            // No braces — emit as-is
            result += "\\pmod";
            i = pos;
        }
    }

    return result;
}

/**
 * Convert common reference commands.
 *
 *   \label{name}   →  (stripped — internal anchor, no output)
 *   \ref{name}     →  name
 *   \eqref{name}   →  (name)
 */
export function convertRefs(text: string): string {
    // Strip \label{...} entirely
    text = text.replace(/\\label\{([^}]*)\}/g, "");

    // Strip \ref{...}, keep the label name
    text = text.replace(/\\ref\{([^}]*)\}/g, (_match, label: string) => label.trim());

    // Convert \eqref{...} → (label)
    text = text.replace(/\\eqref\{([^}]*)\}/g, (_match, label: string) => `(${label.trim()})`);

    return text;
}

/**
 * Remove \notag commands and handle \tag*{...} (starred variant).
 *
 *   \notag     →  (removed)
 *   \tag*{1}   →  (1)
 */
export function convertNotag(text: string): string {
    // Remove \notag (with optional trailing whitespace)
    text = text.replace(/\\notag\s*/g, "");

    // Convert \tag*{content} → (content) — same as \tag{content}
    text = text.replace(/\\tag\*\{([^}]*)\}/g, (_match, inner: string) => `(${inner.trim()})`);

    return text;
}
