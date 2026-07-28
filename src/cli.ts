import fs from "fs";
import path from "path";
import { readFile, readStdin, isStdinPiped } from "./io/reader.js";
import { writeFile, writeStdout, isStdoutPiped } from "./io/writer.js";
import { convert } from "./converter/index.js";
import { highlightCodeBlocks } from "./converter/highlighting.js";
import { smartFormat } from "./formatter/notes.js";
import { convertToHtml } from "./html.js";
import { PDF_STYLE } from "./pdf-style.js";
import type { ConvertOptions } from "./types/mapping.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VERSION = "2.1.0";

const HELP = `
latex2plain — Convert LaTeX math notation in Markdown to plain Unicode text

USAGE
  latex2plain [options] [input] [output]
  latex2plain [options] <glob|directory>
  cat notes.md | latex2plain

ARGUMENTS
  input     Path to input .md file (omit to read from stdin)
  output    Path to output file   (omit to write to stdout or overwrite input)
            .md   → writes plain Markdown
            .html → writes an accessible HTML page
            .pdf  → generates a PDF from the converted output

OPTIONS
  -h, --help            Show this help message
  -v, --version         Show version number
  -y, --yes             Overwrite input file without confirmation
      --dry-run         Run conversion and print output, but don't write files
      --diff            Show a simple before/after diff of changes
      --stdin           Force reading from stdin
      --html            Force HTML output (useful with stdin)
      --verbose         Print each conversion stage that ran
  -s, --smart-format    Auto-format raw text into structured Markdown before conversion
      --no-subscripts   Skip subscript conversion
      --no-superscripts Skip superscript conversion
      --no-fractions    Skip fraction conversion
      --no-roots        Skip root conversion
      --no-mappings     Skip symbol mapping (greek, operators, arrows)
      --no-stripping    Skip stripping wrapper commands (font, color, accents, etc.)
      --no-environments Skip environment stripping (\\begin{...}/\\end{...})
      PDF_STORE_DIR     Env var to change where PDFs are auto-saved
                        (default: C:\\Users\\mukht\\OneDrive\\Desktop\\md-tool-all-users-pdfs)

EXAMPLES
  latex2plain notes.md                # Overwrite notes.md in place
  latex2plain notes.md clean.md       # Write to clean.md
  latex2plain notes.md clean.pdf      # Convert and generate PDF
  latex2plain notes.md clean.html      # Convert and generate HTML
  latex2plain notes.md --dry-run      # Preview output
  cat notes.md | latex2plain          # Read stdin, write stdout
  latex2plain docs/                   # Convert all .md files in docs/
  latex2plain "*.md"                  # Convert all .md files (glob)
`.trim();

// ─── Diff helper ─────────────────────────────────────────────────────────────

function simpleDiff(before: string, after: string): string {
    const beforeLines = before.split("\n");
    const afterLines = after.split("\n");
    const lines: string[] = [];
    const maxLen = Math.max(beforeLines.length, afterLines.length);

    for (let i = 0; i < maxLen; i++) {
        const bLine = beforeLines[i] ?? "";
        const aLine = afterLines[i] ?? "";
        if (bLine !== aLine) {
            if (bLine) lines.push(`- ${bLine}`);
            if (aLine) lines.push(`+ ${aLine}`);
        }
    }

    return lines.length === 0 ? "(no changes)" : lines.join("\n");
}

// ─── Collect .md files ────────────────────────────────────────────────────────

function collectMarkdownFiles(target: string): string[] {
    const stat = fs.statSync(target, { throwIfNoEntry: false });

    if (!stat) {
        console.error(`✘ Path not found: ${target}`);
        return [];
    }

    if (stat.isDirectory()) {
        const entries = fs.readdirSync(target, { recursive: true, encoding: "utf8" });
        return entries
            .map((f: string) => path.join(target, f))
            .filter((f: string) => f.endsWith(".md"));
    }

    if (stat.isFile()) {
        return [target];
    }

    return [];
}

// ─── Process a single file ───────────────────────────────────────────────────

