/**
 * Custom CSS for md-to-pdf PDF output.
 *
 * This matches the design of our HTML template — same colors, fonts,
 * spacing, and code block styling — applied to md-to-pdf's rendered output.
 *
 * Includes highlight.js GitHub theme for syntax highlighting of code blocks.
 */

/* =========================================================
   highlight.js GitHub theme (light) — syntax highlighting
   ========================================================= */
const HIGHLIGHT_CSS = `
.hljs {
  color: #24292e;
  background: #ffffff;
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
   Layout & typography
   ========================================================= */
const BASE_CSS = `
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

.math, .math-inline {
    font-family: "STIX Two Text", "Cambria Math", "Latin Modern Math",
        "Times New Roman", serif !important;
    font-style: italic;
}

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

p {
    margin-bottom: 0.75em !important;
    orphans: 3;
    widows: 3;
}

a {
    color: #7c3aed !important;
    text-decoration: none !important;
}

ul, ol {
    margin: 0.5em 0 !important;
    padding-left: 1.5em !important;
}

li {
    margin-bottom: 0.25em !important;
}

blockquote {
    border-left: 4px solid #7c3aed !important;
    background: #ede9fe !important;
    padding: 6pt 12pt !important;
    margin: 1em 0 !important;
    border-radius: 0 6px 6px 0 !important;
}

hr {
    border: none !important;
    border-top: 2px solid #d6d3d1 !important;
    margin: 2em 0 !important;
}

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

img {
    max-width: 100% !important;
}

@page {
    margin: 56pt 65pt !important;
}
`;

/* =========================================================
   Code block styling (for unhighlighted blocks too)
   ========================================================= */
const CODE_CSS = `
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

/* Plain (unhighlighted) code inside pre */
pre code {
    background: none !important;
    border: none !important;
    padding: 0 !important;
    font-size: 8.5pt !important;
    line-height: 1.45 !important;
}

/* Highlighted code inside pre — remove double padding */
pre code.hljs {
    background: none !important;
    border: none !important;
    padding: 0 !important;
    font-size: 8.5pt !important;
    line-height: 1.45 !important;
}
`;

// ─── Exported style ─────────────────────────────────────────────────────────

export const PDF_STYLE = `${HIGHLIGHT_CSS}\n${BASE_CSS}\n${CODE_CSS}`;
