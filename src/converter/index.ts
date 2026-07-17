import { runPipeline } from "./pipeline.js";
import { ConvertOptions } from "../types/mapping.js";

/**
 * Convert LaTeX math notation in a Markdown string to plain Unicode text.
 */
export function convert(text: string, opts: ConvertOptions = {}): string {
    return runPipeline(text, opts);
}
