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
 * Strip font commands: \mathrm, \mathbf, \mathit, \mathsf, \mathtt,
 * \mathnormal, \mathcal, \operatorname, \boldsymbol, \textbf,
 * \textit, \textrm, \emph.
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
        "\\\\boldsymbol",
        "\\\\textbf",
        "\\\\textit",
        "\\\\textrm",
        "\\\\emph",
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
 * Strip \boxed{...}, \fbox{...}
 */
export function stripBoxes(text: string): string {
    text = stripBraceCommand(text, /\\boxed/);
    text = stripBraceCommand(text, /\\fbox/);
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
 * Strip accents: \vec{}, \hat{}, \bar{}, \tilde{},
 * \dot{}, \ddot{}, \check{}, \breve{}, \acute{}, \grave{},
 * \widehat{}, \widetilde{}.
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
        /\\widehat/g,
        /\\widetilde/g,
    ];
    for (const pattern of accentCmds) {
        text = stripBraceCommand(text, pattern);
    }
    return text;
}

/**
 * Strip extensible arrows: \xrightarrow{text} → text, \xleftarrow{text} → text,
 * \overrightarrow{text} → text, \overleftarrow{text} → text.
 */
export function stripExtensibleArrows(text: string): string {
    text = stripBraceCommand(text, /\\xrightarrow/);
    text = stripBraceCommand(text, /\\xleftarrow/);
    text = stripBraceCommand(text, /\\overrightarrow/);
    text = stripBraceCommand(text, /\\overleftarrow/);
    text = stripBraceCommand(text, /\\underrightarrow/);
    text = stripBraceCommand(text, /\\underleftarrow/);
    return text;
}

/**
 * Strip font size commands: \tiny, \small, \normalsize, \large, \Large,
 * \LARGE, \huge, \Huge → content.
 */
export function stripFontSizeCommands(text: string): string {
    const sizeCmds = [
        /\\tiny/g,
        /\\small/g,
        /\\normalsize/g,
        /\\large/g,
        /\\Large/g,
        /\\LARGE/g,
        /\\huge/g,
        /\\Huge/g,
    ];
    for (const pattern of sizeCmds) {
        text = stripBraceCommand(text, pattern);
    }
    return text;
}

/**
 * Strip \cfrac[l|c|r]{num}{den} → num/den.
 * \cfrac is used for continued fractions; we keep both parts
 * separated by a slash for readability.
 */
export function stripContinuedFraction(text: string): string {
    let result = "";
    let i = 0;

    while (i < text.length) {
        const matchIdx = text.indexOf("\\cfrac", i);
        if (matchIdx === -1) {
            result += text.slice(i);
            break;
        }

        result += text.slice(i, matchIdx);
        let pos = matchIdx + 6;

        // Skip whitespace
        while (pos < text.length && text[pos] === " ") pos++;

        // Skip optional [l|c|r]
        if (pos < text.length && text[pos] === "[") {
            pos++;
            while (pos < text.length && text[pos] !== "]") pos++;
            if (pos < text.length) pos++;
        }

        // Skip whitespace
        while (pos < text.length && text[pos] === " ") pos++;

        // Extract numerator
        if (pos < text.length && text[pos] === "{") {
            const [num, afterNum] = extractBraced(text, pos) ?? ["", pos + 1];
            let after = afterNum;

            // Skip whitespace
            while (after < text.length && text[after] === " ") after++;

            // Extract denominator
            if (after < text.length && text[after] === "{") {
                const [den, afterClose] = extractBraced(text, after) ?? ["", after + 1];
                result += `${num}/${den}`;
                i = afterClose;
            } else {
                result += num;
                i = after;
            }
        } else {
            result += "\\cfrac";
            i = pos;
        }
    }

    return result;
}

/**
 * Strip \substack{content} → content.
 * Used in subscripts/superscripts for stacked indices.
 */
export function stripSubstack(text: string): string {
    return stripBraceCommand(text, /\\substack/);
}

/**
 * Strip \overset{top}{base} and \underset{bottom}{base} → base.
 * These are stack/underset commands; we keep only the base/content.
 */
export function stripOverUnderSet(text: string): string {
    text = stripTwoArgBraceCommand(text, /\\overset/);
    text = stripTwoArgBraceCommand(text, /\\underset/);
    text = stripTwoArgBraceCommand(text, /\\stackrel/);
    return text;
}

/**
 * Strip \limits and \nolimits (simple removal).
 */
export function stripLimitsCommands(text: string): string {
    return text.replace(/\\limits\s*/g, "").replace(/\\nolimits\s*/g, "");
}

