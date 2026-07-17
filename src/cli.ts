import fs from "fs";
import path from "path";
import { readFile, readStdin, isStdinPiped } from "./io/reader.js";
import { writeFile, writeStdout, isStdoutPiped } from "./io/writer.js";
import { convert } from "./converter/index.js";
import { ConvertOptions } from "./types/mapping.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VERSION = "0.1.0";

const HELP = `
latex2plain — Convert LaTeX math notation in Markdown to plain Unicode text

USAGE
  latex2plain [options] [input] [output]
  latex2plain [options] <glob|directory>
  cat notes.md | latex2plain

ARGUMENTS
  input     Path to input .md file (omit to read from stdin)
  output    Path to output file   (omit to write to stdout or overwrite input)

OPTIONS
  -h, --help            Show this help message
  -v, --version         Show version number
  -y, --yes             Overwrite input file without confirmation
      --dry-run         Run conversion and print output, but don't write files
      --diff            Show a simple before/after diff of changes
      --stdin           Force reading from stdin
      --verbose         Print each conversion stage that ran
      --no-subscripts   Skip subscript conversion
      --no-superscripts Skip superscript conversion
      --no-fractions    Skip fraction conversion
      --no-roots        Skip root conversion
      --no-mappings     Skip symbol mapping (greek, operators, arrows)

EXAMPLES
  latex2plain notes.md                # Overwrite notes.md in place
  latex2plain notes.md clean.md       # Write to clean.md
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

    return lines.length === 0
        ? "(no changes)"
        : lines.join("\n");
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
    flags: { dryRun: boolean; diff: boolean; verbose: boolean; yes: boolean }
): Promise<void> {
    const input = await readFile(inputPath);
    const output = convert(input, opts);

    if (flags.diff) {
        console.log(`\n── diff: ${inputPath} ──`);
        console.log(simpleDiff(input, output));
        return;
    }

    if (flags.dryRun) {
        console.log(`\n── dry-run: ${inputPath} ──`);
        writeStdout(output);
        return;
    }

    const dest = outputPath ?? inputPath;

    if (!outputPath && !flags.yes) {
        // In-place overwrite — warn but proceed (use --yes to silence)
        console.log(`⚠  Overwriting ${inputPath} (use --yes to suppress this message)`);
    }

    await writeFile(dest, output);

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
    };

    const opts: ConvertOptions = {};
    const positional: string[] = [];

    for (const arg of argv) {
        switch (arg) {
            case "-h":
            case "--help":         flags.help = true; break;
            case "-v":
            case "--version":      flags.version = true; break;
            case "-y":
            case "--yes":          flags.yes = true; opts.yes = true; break;
            case "--dry-run":      flags.dryRun = true; opts.dryRun = true; break;
            case "--diff":         flags.diff = true; opts.diff = true; break;
            case "--stdin":        flags.stdin = true; break;
            case "--verbose":      flags.verbose = true; opts.verbose = true; break;
            case "--no-subscripts":  opts.noSubscripts = true; break;
            case "--no-superscripts": opts.noSuperscripts = true; break;
            case "--no-fractions": opts.noFractions = true; break;
            case "--no-roots":     opts.noRoots = true; break;
            case "--no-mappings":  opts.noMappings = true; break;
            default:
                if (!arg.startsWith("-")) positional.push(arg);
                else console.warn(`⚠  Unknown flag: ${arg}`);
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
            console.log(`No .md files found in ${inputArg}`);
            process.exit(0);
        }
        for (const file of files) {
            await processFile(file, null, opts, flags);
        }
        return;
    }

    // Single file
    await processFile(
        inputArg,
        outputArg ?? null,
        opts,
        flags
    );
}
