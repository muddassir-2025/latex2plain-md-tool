/**
 * Custom CSS for md-to-pdf PDF output.
 *
 * Complete typography overhaul for professional, readable PDFs:
 *   - Serif body font for comfortable long-form reading
 *   - Controlled line length (~65–70 chars per line)
 *   - Proper heading hierarchy with subtle styling
 *   - Page numbers in footer
 *   - Clean code blocks, tables, blockquotes
 *   - Highlight.js GitHub theme for syntax highlighting
 */

/* =========================================================
   highlight.js GitHub theme (light) — syntax highlighting
   ========================================================= */
const HIGHLIGHT_CSS = `
.hljs {
  color: #24292e;
  background: transparent;
}
.hljs-doctag,
.hljs-keyword,
.hljs-meta .hljs-keyword,
.hljs-template-tag,
.hljs-template-variable,
.hljs-type,
.hljs-variable.language_ {
  color: #d73a49;
}
.hljs-title,
.hljs-title.class_,
.hljs-title.class_.inherited__,
.hljs-title.function_ {
  color: #6f42c1;
}
.hljs-attr,
.hljs-attribute,
.hljs-literal,
.hljs-meta,
.hljs-number,
.hljs-operator,
.hljs-variable,
.hljs-selector-attr,
.hljs-selector-class,
.hljs-selector-id {
  color: #005cc5;
}
.hljs-regexp,
.hljs-string,
.hljs-meta .hljs-string {
  color: #032f62;
}
.hljs-built_in,
.hljs-symbol {
  color: #e36209;
}
.hljs-comment,
.hljs-code,
.hljs-formula {
  color: #6a737d;
}
.hljs-name,
.hljs-quote,
.hljs-selector-tag,
.hljs-selector-pseudo {
  color: #22863a;
}
.hljs-subst {
  color: #24292e;
}
.hljs-section {
  color: #005cc5;
  font-weight: bold;
}
.hljs-bullet {
  color: #735c0f;
}
.hljs-emphasis {
  color: #24292e;
  font-style: italic;
}
.hljs-strong {
  color: #24292e;
  font-weight: bold;
}
.hljs-addition {
  color: #22863a;
  background-color: #f0fff4;
}
.hljs-deletion {
  color: #b31d28;
  background-color: #ffeef0;
}
`;

/* =========================================================
   Layout & typography — professional print styling
   ========================================================= */