/**
 * Strip math atom commands: \mathop{...}, \mathrel{...}, \mathbin{...},
 * \mathord{...}, \mathinner{...} → content.
 */
export function stripMathAtoms(text: string): string {
    const atoms = [
        /\\mathop/g,
        /\\mathrel/g,
        /\\mathbin/g,
        /\\mathord/g,
        /\\mathinner/g,
    ];
    for (const pattern of atoms) {
        text = stripArgsKeepLast(text, pattern);
    }
    return text;
}

/**
 * Strip \smash[opt]{content} and \mathclap, \mathrlap, \mathllap, \mathmbox.
 * All of these keep only their last braced argument.
 */
export function stripSmashAndClaps(text: string): string {
    const cmds = [
        /\\smash/g,
        /\\mathclap/g,
        /\\mathrlap/g,
        /\\mathllap/g,
        /\\mathmbox/g,
    ];
    for (const pattern of cmds) {
        text = stripArgsKeepLast(text, pattern);
    }
    return text;
}

/**
 * Strip \raisebox{lift}[ht][dp]{content} and \scalebox{factor}{content} → content.
 * Both keep only the last mandatory braced argument.
 */
export function stripRaiseAndScale(text: string): string {
    text = stripArgsKeepLast(text, /\\raisebox/g);
    text = stripArgsKeepLast(text, /\\scalebox/g);
    text = stripArgsKeepLast(text, /\\resizebox/g);
    text = stripArgsKeepLast(text, /\\rotatebox/g);
    return text;
}

/**
 * Strip \sideset{left}{right}{symbol} → symbol.
 * Three-argument command; we keep only the last (the symbol).
 */
export function stripSideSet(text: string): string {
    return stripArgsKeepLast(text, /\\sideset/g);
}

/**
 * Strip \prescript{top}{bottom}{symbol} → symbol.
 * Three-argument command; we keep only the last (the symbol).
 */
export function stripPreScript(text: string): string {
    return stripArgsKeepLast(text, /\\prescript/g);
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

/**
 * Strip \cmd{top}{base} → base, handling nested braces.
 */
function stripTwoArgBraceCommand(text: string, cmd: RegExp): string {
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

        // Skip whitespace
        while (pos < text.length && text[pos] === " ") pos++;

        // Extract first arg (top/bottom stack item)
        if (pos < text.length && text[pos] === "{") {
            const [, afterFirst] = extractBraced(text, pos);
            let after = afterFirst;

            // Skip whitespace
            while (after < text.length && text[after] === " ") after++;

            // Extract second arg (base — this is what we keep)
            if (after < text.length && text[after] === "{") {
                const [base, afterClose] = extractBraced(text, after);
                result += base;
                i = afterClose;
            } else {
                i = after;
            }
        } else {
            result += match[0];
            i = pos;
        }
    }

    return result;
}

/**
 * Strip \cmd{...}{...}{...} → last mandatory arg, handling nested braces.
 * Skips optional [args] and keeps only the last {braced} argument.
 * This one helper handles 1-arg, 2-arg, and 3-arg commands with optional brackets.
 */
function stripArgsKeepLast(text: string, cmd: RegExp): string {
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

        // Skip whitespace
        while (pos < text.length && (text[pos] === " " || text[pos] === "\t")) pos++;

        // Collect all args, keeping last mandatory braced one
        let lastBraced: string | null = null;
        let hadArg = false;

        while (pos < text.length) {
            // Skip whitespace
            while (pos < text.length && (text[pos] === " " || text[pos] === "\t")) pos++;
            if (pos >= text.length) break;

            if (text[pos] === "[") {
                // Optional arg — skip it
                let depth = 1;
                pos++;
                while (pos < text.length && depth > 0) {
                    if (text[pos] === "[") depth++;
                    else if (text[pos] === "]") depth--;
                    pos++;
                }
                hadArg = true;
            } else if (text[pos] === "{") {
                // Mandatory arg — track as last seen
                const [inner, afterClose] = extractBraced(text, pos);
                lastBraced = inner;
                pos = afterClose;
                hadArg = true;
            } else {
                break; // not an arg character
            }
        }

        if (hadArg && lastBraced !== null) {
            result += lastBraced;
            i = pos;
        } else {
            result += match[0];
            i = pos;
        }
    }

    return result;
}

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
 * \cancelto{0}{x} → 0  (keep the "to" value)
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
            const [toValue, afterTo] = extractBraced(text, pos);

            let after = afterTo;
            while (after < text.length && text[after] === " ") after++;

            if (after < text.length && text[after] === "{") {
                const [, afterClose] = extractBraced(text, after);
                result += toValue;
                i = afterClose;
            } else {
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
