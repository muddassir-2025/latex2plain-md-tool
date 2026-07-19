/**
 * Custom CSS for md-to-pdf PDF output.
 *
 * This matches the design of our HTML template — same colors, fonts,
 * spacing, and code block styling — applied to md-to-pdf's rendered output.
 */
export const PDF_STYLE = `
/* ── Base ──────────────────────────────────────────── */
* {
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        "Helvetica Neue", Arial, sans-serif !important;
    color: #1c1917 !important;
    line-height: 1.7 !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: 11pt !important;
}

/* ── Math / Unicode symbols ────────────────────────── */
.math, .math-inline {
    font-family: "STIX Two Text", "Cambria Math", "Latin Modern Math",
        "Times New Roman", serif !important;
    font-style: italic;
}

/* ── Headings ──────────────────────────────────────── */
h1, h2, h3, h4, h5, h6 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    color: #292524 !important;
    font-weight: 650 !important;
    line-height: 1.3 !important;
    margin-top: 1.5em !important;
    margin-bottom: 0.5em !important;
    page-break-after: avoid;
}

h1 { font-size: 22pt !important; margin-top: 0 !important; }
h2 { font-size: 17pt !important; border-bottom: 2px solid #ede9fe; padding-bottom: 4pt; }
h3 { font-size: 14pt !important; }
h4 { font-size: 12pt !important; }
h5, h6 { font-size: 11pt !important; }

/* ── Paragraphs ────────────────────────────────────── */
p {
    margin-bottom: 0.75em !important;
    orphans: 3;
    widows: 3;
}

/* ── Links ─────────────────────────────────────────── */
a {
    color: #7c3aed !important;
    text-decoration: none !important;
}

/* ── Code ──────────────────────────────────────────── */
code {
    font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas,
        monospace !important;
    font-size: 0.85em !important;
    background: #f5f5f4 !important;
    padding: 0.15em 0.4em !important;
    border-radius: 3px !important;
    border: 1px solid #e7e5e4 !important;
}

pre {
    background: #f5f5f4 !important;
    border: 1px solid #e7e5e4 !important;
    border-radius: 6px !important;
    padding: 10pt 12pt !important;
    overflow-x: auto !important;
    margin: 1em 0 !important;
    page-break-inside: avoid;
}

pre code {
    background: none !important;
    border: none !important;
    padding: 0 !important;
    font-size: 8.5pt !important;
    line-height: 1.45 !important;
}

/* ── Lists ─────────────────────────────────────────── */
ul, ol {
    margin: 0.5em 0 !important;
    padding-left: 1.5em !important;
}

li {
    margin-bottom: 0.25em !important;
}

/* ── Blockquotes ───────────────────────────────────── */
blockquote {
    border-left: 4px solid #7c3aed !important;
    background: #ede9fe !important;
    padding: 6pt 12pt !important;
    margin: 1em 0 !important;
    border-radius: 0 6px 6px 0 !important;
}

/* ── Horizontal rules ──────────────────────────────── */
hr {
    border: none !important;
    border-top: 2px solid #d6d3d1 !important;
    margin: 2em 0 !important;
}

/* ── Tables ────────────────────────────────────────── */
table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 1em 0 !important;
    font-size: 0.9em !important;
}

th, td {
    border: 1px solid #e7e5e4 !important;
    padding: 4pt 8pt !important;
    text-align: left !important;
}

th {
    background: #ede9fe !important;
    font-weight: 600 !important;
}

/* ── Images ────────────────────────────────────────── */
img {
    max-width: 100% !important;
}

/* ── Page setup ────────────────────────────────────── */
@page {
    margin: 56pt 65pt !important;
}
`;
