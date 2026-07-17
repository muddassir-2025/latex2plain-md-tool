import { extractBraced } from "./utils.js";

/**
 * Strip \[ ... \] display math delimiters.
 */
export function stripDisplayMath(text: string): string {
    return text.replace(/\\\[([\s\S]*?)\\\]/g, (_match, inner: string) => inner.trim());
}

/**
 * Strip \displaystyle, \textstyle, \scriptstyle, \scriptscriptstyle.
 */
export function stripStyleCommands(text: string): string {
    return text
        .replace(/\\displaystyle\s*/g, "")
        .replace(/\\textstyle\s*/g, "")
        .replace(/\\scriptstyle\s*/g, "")
        .replace(/\\scriptscriptstyle\s*/g, "");
}

/**
 * Strip invisible delimiters \left. and \right.
 */
export function stripInvisibleDelimiters(text: string): string {
    return text.replace(/\\left\.\s*/g, "").replace(/\\right\.\s*/g, "");
}

/**
 * Strip font commands.
 */
export function stripFontCommands(text: string): string {
    const fontCmds = [
        "\\\\mathrm",
        "\\\\mathbf",
        "\\\\mathit",
        "\\\\mathsf",
        "\\\\mathtt",
        "\\\\mathnormal",
        "\\\\mathcal",
        "\\\\operatorname",
    ];
    for (const cmd of fontCmds) {
        text = stripBraceCommand(text, new RegExp(cmd));
    }
    return text;
}

/**
 * Strip \color{...}{...} and \textcolor{...}{...}.
 */
export function stripColorCommands(text: string): string {
    text = stripColorCommand(text);
    text = stripColorTextCommand(text);
    return text;
}

/**
 * Strip \cancel{...} and \cancelto{...}{...}.
 * \cancel{x} → x
 * \cancelto{0}{x} → 0  (keep the "to" value / destination)
 */
export function stripCancelCommands(text: string): string {
    text = stripCancelTo(text);
    text = stripBraceCommand(text, /\\cancel/);
    return text;
}

/**
 * Strip \sout{...}
 */
export function stripSout(text: string): string {
    return stripBraceCommand(text, /\\sout/);
}

/**
 * Strip \underline{...}, \overline{...}
 */
export function stripUnderlineOverline(text: string): string {
    text = stripBraceCommand(text, /\\underline/);
    text = stripBraceCommand(text, /\\overline/);
    return text;
}

/**
 * Strip \underbrace{...} and \overbrace{...}
 */
export function stripOverUnderBraces(text: string): string {
    text = stripBraceCommand(text, /\\underbrace/);
    text = stripBraceCommand(text, /\\overbrace/);
    return text;
}

/**
 * Strip \phantom{...}, \hphantom{...}, \vphantom{...}
 */
export function stripPhantomCommands(text: string): string {
    text = stripBraceCommand(text, /\\phantom/);
    text = stripBraceCommand(text, /\\hphantom/);
    text = stripBraceCommand(text, /\\vphantom/);
    return text;
}

/**
 * Strip accent commands: \vec{}, \hat{}, \bar{}, \tilde{},
 * \dot{}, \ddot{}, \check{}, \breve{}, \acute{}, \grave{}.
 */
export function stripAccents(text: string): string {
    const accentCmds = [
        /\\vec/g,
        /\\hat/g,
        /\\bar/g,
        /\\tilde/g,
        /\\dot/g,
        /\\ddot/g,
        /\\check/g,
        /\\breve/g,
        /\\acute/g,
        /\\grave/g,
    ];
    for (const pattern of accentCmds) {
        text = stripBraceCommand(text, pattern);
    }
    return text;
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

/**
 * Strip \cmd{content} → content, handling nested braces.
 */
function stripBraceCommand(text: string, cmd: RegExp): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
        cmd.lastIndex = 0;
        const match = cmd.exec(text.slice(i));
        if (!match) {
            result += text.slice(i);
            break;
        }

        const matchIdx = i + match.index;
        result += text.slice(i, matchIdx);
        let pos = matchIdx + match[0].length;

        while (pos < text.length && text[pos] === " ") pos++;

        if (pos < text.length && text[pos] === "{") {
            const [inner, afterClose] = extractBraced(text, pos);
            result += inner;
            i = afterClose;
        } else {
            result += match[0];
            i = pos;
        }
    }

    return result;
}

/**
 * Strip \color{...}{content} → content.
 */
function stripColorCommand(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
        const matchIdx = text.indexOf("\\color", i);
        if (matchIdx === -1) {
            result += text.slice(i);
            break;
        }

        result += text.slice(i, matchIdx);
        let pos = matchIdx + 6;

        while (pos < text.length && text[pos] === " ") pos++;

        if (pos < text.length && text[pos] === "{") {
            const [, afterColor] = extractBraced(text, pos);
            let after = afterColor;
            while (after < text.length && text[after] === " ") after++;

            if (after < text.length && text[after] === "{") {
                const [inner, afterClose] = extractBraced(text, after);
                result += inner;
                i = afterClose;
            } else {
                i = afterColor;
            }
        } else {
            result += "\\color";
            i = pos;
        }
    }

    return result;
}

/**
 * Strip \textcolor{red}{content} → content.
 */
function stripColorTextCommand(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
        const matchIdx = text.indexOf("\\textcolor", i);
        if (matchIdx === -1) {
            result += text.slice(i);
            break;
        }

        result += text.slice(i, matchIdx);
        let pos = matchIdx + 10;

        while (pos < text.length && text[pos] === " ") pos++;

        if (pos < text.length && text[pos] === "{") {
            const [, afterColor] = extractBraced(text, pos);
            let after = afterColor;
            while (after < text.length && text[after] === " ") after++;

            if (after < text.length && text[after] === "{") {
                const [inner, afterClose] = extractBraced(text, after);
                result += inner;
                i = afterClose;
            } else {
                i = afterColor;
            }
        } else {
            result += "\\textcolor";
            i = pos;
        }
    }

    return result;
}

/**
 * Strip \cancelto{to}{content}.
 * \cancelto{0}{x} → 0  (keep the "to" value, discard the canceled expression)
 */
function stripCancelTo(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
        const matchIdx = text.indexOf("\\cancelto", i);
        if (matchIdx === -1) {
            result += text.slice(i);
            break;
        }

        result += text.slice(i, matchIdx);
        let pos = matchIdx + 9;

        while (pos < text.length && text[pos] === " ") pos++;

        if (pos < text.length && text[pos] === "{") {
            // First brace: the "to" value (destination) — KEEP this
            const [toValue, afterTo] = extractBraced(text, pos);

            // Second brace: the canceled expression — DISCARD this
            let after = afterTo;
            while (after < text.length && text[after] === " ") after++;

            if (after < text.length && text[after] === "{") {
                const [, afterClose] = extractBraced(text, after);
                result += toValue;
                i = afterClose;
            } else {
                // No second brace — keep the "to" value
                result += toValue;
                i = afterTo;
            }
        } else {
            result += "\\cancelto";
            i = pos;
        }
    }

    return result;
}
