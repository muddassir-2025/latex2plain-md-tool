# latex2plain

> Convert LaTeX math notation in Markdown files to clean, readable plain Unicode text.

```latex
f(n) \le C \cdot g(n) \quad \text{for all } n \ge n_0
```

becomes:

```
f(n) ≤ C · g(n)    for all  n ≥ n₀
```

latex2plain runs as both a **CLI tool** and a **web application** with a React frontend and Express backend.

---

## Table of Contents

- [CLI Installation & Usage](#cli-installation--usage)
- [Web Application](#web-application)
- [Conversion Pipeline](#conversion-pipeline)
- [Symbol Reference](#symbol-reference)
- [Local Development](#local-development)
- [Render Deployment](#render-deployment)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [License](#license)

---

## CLI Installation & Usage

### Install

```bash
npm install -g latex2plain
```

Or run locally after cloning:

```bash
npm install
npm run build
npm install -g .
```

### Usage

```bash
latex2plain [options] [input] [output]
latex2plain [options] <directory>
cat notes.md | latex2plain
```

### Examples

```bash
# Overwrite file in place
latex2plain notes.md

# Write to a new (plain Markdown) file
latex2plain notes.md clean.md

# Generate an accessible HTML page from the converted output
latex2plain notes.md clean.html

# Generate a PDF from the converted output
latex2plain notes.md clean.pdf

# Preview without writing
latex2plain notes.md --dry-run

# Show what changed
latex2plain notes.md --diff

# Read from stdin, write to stdout
cat notes.md | latex2plain

# Smart-format raw study notes before conversion
latex2plain notes.md --smart-format clean.md

# Convert all .md files in a directory (recursive)
latex2plain docs/
```

### Options

| Flag | Description |
|------|-------------|
| `-h, --help` | Show help |
| `-v, --version` | Show version |
| `-y, --yes` | Skip overwrite confirmation |
| `--dry-run` | Preview output without writing |
| `--diff` | Show before/after diff |
| `--stdin` | Force reading from stdin |
| `--verbose` | Print conversion stages |
| `--no-subscripts` | Skip subscript conversion |
| `--no-superscripts` | Skip superscript conversion |
| `--no-fractions` | Skip fraction conversion |
| `--no-roots` | Skip root conversion |
| `--no-mappings` | Skip symbol mapping |
| `--no-stripping` | Skip stripping wrapper commands (font, color, accents, boxes, etc.) |
| `--no-environments` | Skip environment stripping (`\begin{...}`/`\end{...}`) |
| `-s, --smart-format` | Auto-format raw text into structured Markdown before conversion |

---

## Web Application

latex2plain includes a full web application where users can convert Markdown and LaTeX to PDF without installing anything.

### Features

- **Paste text** — Type or paste Markdown/LaTeX directly into the editor
- **Upload files** — Upload `.md` or `.txt` files (drag & drop supported)
- **Smart Format toggle** — Auto-detect headings, code blocks, math formulas, definitions, and more from raw unstructured text before conversion
- **Generate PDF** — Click "Convert to PDF" to download the result
- **Cold-start UX** — Time-based loading messages inform users when the Render backend is waking up from inactivity
- **Responsive design** — Works on mobile, tablet, and desktop
- **Dark mode** — Automatically respects system `prefers-color-scheme`

### Try It

Visit the live web app (if deployed) or run locally (see [Local Development](#local-development)).

---

## Conversion Pipeline

### Smart Format (pre-processing)

The optional **Smart Format** stage runs before the main conversion pipeline when `--smart-format` is enabled. It analyzes raw unstructured text and produces structured Markdown:

| Detection | Raw Input | Formatted Output |
|-----------|-----------|------------------|
| Headings | `chapter 1: calculus review` | `# chapter 1: calculus review` |
| Sub-headings | `2.1 Methodology` | `### Methodology` |
| Code blocks | `def factorial(n):` / `import numpy` | ` ```python ... ``` ` |
| Math expressions | `int_a^b f(x) dx` | `$$int_a^b f(x) dx$$` |
| Definitions | `def: A function maps...` | `**Definition:** A function maps...` |
| Notes/Callouts | `note: Remember to check...` | `> **Note:** Remember to check...` |
| Examples | `example: Compute the derivative` | `**Example:** Compute the derivative` |
| Formulas | `formula: E = mc^2` | `$$E = mc^2$$` |
| Implicit lists | `Logistic regression - 87.3%` | `- Logistic regression — 87.3%` |
| Bare URLs | `https://example.com` | `[example.com](https://example.com)` |

This is especially useful for:
- Raw study notes from lectures or textbooks
- ChatGPT output with code, math, and explanations mixed together
- Research paper drafts with section titles but no markdown formatting
- Any unstructured text with embedded code, math, or structured content

### Main Pipeline

| Stage | Input | Output |
|-------|-------|--------|
| Code block protection | `` ```ts ... ``` `` | placeholder (restored after) |
| Dollar stripping | `$x^2$` → `x^2`, `$$\\n...\\n$$` → `...` | content with delimiters removed |
| Display math stripping | `\\[x^2\\]` | `x^2` |
| Style command stripping | `\\displaystyle`, `\\textstyle`, `\\scriptstyle`, `\\scriptscriptstyle` | _(removed)_ |
| `\\pmod{}` | `\\pmod{n}` | `(mod n)` |
| `\\lim` formatting | `\\lim_{x \\to \\infty}` | `lim (x → ∞)` |
| Symbol mappings | `\\alpha` → `α`, `\\infty` → `∞`, `\\rightarrow` → `→` | Unicode symbols |
| `\\text{}` | `\\text{hello}` | `hello` |
| `\\tag{}` | `\\tag{1}` | `(1)` |
| Font commands | `\\mathrm{xyz}`, `\\mathbf{x}`, etc. | inner content only |
| Color commands | `\\color{red}{x}`, `\\textcolor{red}{x}` | inner content only |
| Cancel, sout, underline, etc. | `\\cancel{x}`, `\\sout{x}` | inner content only |
| Boxes | `\\boxed{x}`, `\\fbox{x}` | `x` |
| Accents | `\\vec{x}`, `\\hat{x}`, `\\bar{x}`, etc. | inner content only |
| Environments | `\\begin{align}...\\end{align}` | inner content with `\\\\` → `;` |
| `\\binom{}{}` | `\\binom{n}{k}` | `C(n,k)` |
| Subscripts | `n_0`, `x_{123}` | `n₀`, `x₁₂₃` |
| Superscripts | `x^2`, `e^{-n}` | `x²`, `e⁻ⁿ` |
| Fractions | `\\frac{1}{2}` | `(1/2)` |
| Roots | `\\sqrt{x}`, `\\sqrt[3]{x}` | `√x`, `∛x` |
| Function parenthesization | `sin x` → `sin(x)`, `log n` → `log(n)` | parentheses added |
| Cleanup | extra spaces / blank lines | normalized |
| Code block restoration | placeholder | original `` ``` `` |

See the [full stripping reference](src/converter/stripping.ts) for all supported commands.

---

## Local Development

### Prerequisites

- Node.js 20+
- npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/muddassir-2025/latex2plain-md-tool.git
cd latex2plain

# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Build everything
npm run build:all
```

### Run Commands

```bash
# Run the CLI
npm run start -- input.md output.pdf

# Run the backend server (serves API on :3001)
npm run server

# Run the React frontend dev server (with Vite proxy to backend)
npm run dev:client

# Run both backend + frontend in development
npm run dev:all

# Run tests (343 tests across 15 test files)
npm test

# Run lint
npm run lint
```

### Development Flow

1. Start the backend: `npm run dev:server`
2. In another terminal, start the frontend: `npm run dev:client`
3. Open http://localhost:5173 in your browser
4. The Vite dev server proxies `/api/*` requests to the Express backend on port 3001

---

## Render Deployment

### Architecture

The application is designed as a single **Render Web Service** that serves both the API and the React frontend:

```
Render Web Service
    │
    ├── Node.js + Express backend
    │       │
    │       ├── GET  /health
    │       ├── POST /api/convert
    │       └── POST /api/convert-file
    │
    └── React frontend (static files, served for all other routes)
```

### Deploy Steps

1. **Push to GitHub** (or connect your repository to Render).

2. **Create a Web Service** on Render:
   - **Branch**: `main`
   - **Runtime**: `Docker` (uses the included `Dockerfile`)
   - **Build Command**: (leave empty — the Dockerfile handles building)
   - **Start Command**: (leave empty — the Dockerfile handles starting)
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `PORT`: (Render sets this automatically)

### Docker Deployment

The included `Dockerfile` uses a multi-stage build:

1. **Build stage**: Compiles TypeScript and builds the React frontend
2. **Production stage**: Installs Chromium system dependencies for Puppeteer and starts the server

The Dockerfile sets `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` so Puppeteer uses the system-installed Chromium rather than downloading its own.

### Render Free Tier

- **Cold starts**: After 15 minutes of inactivity, Render's free web services spin down. The first request will take longer (typically 30–60 seconds).
- **Cold-start UX**: The React frontend displays time-based messages:
  - 0–3 seconds: "Preparing your PDF..."
  - 3–8 seconds: "The server may need a moment to start..."
  - 8+ seconds: "Still working... Your PDF is being generated."
- **Bandwidth**: Free tier includes 500 MB outbound bandwidth per month.
- **CPU/Memory**: Free services have limited resources; large documents may take longer.

### Puppeteer/Chromium Notes

- The Dockerfile installs Chromium system-wide and sets `PUPPETEER_EXECUTABLE_PATH`.
- PDF generation uses `md-to-pdf` which wraps Puppeteer under the hood.
- If deploying without Docker, you may need to configure Puppeteer to find Chromium on Render's base Node image.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Port for the Express backend (Render sets this automatically) |
| `NODE_ENV` | `development` | Set to `production` for Render deployment |
| `VITE_API_URL` | (empty) | API URL for the React frontend in production. In development, Vite proxies requests automatically. Set to your Render URL in production (e.g. `https://your-app.onrender.com`) |

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

---

## Architecture

```
        Raw unstructured text (study notes, ChatGPT output, …)
                           │
                           ▼
               Smart Format (src/formatter/)
              (7-pass detection & structuring)
                           │
                           ▼
                 latex2plain core (src/converter/)
                  (LaTeX → Unicode pipeline)
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
         CLI (src/cli.ts)          Web API (src/server.ts)
              │                         │
              ▼                         ▼
        Terminal users             React frontend (client/)
                                       │
                                       ▼
                                  Browser users
```

### Core Modules

| Module | Location | Purpose |
|--------|----------|---------|
| Conversion pipeline | `src/converter/` | LaTeX → Unicode text conversion (24 stages) |
| Smart Format | `src/formatter/` | Pre-processes raw text into structured Markdown (7-pass detection) |
| PDF generation | `src/pdf.ts` | Wraps md-to-pdf for reusable PDF buffer output |
| CLI | `src/cli.ts` | Command-line interface, flag parsing, file processing |
| Web server | `src/server.ts` | Node.js HTTP server with Express API for convert/health endpoints |
| HTML template | `src/html.ts` | Accessible HTML5 page generation |
| PDF styles | `src/pdf-style.ts` | CSS for md-to-pdf output |
| React frontend | `client/` | Vite + React SPA with paste/upload UI |

### Reusable Core

The key design principle is that the **conversion engine is shared** between the CLI and web API:

- **CLI**: Calls `convert()` directly, then writes to files or uses `mdToPdf` for PDF output
- **Web API**: Calls `convertToPdfBuffer()` which internally calls `convert()` + `mdToPdf`, returns a Buffer

Both reuse the same pipeline — no shell commands, no child processes, no code duplication.

---

## Tests

```bash
npm test           # Run all 343 tests (15 test files)
npm run test:watch # Watch mode
```

Test files cover:

- All conversion pipeline stages (12 test files, 250 tests)
- Metadata and structure preservation (49 tests)
- Smart Format formatting (36 tests)
- Server API endpoints (8 tests)
- Input validation
- Empty inputs
- Unsupported file types
- Error handling

---

## License

MIT
