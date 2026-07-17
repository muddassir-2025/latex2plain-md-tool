/**
 * Convert \text{...} to its plain content.
 *
 * Handles nested braces:
 *   \text{hello}        →  hello
 *   \text{Speed = 5}    →  Speed = 5
 *   \text{f(x)}         →  f(x)
 */
export function convertText(text) {
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
        let start = matchIndex + 6; // skip \text{
        let j = start;
        for (; j < text.length; j++) {
            if (text[j] === "{")
                depth++;
            else if (text[j] === "}") {
                if (depth === 0)
                    break;
                depth--;
            }
        }
        // Extract the inner content (without braces)
        result += text.slice(start, j);
        i = j + 1; // skip the closing }
    }
    return result;
}
