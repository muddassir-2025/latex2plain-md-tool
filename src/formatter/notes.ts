/**
 * Smart Format v2 — deterministic, dependency-free note-to-Markdown formatter.
 *
 * No AI / network calls, same as v1. The structural difference from v1 is that
 * several passes now look at more than one line before deciding anything —
 * a document-level pre-scan for dialogue, a run of consecutive lines for
 * derivations/tables, a look at the *next* line before promoting a heading —
 * instead of judging each line in total isolation. That's what fixes most of
 * the false positives/negatives called out against v1 (see README.md).
 */

// ── Types ───────────────────────────────────────────────────────────────

export interface SmartFormatOptions {
  /** Prepend a Table of Contents built from detected headings. Off by default: it's the one feature that adds content not present in the source. */
  generateTOC?: boolean;
  /** Mark genuinely ambiguous heading/table calls with an inline `<!-- verify: ... -->` comment instead of silently guessing. Off by default. */
  flagUncertain?: boolean;
  /** Rejoin words split across a line break by a trailing hyphen (common in OCR/scanned text). Off by default — risky against real hyphenated compounds. */
  fixOcrArtifacts?: boolean;
}

interface Doc {
  lines: string[];
}

export interface HeadingInfo {
  level: number;
  text: string;
  lineIndex: number;
}

const DEFAULT_OPTIONS: Required<SmartFormatOptions> = {
  generateTOC: false,
  flagUncertain: false,
  fixOcrArtifacts: false,
};

// ── Entry point ─────────────────────────────────────────────────────────

export function smartFormat(rawText: string, options: SmartFormatOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let doc: Doc = { lines: rawText.replace(/\r\n/g, '\n').split('\n') };

  doc = pass1_blocks(doc);
  doc = pass2_callouts(doc);
  doc = pass3_math(doc);
  const headingResult = pass4_headings(doc, opts.flagUncertain);
  doc = headingResult.doc;
  const headings = headingResult.headings;
  doc = pass5_lists(doc);
  doc = pass6_tables(doc, opts.flagUncertain);
  doc = pass7_tasksAndDialogue(doc);
  doc = pass8_links(doc);
  doc = pass9_cleanup(doc, opts.fixOcrArtifacts);

  let output = doc.lines.join('\n');
  if (opts.generateTOC && headings.length > 0) {
    output = buildTOC(headings) + '\n\n' + output;
  }
  return output;
}

// ── Shared helpers ──────────────────────────────────────────────────────

function isBlank(line: string): boolean {
  return /^\s*$/.test(line);
}

function isListMarker(line: string): boolean {
  return /^\s*([-*+]|\d+[.)])\s+/.test(line);
}

/** True for every line sitting inside a fenced ``` code block — every later pass must leave these untouched. Recomputed fresh at the start of each pass since earlier passes may have inserted/removed lines. */
function computeProtectedMask(lines: string[]): boolean[] {
  const mask = new Array(lines.length).fill(false);
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) {
      mask[i] = true;
      inFence = !inFence;
      continue;
    }
    mask[i] = inFence;
  }
  return mask;
}

function looksLikeHeadingMarker(line: string): boolean {
  return (
    /^\s*(chapter|lecture|section|unit|part|capítulo|capitulo|kapitel|chapitre|capitolo|seção|secao|lección|leccion|leçon|lecon)\s+\d/i.test(
      line
    ) || /^#{1,6}\s/.test(line)
  );
}

// ── Pass 1 — Blocks (code) ──────────────────────────────────────────────

