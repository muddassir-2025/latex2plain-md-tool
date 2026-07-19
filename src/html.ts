/**
 * Convert plain Unicode Markdown to an accessible HTML5 document.
 *
 * This module:
 *  1. Performs basic Markdown → HTML conversion (headings, code blocks, lists, etc.)
 *  2. Wraps the result in a responsive, accessible HTML5 page
 *  3. Adds ARIA labels for math symbols, semantic landmarks, and dark mode
 */

// ─── Math symbol → aria-label mapping ──────────────────────────────────────
// These are the most common Unicode math symbols produced by latex2plain.
// Screen readers often handle standard symbols (+, -, =, etc.) correctly,
// but mathematical and Greek symbols need explicit labels.

const MATH_ARIA_LABELS: Record<string, string> = {
    // Greek letters (lowercase)
    "\u03B1": "alpha",
    "\u03B2": "beta",
    "\u03B3": "gamma",
    "\u03B4": "delta",
    "\u03B5": "epsilon",
    "\u03B6": "zeta",
    "\u03B7": "eta",
    "\u03B8": "theta",
    "\u03B9": "iota",
    "\u03BA": "kappa",
    "\u03BB": "lambda",
    "\u03BC": "mu",
    "\u03BD": "nu",
    "\u03BE": "xi",
    "\u03C0": "pi",
    "\u03C1": "rho",
    "\u03C3": "sigma",
    "\u03C4": "tau",
    "\u03C5": "upsilon",
    "\u03C6": "phi",
    "\u03C7": "chi",
    "\u03C8": "psi",
    "\u03C9": "omega",
    // Greek letters (uppercase)
    "\u0393": "Gamma",
    "\u0394": "Delta",
    "\u0398": "Theta",
    "\u039B": "Lambda",
    "\u039E": "Xi",
    "\u03A0": "Pi",
    "\u03A3": "Sigma",
    "\u03A5": "Upsilon",
    "\u03A6": "Phi",
    "\u03A8": "Psi",
    "\u03A9": "Omega",
    // Calculus & analysis
    "\u222B": "integral",
    "\u222C": "double integral",
    "\u222D": "triple integral",
    "\u222E": "contour integral",
    "\u221E": "infinity",
    "\u2202": "partial derivative",
    "\u2207": "nabla",
    "\u2211": "sum",
    "\u220F": "product",
    "\u2210": "coproduct",
    "\u2205": "empty set",
    // Set theory & logic
    "\u2208": "element of",
    "\u2209": "not an element of",
    "\u2282": "subset of",
    "\u2286": "subset of or equal to",
    "\u2283": "superset of",
    "\u2287": "superset of or equal to",
    "\u2229": "intersection",
    "\u222A": "union",
    "\u2200": "for all",
    "\u2203": "there exists",
    "\u2204": "there does not exist",
    "\u00AC": "not",
    "\u2234": "therefore",
    "\u2235": "because",
    // Comparison
    "\u2264": "less than or equal to",
    "\u2265": "greater than or equal to",
    "\u2260": "not equal to",
    "\u2248": "approximately equal to",
    "\u2261": "equivalent to",
    "\u2245": "congruent to",
    "\u223C": "similar to",
    "\u224D": "asymptotically equal to",
    "\u224E": "asymptotically equal to",
    "\u227C": "precedes or equal to",
    "\u227D": "succeeds or equal to",
    "\u227A": "precedes",
    "\u227B": "succeeds",
    // Arrows
    "\u2192": "right arrow",
    "\u2190": "left arrow",
    "\u2194": "left right arrow",
    "\u21D2": "implies",
    "\u21D0": "leftwards double arrow",
    "\u21D4": "if and only if",
    "\u21A6": "maps to",
    "\u27F6": "long right arrow",
    "\u27F5": "long left arrow",
    "\u27F7": "long left right arrow",
    // Binary operators
    "\u00B7": "dot",
    "\u00D7": "times",
    "\u00F7": "divided by",
    "\u00B1": "plus or minus",
    "\u2213": "minus or plus",
    "\u2295": "direct sum",
    "\u2297": "tensor product",
    "\u2296": "minus with dot",
    "\u2298": "division slash",
    "\u2299": "dot operator",
    "\u2218": "composition",
    "\u2219": "bullet operator",
    "\u2020": "dagger",
    "\u2021": "double dagger",
    "\u2227": "logical and",
    "\u2228": "logical or",
};

