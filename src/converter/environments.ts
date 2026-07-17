/**
 * Strip or convert LaTeX math environments.
 *
 * Handles:
 *   \begin{align}...\end{align}
 *   \begin{aligned}...\end{aligned}
 *   \begin{equation}...\end{equation}
 *   \begin{gather}...\end{gather}
 *   \begin{multline}...\end{multline}
 *   \begin{matrix}...\end{matrix}
 *   \begin{pmatrix}...\end{pmatrix}
 *   \begin{bmatrix}...\end{bmatrix}
 *   \begin{vmatrix}...\end{vmatrix}
 *   \begin{Vmatrix}...\end{Vmatrix}
 *   \begin{cases}...\end{cases}
 *   \hline, \hdashline
 *
 * Within environments:
 *   \\  →  ;    (line break → semicolon)
 *   &   →  (removed, separator becomes space)
 *
 * The approach: identify all \begin{...}...\end{...} blocks and process them.
 */

/** Known LaTeX math environments that should be stripped to plain text. */
const KNOWN_ENVIRONMENTS = [
    "align",
    "align*",
    "aligned",
    "equation",
    "equation*",
    "gather",
    "gather*",
    "gathered",
    "multline",
    "multline*",
    "split",
    "matrix",
    "pmatrix",
    "bmatrix",
    "vmatrix",
    "Vmatrix",
    "smallmatrix",
    "cases",
    "dcases",
    "rcases",
    "array",
    "subarray",
    "eqnarray",
    "eqnarray*",
    "flalign",
    "flalign*",
    "alignat",
    "alignat*",
];

/**
 * Strip \begin{env} and \end{env} markers, converting \\ and & inside.
 * For unknown environments, they pass through unchanged.
 */
export function stripEnvironments(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
        // Look for \begin{<name>}
        const beginMatch = text.slice(i).match(/\\begin\{([^}]*)\}/);
        if (!beginMatch) {
            result += text.slice(i);
            break;
        }

        const envName = beginMatch[1];
        const beginIdx = i + beginMatch.index!;

        // If this is not a known environment, skip past it
        if (!KNOWN_ENVIRONMENTS.includes(envName)) {
            result += text.slice(i, beginIdx + beginMatch[0].length);
            i = beginIdx + beginMatch[0].length;
            continue;
        }

        // Append everything before \begin{...}
        result += text.slice(i, beginIdx);

        // Find the matching \end{envName}
        const endTag = `\\end{${envName}}`;
        const endIdx = text.indexOf(endTag, beginIdx + beginMatch[0].length);

        if (endIdx === -1) {
            // No matching \end — just skip the \begin marker
            result += text.slice(beginIdx, beginIdx + beginMatch[0].length);
            i = beginIdx + beginMatch[0].length;
            continue;
        }

        // Extract the inner content and process it
        const innerStart = beginIdx + beginMatch[0].length;
        const innerRaw = text.slice(innerStart, endIdx);

        // Convert \\ to ; (with possible trailing whitespace)
        // and remove & (column separators)
        const processed = innerRaw
            .replace(/\\\\\s*/g, " ; ")
            .replace(/&/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        result += processed;
        i = endIdx + endTag.length;
    }

    return result;
}

/**
 * Strip \hline and \hdashline.
 */
export function stripHlines(text: string): string {
    return text.replace(/\\hline\s*/g, "").replace(/\\hdashline\s*/g, "");
}