const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  python: [/^\s*(def |class |import |from \S+ import|elif |except\b|@\w+|self\.)/],
  typescript: [/^\s*(interface |type \w+\s*=|export (default )?(function|const|class|interface|type))/, /:\s*\w+(\[\])?\s*[=;,)]/],
  javascript: [/^\s*(function\s|const\s|let\s|var\s|=>|console\.log|module\.exports|require\()/],
  java: [/^\s*(public |private |protected )?(static )?(class |void |interface )/, /System\.out\./],
  cpp: [/#include\s*<.*>/, /std::/, /cout\s*<</, /cin\s*>>/, /^\s*int main\s*\(/],
  c: [/#include\s*"/, /\bprintf\(/, /\bscanf\(/, /\bmalloc\(/],
  go: [/^\s*(func |package |import \()/, /fmt\./],
  rust: [/^\s*(fn |let mut |use std|impl )/, /println!/],
  ruby: [/^\s*(def |end\s*$|require |puts )/],
  sql: [/^\s*(SELECT|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE)\b/i],
  bash: [/^\s*#!\/bin\/(ba)?sh/, /^\s*(echo |sudo |cd |grep |npm |pip |git )/],
  html: [/<\/?[a-zA-Z][^>]*>/],
  css: [/^\s*[.#]?[\w-]+\s*\{/, /:\s*[\w#-]+;\s*$/],
  json: [/^\s*[{[]/, /^\s*"[^"]+"\s*:/],
};

function looksLikeCodeLine(line: string): boolean {
  if (isBlank(line)) return false;
  for (const patterns of Object.values(LANGUAGE_PATTERNS)) {
    if (patterns.some((p) => p.test(line))) return true;
  }
  if (/[;{]\s*$/.test(line)) return true;
  return false;
}

function isIndentedCodeCandidate(line: string): boolean {
  return /^(\t| {4,})\S/.test(line);
}

function guessLanguage(blockLines: string[]): string {
  const scores: Record<string, number> = {};
  for (const lang of Object.keys(LANGUAGE_PATTERNS)) scores[lang] = 0;
  for (const line of blockLines) {
    for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      for (const p of patterns) if (p.test(line)) scores[lang]++;
    }
  }
  let best = 'text';
  let bestScore = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = lang;
      bestScore = score;
    }
  }
  return best;
}

const INLINE_CODE_PATTERNS: RegExp[] = [
  /(?<!`)\b[a-zA-Z_][\w.]*\([^()\n]{0,60}\)(?!`)/g, // function/method calls
  /(?<!`)\b(?:\.{1,2}\/)?[\w-]+(?:\/[\w.-]+)+(?!`)/g, // file paths
  /(?<!`)\b[\w-]+\.(?:ts|tsx|js|jsx|py|rb|go|rs|java|cpp|cc|c|h|hpp|json|md|ya?ml|sql|sh|css|html|txt)\b(?!`)/g, // filenames
  /(?<!`)--[a-zA-Z][\w-]*(?!`)/g, // long flags
];

function wrapInlineCode(line: string): string {
  if (/^\s*```/.test(line) || /^\s*>/.test(line)) return line;
  let result = line;
  for (const pattern of INLINE_CODE_PATTERNS) {
    result = result.replace(pattern, (m) => '`' + m + '`');
  }
  return result;
}

function pass1_blocks(doc: Doc): Doc {
  const lines = doc.lines;
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push(line);
      i++;
      continue;
    }

    if (!/^\s*```/.test(line) && looksLikeCodeLine(line)) {
      const block: string[] = [];
      let j = i;
      while (j < lines.length && !isBlank(lines[j]) && !looksLikeHeadingMarker(lines[j])) {
        block.push(lines[j]);
        j++;
      }
      if (block.length >= 2) {
        const lang = guessLanguage(block);
        out.push('```' + lang, ...block, '```');
        i = j;
        continue;
      }
    }

    if (isIndentedCodeCandidate(line) && !isListMarker(line)) {
      const block: string[] = [];
      let j = i;
      while (j < lines.length && isIndentedCodeCandidate(lines[j]) && !isListMarker(lines[j])) {
        block.push(lines[j].replace(/^\t| {4}/, ''));
        j++;
      }
      if (block.length >= 2) {
        const lang = guessLanguage(block);
        out.push('```' + lang, ...block, '```');
        i = j;
        continue;
      }
    }

    out.push(wrapInlineCode(line));
    i++;
  }
  return { lines: out };
}

// ── Pass 2 — Callouts ───────────────────────────────────────────────────

type CalloutStyle = 'blockquote' | 'bold' | 'blockquote-title';

const EXPLICIT_CALLOUT_LABELS: { keyword: string; display: string; style: CalloutStyle }[] = [
  { keyword: 'note', display: 'Note', style: 'blockquote' },
  { keyword: 'important', display: 'Important', style: 'blockquote' },
  { keyword: 'warning', display: 'Warning', style: 'blockquote' },
  { keyword: 'caution', display: 'Caution', style: 'blockquote' },
  { keyword: 'hint', display: 'Hint', style: 'blockquote' },
  { keyword: 'tip', display: 'Tip', style: 'blockquote' },
  { keyword: 'definition', display: 'Definition', style: 'bold' },
  { keyword: 'def', display: 'Definition', style: 'bold' },
  { keyword: 'example', display: 'Example', style: 'bold' },
  { keyword: 'summary', display: 'Summary', style: 'blockquote' },
  { keyword: 'key', display: 'Key', style: 'blockquote' },
  { keyword: 'remember', display: 'Remember', style: 'blockquote' },
  { keyword: 'key concepts', display: 'Key Concepts', style: 'blockquote-title' },
];

const IMPLICIT_NOTE_PATTERNS: RegExp[] = [
  /^\s*keep in mind(?: that)?[,:]?\s+/i,
  /^\s*remember(?: that)?[,:]?\s+/i,
  /^\s*don'?t forget(?: that)?[,:]?\s+/i,
  /^\s*be careful(?: to| that)?[,:]?\s+/i,
  /^\s*watch out(?: for)?[,:]?\s+/i,
];
const IMPLICIT_IMPORTANT_PATTERNS: RegExp[] = [/^\s*the key (?:insight|takeaway|point|idea) is[,:]?\s+/i];

/** Pattern for `formula:` / `equation:` → display math $$...$$ */
const FORMULA_PATTERN = /^(formula|equation)[:\s]+(.+)/i;

function pass2_callouts(doc: Doc): Doc {
  const protectedMask = computeProtectedMask(doc.lines);
  const out: string[] = [];

  for (let i = 0; i < doc.lines.length; i++) {
    const line = doc.lines[i];
    if (protectedMask[i]) {
      out.push(line);
      continue;
    }

    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';
    const content = line.slice(indent.length);

    // Check formula/equation first (these produce display math, not callouts)
    const formMatch = content.match(FORMULA_PATTERN);
    if (formMatch) {
      out.push(`${indent}$$${formMatch[2].trim()}$$`);
      continue;
    }

    let handled = false;
    for (const { keyword, display, style } of EXPLICIT_CALLOUT_LABELS) {
      const re = new RegExp(`^${keyword}:\\s*`, 'i');
      if (re.test(content)) {
        const rest = content.replace(re, '');
        if (style === 'blockquote') out.push(`${indent}> **${display}:** ${rest}`);
        else if (style === 'bold') out.push(`${indent}**${display}:** ${rest}`);
        else out.push(`${indent}> **${display}**${rest ? ' ' + rest : ''}`);
        handled = true;
        break;
      }
    }
    if (handled) continue;

    let matchedImplicit = false;
    for (const re of IMPLICIT_NOTE_PATTERNS) {
      if (re.test(content)) {
        out.push(`${indent}> **Note:** ${content}`);
        matchedImplicit = true;
        break;
      }
    }
    if (!matchedImplicit) {
      for (const re of IMPLICIT_IMPORTANT_PATTERNS) {
        if (re.test(content)) {
          out.push(`${indent}> **Important:** ${content}`);
          matchedImplicit = true;
          break;
        }
      }
    }
    if (matchedImplicit) continue;

    out.push(line);
  }
  return { lines: out };
}

// ── Pass 3 — Math ───────────────────────────────────────────────────────

const MATH_COMMAND_PATTERN =
  /\\(frac|int|sum|lim|sqrt|sin|cos|tan|alpha|beta|gamma|theta|pi|infty|partial|nabla|cdot|times|leq|geq|neq|approx|rightarrow|Rightarrow|forall|exists|subset|cup|cap|binom|log|ln|exp)\b/;
const SUBSUP_PATTERN = /[A-Za-z0-9)\]]\^\{?-?\w+\}?|[A-Za-z0-9)\]]_\{?-?\w+\}?/;
const EQUATION_PATTERN = /[A-Za-z0-9)\]]\s*=\s*[^=]/;

