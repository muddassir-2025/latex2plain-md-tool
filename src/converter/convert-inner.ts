/**
 * Recursive converter bridge.
 *
 * Holds an injected pipeline reference so that converters can recursively
 * process extracted LaTeX content without creating circular imports.
 */

export type ConvertFn = (text: string) => string;

let innerConverter: ConvertFn | null = null;

/**
 * Set the full-pipeline converter function.  Called by runPipeline.
 */
export function setConverter(fn: ConvertFn): void {
    innerConverter = fn;
}

/**
 * Recursively convert a piece of LaTeX content.
 *
 * When runPipeline has injected itself (normal usage), this runs the full
 * pipeline.  When called directly by unit tests the converters fall back to
 * calling each other for cross-type nesting (fractions ↔ roots).
 */
export function convertInner(text: string): string {
    if (innerConverter) {
        return innerConverter(text);
    }
    // Fallback: when no pipeline reference is set (e.g. direct module tests),
    // return the text unchanged — individual converters handle their own
    // cross-calls via direct imports of each other.
    return text;
}
