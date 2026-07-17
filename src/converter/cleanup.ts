/**
 * Clean up whitespace artefacts left after conversion:
 *
 * 1. Trim trailing spaces from each line.
 * 2. Collapse 3+ consecutive spaces on a single line to 1 space.
 * 3. Collapse 3+ consecutive blank lines to a single blank line.
 * 4. Ensure file ends with exactly one newline.
 */
export function cleanup(text: string): string {
    // Split into lines
    const lines = text.split("\n");

    const cleaned = lines.map((line) => {
        // Trim trailing whitespace
        line = line.trimEnd();
        // Collapse multiple consecutive spaces to one
        line = line.replace(/ {2,}/g, " ");
        return line;
    });

    // Join and collapse 3+ blank lines to a maximum of 2 (one blank line between paragraphs)
    const joined = cleaned.join("\n");
    const collapsed = joined.replace(/\n{3,}/g, "\n\n");

    // Ensure single trailing newline
    return collapsed.trimEnd() + "\n";
}
