/**
 * Reusable PDF generation module.
 *
 * Takes markdown text (already plain Unicode — or raw markdown that will be
 * converted), passes it through the existing latex2plain conversion pipeline,
 * and returns a PDF buffer via md-to-pdf / Puppeteer.
 *
 * Both the CLI and the web API call this same function.
 */

import { convert } from "./converter/index.js";
import { PDF_STYLE } from "./pdf-style.js";
import type { ConvertOptions } from "./types/mapping.js";

/**
 * Convert a markdown string (potentially containing LaTeX) to plain text and
 * generate a PDF Buffer from the result.
 *
 * @param markdown  Input text (may contain LaTeX math delimiters)
 * @param opts      Optional conversion flags (same as CLI --no-* flags)
 * @returns         PDF as a Buffer
 */
export async function convertToPdfBuffer(
    markdown: string,
    opts: ConvertOptions = {},
): Promise<Buffer> {
    // Step 1 — run through the existing LaTeX-to-Unicode pipeline
    const converted = convert(markdown, opts);

    // Step 2 — render to PDF via md-to-pdf (headless Chrome/Puppeteer)
    let mdToPdf: (content: { content: string }, options?: Record<string, unknown>) => Promise<{ content: Buffer }>;

    try {
        mdToPdf = (await import("md-to-pdf")).mdToPdf;
    } catch {
        throw new Error(
            "PDF generation requires the 'md-to-pdf' package. Install it with: npm install md-to-pdf",
        );
    }

    const pdf = await mdToPdf(
        { content: converted },
        {
            css: PDF_STYLE,
            pdf_options: {
                format: "A4",
                margin: {
                    top: "0.78in",
                    bottom: "0.78in",
                    left: "0.9in",
                    right: "0.9in",
                },
                printBackground: true,
            },
            // Required in Docker/Render environments where sandbox is unavailable
            launch_options: {
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                ],
            },
        },
    );

    return pdf.content;
}