function looksLikeMathLine(line: string): boolean {
  if (isBlank(line)) return false;
  if (/^\s*>/.test(line)) return false;
  if (/^#{1,6}\s/.test(line)) return false;
  if (/\$.*\$/.test(line)) return false;
  return (
    MATH_COMMAND_PATTERN.test(line) ||
    SUBSUP_PATTERN.test(line) ||
    (EQUATION_PATTERN.test(line) && /[+\-*/^_\\]/.test(line))
  );
}

function pass3_math(doc: Doc): Doc {
  const protectedMask = computeProtectedMask(doc.lines);
  const lines = doc.lines;
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    if (protectedMask[i]) {
      out.push(lines[i]);
      i++;
      continue;
    }
    const line = lines[i];

    const beginMatch = line.match(/\\begin\{(\w+\*?)\}/);
    if (beginMatch) {
      const env = beginMatch[1];
      const block: string[] = [line];
      let j = i + 1;
      const endRe = new RegExp(`\\\\end\\{${env}\\}`);
      while (j < lines.length && !endRe.test(lines[j])) {
        block.push(lines[j]);
        j++;
      }
      if (j < lines.length) {
        block.push(lines[j]);
        j++;
      }
      const alreadyWrapped = /^\s*\$\$/.test(block[0]) || /\$\$\s*$/.test(block[block.length - 1]);
      if (alreadyWrapped) out.push(...block);
      else out.push('$$', ...block, '$$');
      i = j;
      continue;
    }

    if (looksLikeMathLine(line)) {
      const block: string[] = [line];
      let j = i + 1;
      while (j < lines.length && !isBlank(lines[j]) && !protectedMask[j] && looksLikeMathLine(lines[j])) {
        block.push(lines[j]);
        j++;
      }
      if (block.length > 1) {
        out.push('$$', '\\begin{aligned}');
        for (let k = 0; k < block.length; k++) {
          const suffix = k < block.length - 1 ? ' \\\\' : '';
          out.push(block[k].trim() + suffix);
        }
        out.push('\\end{aligned}', '$$');
      } else {
        const single = block[0].trim();
        if (single.length > 20 && /=/.test(single)) out.push(`$$${single}$$`);
        else out.push(`$${single}$`);
      }
      i = j;
      continue;
    }

    out.push(line);
    i++;
  }
  return { lines: out };
}