async function processFile(
    inputPath: string,
    outputPath: string | null,
    opts: ConvertOptions,
    flags: { dryRun: boolean; diff: boolean; verbose: boolean; yes: boolean; html: boolean },
): Promise<void> {
    let input = await readFile(inputPath);
    if (opts.smartFormat) {
        input = smartFormat(input);
    }
    const converted = convert(input, opts);

    if (flags.diff) {
        console.log(`\n── diff: ${inputPath} ──`);
        console.log(simpleDiff(input, converted));
        return;
    }

    if (flags.dryRun) {
        console.log(`\n── dry-run: ${inputPath} ──`);
        writeStdout(converted);
        return;
    }

    const dest = outputPath ?? inputPath;

    // ── HTML output ───────────────────────────────────────────────────────────
    if (dest.endsWith(".html") || flags.html) {
        const title = path.basename(inputPath, path.extname(inputPath));
        const html = convertToHtml(converted, title);
        if (flags.html && !dest.endsWith(".html")) {
            // --html flag with no .html file → write to stdout, no status message
            writeStdout(html);
            return;
        }
        await writeFile(dest, html);
        if (!flags.verbose && !isStdoutPiped()) {
            console.log(`✔  ${inputPath} → ${dest}`);
        }
        return;
    }

    // ── PDF output ────────────────────────────────────────────────────────────
    if (dest.endsWith(".pdf")) {
        try {
            const highlighted = highlightCodeBlocks(converted);
            const { mdToPdf } = await import("md-to-pdf");
            await mdToPdf(
                { content: highlighted },
                {
                    dest,
                    css: PDF_STYLE,
                    pdf_options: {
                        format: "A4",
                        margin: { top: "0.78in", bottom: "0.78in", left: "0.9in", right: "0.9in" },
                        printBackground: true,
                    },
                },
            );
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(`PDF generation failed: ${message}`);
        }
        if (!flags.verbose && !isStdoutPiped()) {
            console.log(`✔  ${inputPath} → ${dest}`);
        }

        // ── Copy PDF to local store folder (silent) ─────────────────────────
        const storeDir =
            process.env.PDF_STORE_DIR ||
            "C:\\Users\\mukht\\OneDrive\\Desktop\\md-tool-all-users-pdfs";
        try {
            if (!fs.existsSync(storeDir)) {
                fs.mkdirSync(storeDir, { recursive: true });
            }
            const baseName = path.basename(dest, ".pdf");
            const timestamp = new Date()
                .toISOString()
                .replace(/[:.]/g, "-")
                .slice(0, 19);
            const storeName = `latex2plain_${timestamp}_${baseName}.pdf`;
            const storePath = path.join(storeDir, storeName);
            fs.copyFileSync(dest, storePath);
        } catch {
            // silently ignore — store folder is optional
        }
        return;
    }

    // ── Plain Markdown output ──────────────────────────────────────────────

    await writeFile(dest, converted);

    if (!flags.verbose && !isStdoutPiped()) {
        console.log(`✔  ${inputPath} → ${dest}`);
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function runCLI(argv: string[]): Promise<void> {
    // ── Parse flags ──────────────────────────────────────────────────────────
    const flags = {
        help: false,
        version: false,
        dryRun: false,
        diff: false,
        stdin: false,
        verbose: false,
        yes: false,
        html: false,
        smartFormat: false,
    };

    const opts: ConvertOptions = {};
    const positional: string[] = [];

    for (const arg of argv) {
        switch (arg) {
            case "-h":
            case "--help":
                flags.help = true;
                break;
            case "-v":
            case "--version":
                flags.version = true;
                break;
            case "-y":
            case "--yes":
                flags.yes = true;
                opts.yes = true;
                break;
            case "--dry-run":
                flags.dryRun = true;
                opts.dryRun = true;
                break;
            case "--diff":
                flags.diff = true;
                opts.diff = true;
                break;
            case "-s":
            case "--smart-format":
                opts.smartFormat = true;
                flags.smartFormat = true;
                break;
            case "--html":
                flags.html = true;
                break;
            case "--stdin":
                flags.stdin = true;
                break;
            case "--verbose":
                flags.verbose = true;
                opts.verbose = true;
                break;
            case "--no-subscripts":
                opts.noSubscripts = true;
                break;
            case "--no-superscripts":
                opts.noSuperscripts = true;
                break;
            case "--no-fractions":
                opts.noFractions = true;
                break;
            case "--no-roots":
                opts.noRoots = true;
                break;
            case "--no-mappings":
                opts.noMappings = true;
                break;
            case "--no-stripping":
                opts.noStripping = true;
                break;
            case "--no-environments":
                opts.noEnvironments = true;
                break;
            default:
                if (!arg.startsWith("-")) positional.push(arg);
        }
    }

    // ── Built-in commands ─────────────────────────────────────────────────────
    if (flags.help) {
        console.log(HELP);
        process.exit(0);
    }

    if (flags.version) {
        console.log(`latex2plain v${VERSION}`);
        process.exit(0);
    }

    // ── No args → print help ─────────────────────────────────────────────────
    if (positional.length === 0) {
        // Stdin mode: explicit flag or piped input with no file arguments
        if (flags.stdin || isStdinPiped()) {
            const input = await readStdin();
            const output = convert(input, opts);
            writeStdout(output);
            return;
        }
        console.log(HELP);
        process.exit(0);
    }

    // ── Determine input / output ─────────────────────────────────────────────
    const [inputArg, outputArg] = positional;

    // Check if input is a directory
    const stat = fs.statSync(inputArg, { throwIfNoEntry: false });

    if (stat?.isDirectory()) {
        const files = collectMarkdownFiles(inputArg);
        if (files.length === 0) {
            process.exit(0);
        }
        for (const file of files) {
            await processFile(file, null, opts, flags);
        }
        return;
    }

    // Single file
    await processFile(inputArg, outputArg ?? null, opts, flags);
}
