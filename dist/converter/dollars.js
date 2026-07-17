/**
 * Strip LaTeX dollar delimiters from text.
 *
 * Handles:
 *   $$\n...\n$$   →  content only (display math)
 *   $...$          →  content only (inline math)
 *
 * Order matters: strip display $$ before inline $ to avoid partial matches.
 */
export function stripDollars(text) {
    // Display math: $$ ... $$ (possibly multiline)
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, inner) => {
        return inner.trim();
    });
    // Inline math: $...$ (single line only)
    text = text.replace(/\$([^$\n]+?)\$/g, (_match, inner) => {
        return inner.trim();
    });
    return text;
}