// ── Pass 4 — Headings ───────────────────────────────────────────────────

const STOPWORDS = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'and', 'or', 'but', 'to', 'for', 'with', 'at', 'by', 'from', 'is', 'as', 'vs', 'via']);

const CHAPTER_MARKER =
  /^\s*(chapter|lecture|section|unit|part|capítulo|capitulo|kapitel|chapitre|capitolo|seção|secao|lección|leccion|leçon|lecon)\s+(\d+(?:\.\d+)*)\s*[:.\-]?\s*(.*)$/i;
const ACADEMIC_HEADINGS = new Set(['abstract', 'introduction', 'conclusion', 'references', 'methodology', 'overview', 'prerequisites', 'summary', 'background', 'discussion', 'results', 'appendix']);
const NUMBERED_PATTERN = /^\s*(\d+(?:\.\d+)*)\.?\s+(.+)$/;

function isTrueTitleCase(line: string): boolean {
  const trimmed = line.trim();
  const words = trimmed.split(/\s+/);
  if (words.length < 2 || words.length > 7) return false;
  if (trimmed.length > 55) return false;
  if (/[.,;:]$/.test(trimmed)) return false;
  let significant = 0;
  let capitalized = 0;
  for (const w of words) {
    const bare = w.replace(/[^\w'-]/g, '');
    if (!bare) continue;
    if (STOPWORDS.has(bare.toLowerCase())) continue;
    significant++;
    if (/^[A-Z]/.test(bare)) capitalized++;
  }
  return significant > 0 && capitalized === significant;
}

function pass4_headings(doc: Doc, flagUncertain: boolean): { doc: Doc; headings: HeadingInfo[] } {
  const protectedMask = computeProtectedMask(doc.lines);
  const lines = doc.lines;
  const out: string[] = [];
  const headings: HeadingInfo[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (protectedMask[i]) {
      out.push(lines[i]);
      continue;
    }
    const line = lines[i];
    const trimmed = line.trim();
    const prevBlank = i === 0 || isBlank(lines[i - 1]);

    const chMatch = trimmed.match(CHAPTER_MARKER);
    if (chMatch) {
      const depth = chMatch[2].split('.').length;
      const level = Math.min(depth, 6);
      const title = `${chMatch[1]} ${chMatch[2]}${chMatch[3] ? ': ' + chMatch[3] : ''}`;
      out.push(`${'#'.repeat(level)} ${title}`);
      headings.push({ level, text: title, lineIndex: out.length - 1 });
      continue;
    }

    const numMatch = trimmed.match(NUMBERED_PATTERN);
    if (numMatch && prevBlank) {
      const nextLineNum = i + 1 < lines.length ? lines[i + 1].trim() : '';
      if (!NUMBERED_PATTERN.test(nextLineNum)) {
        const depth = numMatch[1].split('.').length;
        const level = Math.min(1 + depth, 6);
        out.push(`${'#'.repeat(level)} ${numMatch[2]}`);
        headings.push({ level, text: numMatch[2], lineIndex: out.length - 1 });
        continue;
      }
    }

    if (prevBlank && ACADEMIC_HEADINGS.has(trimmed.toLowerCase().replace(/:$/, ''))) {
      const title = trimmed.replace(/:$/, '');
      out.push(`## ${title}`);
      headings.push({ level: 2, text: title, lineIndex: out.length - 1 });
      continue;
    }

    if (prevBlank && isTrueTitleCase(trimmed)) {
      out.push(`## ${trimmed}`);
      headings.push({ level: 2, text: trimmed, lineIndex: out.length - 1 });
      continue;
    }

    if (prevBlank && /^[A-Z][A-Za-z]{2,}$/.test(trimmed) && !STOPWORDS.has(trimmed.toLowerCase())) {
      out.push(`## ${trimmed}`);
      if (flagUncertain) out.push('<!-- verify: single-word heading, low confidence -->');
      headings.push({ level: 2, text: trimmed, lineIndex: out.length - (flagUncertain ? 2 : 1) });
      continue;
    }

    out.push(line);
  }

  let lastLevel: number | null = null;
  for (const h of headings) {
    if (lastLevel !== null && h.level > lastLevel + 1) h.level = lastLevel + 1;
    lastLevel = h.level;
    out[h.lineIndex] = `${'#'.repeat(h.level)} ${h.text}`;
  }

  return { doc: { lines: out }, headings };
}

// ── Pass 5 — Lists ──────────────────────────────────────────────────────

const COMMON_VERBS = new Set([
  'is', 'are', 'was', 'were', 'has', 'have', 'had', 'does', 'do', 'did', 'will', 'would', 'can', 'could', 'should', 'must',
  'said', 'means', 'represents', 'shows', 'includes', 'contains', 'provides', 'requires', 'allows', 'helps',
]);

function isLikelyTermDescription(term: string): boolean {
  const words = term.trim().split(/\s+/);
  if (words.length > 4) return false;
  if (term.trim().length > 30) return false;
  return !words.some((w) => COMMON_VERBS.has(w.toLowerCase()));
}

const TRANSITION_WORDS = /^(first|second|third|fourth|next|then|after that|finally|lastly)[,:]\s+/i;

function promoteImplicitNesting(lines: string[], protectedMask: boolean[]): string[] {
  const out: string[] = [];
  let lastListIndent: number | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (protectedMask[i]) {
      out.push(line);
      continue;
    }
    const listMatch = line.match(/^(\s*)([-*+]|\d+[.)])\s+/);
    if (listMatch) {
      lastListIndent = listMatch[1].length;
      out.push(line);
      continue;
    }
    if (isBlank(line)) {
      lastListIndent = null;
      out.push(line);
      continue;
    }
    if (lastListIndent !== null) {
      const indentMatch = line.match(/^(\s*)\S/);
      const indent = indentMatch ? indentMatch[1].length : 0;
      if (indent > lastListIndent && !/^\s*(```|>|#{1,6}\s)/.test(line)) {
        out.push(' '.repeat(indent) + '- ' + line.trim());
        continue;
      }
    }
    out.push(line);
  }
  return out;
}

function convertTransitionParagraphs(lines: string[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    if (TRANSITION_WORDS.test(lines[i])) {
      const block: string[] = [];
      let j = i;
      while (j < lines.length && !isBlank(lines[j]) && TRANSITION_WORDS.test(lines[j])) {
        block.push(lines[j].replace(TRANSITION_WORDS, ''));
        j++;
      }
      if (block.length >= 2) {
        block.forEach((item, idx) => out.push(`${idx + 1}. ${item}`));
        i = j;
        continue;
      }
    }
    out.push(lines[i]);
    i++;
  }
  return out;
}

function pass5_lists(doc: Doc): Doc {
  const protectedMask = computeProtectedMask(doc.lines);
  const nested = promoteImplicitNesting(doc.lines, protectedMask);

  const out: string[] = [];
  for (let i = 0; i < nested.length; i++) {
    const line = nested[i];
    if (protectedMask[i] || isBlank(line) || /^\s*([-*+]|\d+[.)])\s+/.test(line) || /^\s*>/.test(line) || /^#{1,6}\s/.test(line)) {
      out.push(line);
      continue;
    }
    const dashMatch = line.match(/^(\s*)([^\n—-]{1,40}?)\s+(?:—|-)\s+(.+)$/);
    if (dashMatch && isLikelyTermDescription(dashMatch[2])) {
      out.push(`${dashMatch[1]}- **${dashMatch[2].trim()}** — ${dashMatch[3]}`);
      continue;
    }
    out.push(line);
  }

  return { lines: convertTransitionParagraphs(out) };
}

// ── Pass 6 — Tables (new) ───────────────────────────────────────────────

const TABLE_HEADER_HINTS = new Set(['name', 'role', 'status', 'date', 'id', 'type', 'owner', 'priority', 'value', 'price', 'count', 'description', 'category']);

function splitColumns(line: string): string[] | null {
  if (line.includes('|')) {
    const cols = line
      .split('|')
      .map((c) => c.trim())
      .filter((c, idx, arr) => !(c === '' && (idx === 0 || idx === arr.length - 1)));
    return cols.length >= 2 ? cols : null;
  }
  const bySpaces = line
    .split(/ {2,}|\t+/)
    .map((c) => c.trim())
    .filter((c) => c !== '');
  return bySpaces.length >= 2 ? bySpaces : null;
}

function pass6_tables(doc: Doc, flagUncertain: boolean): Doc {
  const protectedMask = computeProtectedMask(doc.lines);
  const lines = doc.lines;
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    if (
      protectedMask[i] ||
      isBlank(lines[i]) ||
      /^\s*(```|>|#{1,6}\s|[-*+]\s|\d+[.)]\s)/.test(lines[i]) ||
      /^\s*\|?\s*-{3,}/.test(lines[i])
    ) {
      out.push(lines[i]);
      i++;
      continue;
    }
    const cols = splitColumns(lines[i]);
    if (cols) {
      const block: string[][] = [cols];
      let j = i + 1;
      while (j < lines.length) {
        const c = splitColumns(lines[j]);
        if (c && c.length === cols.length) {
          block.push(c);
          j++;
        } else break;
      }
      const colCount = cols.length;
      const headerLooksReal = block[0].some((c) => TABLE_HEADER_HINTS.has(c.toLowerCase()));
      const enoughRows = block.length >= 3 || (colCount >= 3 && block.length >= 2);
      if (headerLooksReal || enoughRows) {
        out.push('| ' + block[0].join(' | ') + ' |');
        out.push('| ' + block[0].map(() => '---').join(' | ') + ' |');
        for (let r = 1; r < block.length; r++) out.push('| ' + block[r].join(' | ') + ' |');
        i = j;
        continue;
      } else if (flagUncertain && block.length >= 2) {
        out.push(lines[i], '<!-- verify: possible table, low confidence -->');
        i++;
        continue;
      }
    }
    out.push(lines[i]);
    i++;
  }
  return { lines: out };
}

// ── Pass 7 — Tasks & dialogue (new) ─────────────────────────────────────

const TASK_PATTERN = /^(\s*(?:[-*+]\s*)?)(TODO|action item|follow[- ]?up)s?\s*:\s*/i;
const QA_PATTERN = /^\s*(Q\d*|A\d*)\s*:\s*(.+)$/;
const RESERVED_LABELS = new Set(['note', 'important', 'warning', 'caution', 'hint', 'tip', 'definition', 'example', 'key concepts', 'todo', 'action item', 'follow up', 'followup']);

function pass7_tasksAndDialogue(doc: Doc): Doc {
  const protectedMask = computeProtectedMask(doc.lines);
  const lines = doc.lines;

  let speakerLineCount = 0;
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z][\w'’.-]*(?:\s[A-Z][\w'’.-]*){0,2}):\s+\S/);
    if (m && !RESERVED_LABELS.has(m[1].toLowerCase())) speakerLineCount++;
  }
  const looksLikeTranscript = speakerLineCount >= 3;

  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (protectedMask[i]) {
      out.push(lines[i]);
      continue;
    }
    const line = lines[i];

    const taskMatch = line.match(TASK_PATTERN);
    if (taskMatch) {
      out.push(`${taskMatch[1].replace(/[-*+]\s*$/, '')}- [ ] ${line.slice(taskMatch[0].length)}`);
      continue;
    }

    const qaMatch = line.match(QA_PATTERN);
    if (qaMatch) {
      out.push(`**${qaMatch[1].toUpperCase()}:** ${qaMatch[2]}`);
      continue;
    }

    if (looksLikeTranscript) {
      const speakerMatch = line.match(/^(\s*)([A-Z][\w'’.-]*(?:\s[A-Z][\w'’.-]*){0,2}):\s+(.+)$/);
      if (speakerMatch && !RESERVED_LABELS.has(speakerMatch[2].toLowerCase())) {
        out.push(`${speakerMatch[1]}**${speakerMatch[2]}:** ${speakerMatch[3]}`);
        continue;
      }
    }

    out.push(line);
  }
  return { lines: out };
}

