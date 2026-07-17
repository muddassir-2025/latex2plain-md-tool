import { runPipeline } from "./pipeline.js";
/**
 * Convert LaTeX math notation in a Markdown string to plain Unicode text.
 */
export function convert(text, opts = {}) {
    return runPipeline(text, opts);
}
