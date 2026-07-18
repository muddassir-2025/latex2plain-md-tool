/**
 * Convert \text{...} to its plain content.
 *
 * Handles nested braces:
 *   \text{hello}        →  hello
 *   \text{Speed = 5}    →  Speed = 5
 *   \text{f(x)}         →  f(x)
 */
export function convertText(text: string): string {
    // We need to handle nested braces, so we can't use a simple regex.
    // Instead, find each \text{ and extract the balanced brace content.
    let result = "";
    let i = 0;

    while (i < text.length) {
        // Look for \text{
        const matchIndex = text.indexOf("\\text{", i);
        if (matchIndex === -1) {
            result += text.slice(i);
            break;
        }

        // Append everything before \text{
        result += text.slice(i, matchIndex);

        // Find the matching closing brace
        let depth = 0;
        const start = matchIndex + 6; // skip \text{
        let j = start;

        for (; j < text.length; j++) {
            if (text[j] === "{") depth++;
            else if (text[j] === "}") {
                if (depth === 0) break;
                depth--;
            }
        }

        // Extract the inner content (without braces)
        result += text.slice(start, j);
        i = j + 1; // skip the closing }
    }

    return result;
}

/**
 * Convert \tag{...} to its content wrapped in parentheses.
 *
 *   \tag{1}  →  (1)
 *   \tag{*}  →  (*)
 *   \tag{1.1} →  (1.1)
 */
export function convertTag(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
        // Look for \tag{
        const matchIndex = text.indexOf("\\tag{", i);
        if (matchIndex === -1) {
            result += text.slice(i);
            break;
        }

        // Append everything before \tag{
        result += text.slice(i, matchIndex);

        // Find the matching closing brace
        let depth = 0;
        const start = matchIndex + 5; // skip \tag{
        let j = start;

        for (; j < text.length; j++) {
            if (text[j] === "{") depth++;
            else if (text[j] === "}") {
                if (depth === 0) break;
                depth--;
            }
        }

        // Extract inner content and wrap in parentheses
        const inner = text.slice(start, j);
        result += `──────── (${inner.trim()})`;
        i = j + 1; // skip the closing }
    }

    return result;
}