// ── Pass 8 — Links (new: emails, double-wrap guard) ─────────────────────

const URL_PATTERN = /(?<!\]\()https?:\/\/[^\s)]+/g;
const EMAIL_PATTERN = /(?<!\]\()(?<![\w.-])[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}(?![\w.-])/g;

function pass8_links(doc: Doc): Doc {
  const protectedMask = computeProtectedMask(doc.lines);
  const out = doc.lines.map((line, idx) => {
    if (protectedMask[idx] || /^\s*```/.test(line)) return line;
    let result = line.replace(URL_PATTERN, (url) => {
      try {
        const u = new URL(url);
        const label = (u.hostname + u.pathname).replace(/\/$/, '');
        return `[${label}](${url})`;
      } catch {
        return url;
      }
    });
    result = result.replace(EMAIL_PATTERN, (email) => `[${email}](mailto:${email})`);
    return result;
  });
  return { lines: out };
}

// ── Pass 9 — Cleanup ─────────────────────────────────────────────────────

function normalizeTypography(line: string): string {
  return line
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u00A0/g, ' ')
    .replace(/^(\s*)[•◦▪‣●·]\s+/, '$1- ');
}

function pass9_cleanup(doc: Doc, fixOcrArtifacts: boolean): Doc {
  let lines = doc.lines.map(normalizeTypography).map((l) => l.replace(/\s+$/, ''));

  if (fixOcrArtifacts) {
    const joined: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(.*[a-z])-$/);
      const next = lines[i + 1];
      if (m && next !== undefined && !isBlank(next) && /^[a-z]/.test(next.trim())) {
        joined.push(m[1] + next.trim());
        i++;
        continue;
      }
      joined.push(lines[i]);
    }
    lines = joined;
  }

  const collapsed: string[] = [];
  let blankRun = 0;
  for (const line of lines) {
    if (isBlank(line)) {
      blankRun++;
      if (blankRun <= 2) collapsed.push('');
    } else {
      blankRun = 0;
      collapsed.push(line);
    }
  }
  while (collapsed.length && isBlank(collapsed[collapsed.length - 1])) collapsed.pop();

  return { lines: collapsed };
}

// ── Table of contents (optional) ────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\- ]+/g, '')
    .replace(/\s+/g, '-');
}

function buildTOC(headings: HeadingInfo[]): string {
  const lines = ['## Table of Contents'];
  for (const h of headings) {
    const indent = '  '.repeat(Math.max(0, h.level - 2));
    lines.push(`${indent}- [${h.text}](#${slugify(h.text)})`);
  }
  return lines.join('\n');
}