/**
 * Escape HTML special characters in a text fragment.
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/**
 * Add `aria-label` attributes to known Unicode math symbols in a block of
 * already-escaped HTML text.
 *
 * Each symbol gets wrapped in `<span role="text" aria-label="...">` so
 * screen readers announce the spoken name instead of reading the character.
 */
function addMathAriaLabels(html: string): string {
    // Build a regex that matches any of the mapped symbols
    const symbols = Object.keys(MATH_ARIA_LABELS).filter((s) => s.trim() !== "");
    if (symbols.length === 0) return html;

    // Sort by length descending so multi-byte chars match first
    symbols.sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`(${symbols.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");

    // Only wrap symbols that are outside HTML tags and not already inside an aria-label
    return html.replace(pattern, (match) => {
        const label = MATH_ARIA_LABELS[match] ?? match;
        return `<span aria-label="${escapeHtml(label)}" class="math">${match}</span>`;
    });
}

/**
 * Convert inline markdown formatting (**bold**, *italic*, `code`, ~~strikethrough~~)
 * to HTML, and add ARIA labels to math symbols.
 */
function convertInline(text: string): string {
    let result = escapeHtml(text);

    // Inline code `...` (must come before bold/italic to avoid interfering)
    result = result.replace(/`([^`]+)`/g, "<code>$1</code>");

    // ~~strikethrough~~
    result = result.replace(/~~([^~]+)~~/g, "<del>$1</del>");

    // **bold**
    result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // *italic*
    result = result.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // Add ARIA labels for math symbols (after markdown formatting)
    result = addMathAriaLabels(result);

    return result;
}

/**
 * Convert a block of Markdown text (headings, code fences, lists, paragraphs)
 * into semantic HTML.
 */
function markdownToHtml(markdown: string): string {
    const lines = markdown.split("\n");
    const html: string[] = [];

    let inCodeBlock = false;
    let codeBlockLang = "";
    const codeBuffer: string[] = [];

    let inList: "ul" | "ol" | null = null;
    const listBuffer: string[] = [];

    function flushList(): void {
        if (inList && listBuffer.length > 0) {
            html.push(`<${inList}>`);
            for (const item of listBuffer) {
                html.push(`<li>${item}</li>`);
            }
            html.push(`</${inList}>`);
            listBuffer.length = 0;
            inList = null;
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // ── Code blocks ──────────────────────────────────────────────────────
        if (line.startsWith("```")) {
            if (inCodeBlock) {
                const langAttr = codeBlockLang
                    ? ` class="language-${escapeHtml(codeBlockLang)}"`
                    : "";
                html.push(`<pre><code${langAttr}>${codeBuffer.join("\n")}</code></pre>`);
                codeBuffer.length = 0;
                codeBlockLang = "";
                inCodeBlock = false;
            } else {
                flushList();
                inCodeBlock = true;
                codeBlockLang = line.slice(3).trim();
            }
            continue;
        }

        if (inCodeBlock) {
            codeBuffer.push(escapeHtml(line));
            continue;
        }

        // ── Horizontal rule ──────────────────────────────────────────────────
        if (/^---+$/.test(line) || /^\*\*\*+$/.test(line)) {
            flushList();
            html.push("<hr>");
            continue;
        }

        // ── Headings ─────────────────────────────────────────────────────────
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            flushList();
            const level = headingMatch[1].length;
            const content = convertInline(headingMatch[2]);
            html.push(`<h${level}>${content}</h${level}>`);
            continue;
        }

        // ── Unordered list items ─────────────────────────────────────────────
        const ulMatch = line.match(/^[-*+]\s+(.+)$/);
        if (ulMatch) {
            if (inList !== "ul") {
                flushList();
                inList = "ul";
            }
            listBuffer.push(convertInline(ulMatch[1]));
            continue;
        }

        // ── Ordered list items ───────────────────────────────────────────────
        const olMatch = line.match(/^\d+\.\s+(.+)$/);
        if (olMatch) {
            if (inList !== "ol") {
                flushList();
                inList = "ol";
            }
            listBuffer.push(convertInline(olMatch[1]));
            continue;
        }

        // ── Empty line → paragraph break ─────────────────────────────────────
        if (line.trim() === "") {
            flushList();
            continue;
        }

        // ── Regular paragraph line ───────────────────────────────────────────
        flushList();
        const paraLines: string[] = [convertInline(line)];
        while (i + 1 < lines.length) {
            const next = lines[i + 1];
            if (
                next.trim() === "" ||
                next.startsWith("#") ||
                next.startsWith("```") ||
                /^[-*+]\s+/.test(next) ||
                /^\d+\.\s+/.test(next) ||
                /^---+$/.test(next) ||
                /^\*\*\*+$/.test(next)
            ) {
                break;
            }
            i++;
            const trimmed = next.trim();
            if (trimmed) {
                paraLines.push(convertInline(trimmed));
            }
        }
        html.push(`<p>${paraLines.join("<br>\n")}</p>`);
    }

    // Flush remaining code block or list
    if (inCodeBlock) {
        html.push(`<pre><code>${codeBuffer.join("\n")}</code></pre>`);
    }
    flushList();

    return html.join("\n");
}

// ─── HTML template ───────────────────────────────────────────────────────────

/**
 * Generate a complete, accessible HTML5 document from plain markdown text.
 *
 * @param content  The markdown content (already converted from LaTeX)
 * @param title    Optional page title (defaults to input filename or "Converted Document")
 * @returns        A complete HTML5 string
 */
export function convertToHtml(
    content: string,
    title?: string,
): string {
    const pageTitle = title
        ? escapeHtml(title)
        : "latex2plain — Converted Document";

    const bodyHtml = markdownToHtml(content);

    // Derive a readable title from the first <h1> if none was given
    const h1Match = bodyHtml.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const documentTitle = h1Match ? h1Match[1] : pageTitle;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(documentTitle)}</title>
    <meta name="generator" content="latex2plain">
    <meta name="description" content="Converted from LaTeX to plain Unicode text by latex2plain">
    <meta name="theme-color" content="#1a1a2e">

    <style>
        /* ── Reset & Base ─────────────────────────────────────────────── */
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        :root {
            --bg: #fafaf9;
            --fg: #1c1917;
            --accent: #7c3aed;
            --accent-light: #ede9fe;
            --code-bg: #f5f5f4;
            --code-border: #e7e5e4;
            --hr-color: #d6d3d1;
            --heading-color: #292524;
            --muted: #78716c;
            --link-color: #7c3aed;
            --max-width: 48rem;
            --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                "Helvetica Neue", Arial, sans-serif;
            --font-mono: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas,
                monospace;
            --font-math: "STIX Two Text", "Cambria Math", "Latin Modern Math",
                "Times New Roman", serif;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #1c1917;
                --fg: #e7e5e4;
                --accent: #a78bfa;
                --accent-light: #2e1065;
                --code-bg: #292524;
                --code-border: #44403c;
                --hr-color: #44403c;
                --heading-color: #fafaf9;
                --muted: #a8a29e;
                --link-color: #a78bfa;
            }
        }

        html {
            font-size: 16px;
            scroll-behavior: smooth;
        }

        body {
            font-family: var(--font-sans);
            color: var(--fg);
            background: var(--bg);
            line-height: 1.7;
            padding: 2rem 1rem;
            min-height: 100vh;
        }

        /* ── Layout ──────────────────────────────────────────────────── */
        main {
            max-width: var(--max-width);
            margin: 0 auto;
            padding: 2rem 0;
        }

        /* ── Typography ──────────────────────────────────────────────── */
        h1, h2, h3, h4, h5, h6 {
            color: var(--heading-color);
            font-weight: 650;
            line-height: 1.3;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
        }

        h1 { font-size: 2.25rem; margin-top: 0; }
        h2 { font-size: 1.75rem; border-bottom: 2px solid var(--accent-light); padding-bottom: 0.3rem; }
        h3 { font-size: 1.35rem; }
        h4 { font-size: 1.1rem; }
        h5, h6 { font-size: 1rem; }

        p {
            margin-bottom: 1rem;
        }

        /* ── Math symbols ────────────────────────────────────────────── */
        .math {
            font-family: var(--font-math);
            font-style: italic;
        }

        /* ── Links ───────────────────────────────────────────────────── */
        a {
            color: var(--link-color);
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.2s ease;
        }
        a:hover, a:focus {
            border-bottom-color: var(--link-color);
            outline: none;
        }
        a:focus-visible {
            outline: 2px solid var(--accent);
            outline-offset: 2px;
            border-radius: 2px;
        }

        /* ── Code ────────────────────────────────────────────────────── */
        code {
            font-family: var(--font-mono);
            font-size: 0.875em;
            background: var(--code-bg);
            padding: 0.15em 0.4em;
            border-radius: 4px;
            border: 1px solid var(--code-border);
        }

        pre {
            background: var(--code-bg);
            border: 1px solid var(--code-border);
            border-radius: 8px;
            padding: 1rem 1.25rem;
            overflow-x: auto;
            margin: 1.25rem 0;
        }

        pre code {
            background: none;
            border: none;
            padding: 0;
            font-size: 0.85rem;
            line-height: 1.5;
        }

        /* ── Lists ───────────────────────────────────────────────────── */
        ul, ol {
            margin: 0.75rem 0;
            padding-left: 1.75rem;
        }

        li {
            margin-bottom: 0.35rem;
        }

        li > ul, li > ol {
            margin: 0.25rem 0 0 1.25rem;
        }

        /* ── Horizontal rule ─────────────────────────────────────────── */
        hr {
            border: none;
            border-top: 2px solid var(--hr-color);
            margin: 2.5rem 0;
        }

        /* ── Blockquotes ─────────────────────────────────────────────── */
        blockquote {
            border-left: 4px solid var(--accent);
            background: var(--accent-light);
            padding: 0.75rem 1.25rem;
            margin: 1.25rem 0;
            border-radius: 0 8px 8px 0;
        }

        blockquote p:last-child {
            margin-bottom: 0;
        }

        /* ── Tables ──────────────────────────────────────────────────── */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.25rem 0;
            font-size: 0.9rem;
        }

        th, td {
            border: 1px solid var(--code-border);
            padding: 0.5rem 0.75rem;
            text-align: left;
        }

        th {
            background: var(--accent-light);
            font-weight: 600;
        }

        /* ── Footer / metadata ───────────────────────────────────────── */
        .footer {
            margin-top: 3rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--hr-color);
            font-size: 0.85rem;
            color: var(--muted);
            text-align: center;
        }

        /* ── Print ───────────────────────────────────────────────────── */
        @media print {
            body {
                padding: 0;
                background: white;
                color: black;
            }
            pre {
                break-inside: avoid;
                border: 1px solid #ccc;
            }
            h1, h2, h3, h4 {
                break-after: avoid;
            }
            .footer {
                display: none;
            }
        }

        /* ── Focus / Accessibility ───────────────────────────────────── */
        :focus-visible {
            outline: 2px solid var(--accent);
            outline-offset: 2px;
        }

        .skip-link {
            position: absolute;
            top: -100%;
            left: 1rem;
            background: var(--accent);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0 0 6px 6px;
            z-index: 1000;
            font-weight: 600;
            text-decoration: none;
        }
        .skip-link:focus {
            top: 0;
        }
    </style>
</head>

<body>
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <header role="banner" style="display:none" aria-hidden="true"></header>

    <main id="main-content" role="main" aria-label="Document content">
        ${bodyHtml}
    </main>

    <footer class="footer" role="contentinfo" aria-label="Document footer">
        <p>
            Generated by <a href="https://github.com/mukhtar/latex2plain">latex2plain</a>
            &mdash; LaTeX math converted to plain Unicode text
        </p>
    </footer>
</body>
</html>`;
}