const BASE_CSS = `
* {
    box-sizing: border-box;
}

/* ── Page setup ──────────────────────────────────────────── */
@page {
    margin: 60pt 94pt 72pt 94pt !important;
    /* 1.3in side margins for ~75 char line length */
    @bottom-right {
        content: counter(page);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            "Helvetica Neue", Arial, sans-serif;
        font-size: 8pt;
        color: #a8a29e;
    }
}

/* ── Body ────────────────────────────────────────────────── */
body {
    font-family: "STIX Two Text", "Georgia", "Times New Roman", serif !important;
    color: #1c1917 !important;
    line-height: 1.55 !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: 10.5pt !important;
    orphans: 3;
    widows: 3;
}

/* ── Math inline ─────────────────────────────────────────── */
.math, .math-inline {
    font-family: "STIX Two Text", "Cambria Math", "Latin Modern Math",
        "Times New Roman", serif !important;
    font-style: italic;
}

/* ── Headings ─────────────────────────────────────────────── */
h1, h2, h3, h4, h5, h6 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        "Helvetica Neue", Arial, sans-serif !important;
    color: #1c1917 !important;
    font-weight: 650 !important;
    line-height: 1.25 !important;
    margin-top: 1.4em !important;
    margin-bottom: 0.4em !important;
    page-break-after: avoid;
}

h1 {
    font-size: 20pt !important;
    margin-top: 0 !important;
    letter-spacing: -0.02em;
}

h2 {
    font-size: 15pt !important;
    border-bottom: 1.5px solid #e7e5e4;
    padding-bottom: 3pt;
}

h3 {
    font-size: 12.5pt !important;
}

h4 {
    font-size: 11pt !important;
}

h5, h6 {
    font-size: 10.5pt !important;
}

/* ── Paragraphs ───────────────────────────────────────────── */
p {
    margin-bottom: 0.65em !important;
}

/* ── Links ────────────────────────────────────────────────── */
a {
    color: #7c3aed !important;
    text-decoration: none !important;
    border-bottom: 0.5px solid #d8b4fe;
}
a:hover {
    border-bottom-color: #7c3aed;
}

/* ── Lists ────────────────────────────────────────────────── */
ul, ol {
    margin: 0.4em 0 !important;
    padding-left: 1.4em !important;
}

li {
    margin-bottom: 0.2em !important;
}

li > ul, li > ol {
    margin: 0.15em 0 0 1em !important;
}

/* ── Blockquotes ──────────────────────────────────────────── */
blockquote {
    border-left: 3pt solid #7c3aed !important;
    background: #f5f3ff !important;
    padding: 5pt 11pt !important;
    margin: 0.8em 0 !important;
    border-radius: 0 4pt 4pt 0 !important;
    color: #44403c !important;
}

blockquote p:last-child {
    margin-bottom: 0 !important;
}

/* ── Horizontal rule ──────────────────────────────────────── */
hr {
    border: none !important;
    border-top: 1.5px solid #d6d3d1 !important;
    margin: 1.5em 0 !important;
}

/* ── Tables ───────────────────────────────────────────────── */
table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 0.8em 0 !important;
    font-size: 0.85em !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        "Helvetica Neue", Arial, sans-serif !important;
}

th, td {
    border: 1px solid #e7e5e4 !important;
    padding: 3.5pt 7pt !important;
    text-align: left !important;
    vertical-align: top !important;
}

th {
    background: #f5f3ff !important;
    font-weight: 600 !important;
    color: #292524 !important;
}

/* Alternating row colors for readability */
tbody tr:nth-child(even) {
    background: #fafaf9 !important;
}

img {
    max-width: 100% !important;
    page-break-inside: avoid;
}

/* ── Unrecognized LaTeX error boxes ───────────────────────── */
.latex-error {
    display: inline-block;
    border: 1.5pt solid #dc2626 !important;
    background: #fef2f2 !important;
    padding: 3pt 6pt !important;
    border-radius: 4pt !important;
    font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas,
        monospace !important;
    font-size: 0.8em !important;
    line-height: 1.4 !important;
    margin: 0 1pt;
    page-break-inside: avoid;
    vertical-align: middle;
}

.latex-error-label {
    font-size: 0.85em;
    margin-right: 2pt;
}

.latex-error-code {
    background: none !important;
    border: none !important;
    padding: 0 !important;
    font-size: 0.9em !important;
    color: #b91c1c !important;
}


`;

/* =========================================================
   Code block styling
   ========================================================= */
const CODE_CSS = `
code {
    font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas,
        monospace !important;
    font-size: 0.8em !important;
    background: #f5f5f4 !important;
    padding: 0.1em 0.35em !important;
    border-radius: 2.5px !important;
    border: 0.5px solid #e7e5e4 !important;
}

pre {
    background: #f8f8f8 !important;
    border: 0.5px solid #e7e5e4 !important;
    border-radius: 4pt !important;
    padding: 8pt 10pt !important;
    overflow-x: auto !important;
    margin: 0.8em 0 !important;
    page-break-inside: avoid;
}

/* Plain (unhighlighted) code inside pre */
pre code {
    background: none !important;
    border: none !important;
    padding: 0 !important;
    font-size: 8pt !important;
    line-height: 1.4 !important;
}

/* Highlighted code inside pre — remove double padding */
pre code.hljs {
    background: none !important;
    border: none !important;
    padding: 0 !important;
    font-size: 8pt !important;
    line-height: 1.4 !important;
}
`;

// ─── Exported style ─────────────────────────────────────────────────────────

export const PDF_STYLE = `${HIGHLIGHT_CSS}\n${BASE_CSS}\n${CODE_CSS}`;
