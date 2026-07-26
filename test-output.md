# latex2plain

> Convert LaTeX math notation in Markdown files to clean, readable plain Unicode text.

```latex
f(n) \le C \cdot g(n) \quad \text{for all } n \ge n_0
```

becomes:

```
f(n) ≤ C · g(n)    for all  n ≥ n₀
```

---

## Install

```bash
npm install -g latex2plain
```

Or run locally after cloning:

```bash
npm install
npm run build
npm install -g .
```

---

## Usage

```
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

# Convert all .md files in a directory (recursive)
latex2plain docs/
```

---

## Options

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

---

## HTML Output

You can generate an accessible, self-contained HTML page by specifying a `.html` output path:

```bash
latex2plain notes.md clean.html
```

The HTML page includes:

- **Full accessibility** — Semantic HTML5 landmarks, ARIA labels, skip-to-content link, keyboard-navigable focus styles
- **Responsive design** — Adapts to mobile, tablet, and desktop viewports
- **Dark mode** — Automatically respects system `prefers-color-scheme`
- **Print-friendly** — Clean layout when printed or saved as PDF via browser
- **Math font stack** — Unicode math symbols rendered with proper math fonts (STIX Two, Cambria Math, etc.)
- **Syntax highlighting** — Code blocks rendered with distinct backgrounds and borders
- **Self-contained** — No external CSS, JS, or web fonts; everything is inline

### Notes

- The `.html` output is completely standalone — open it in any browser, email it, or upload it to a static site.
- All conversion flags (`--no-superscripts`, `--no-fractions`, etc.) apply before HTML generation.
- The generated page includes a metadata footer linking back to latex2plain.

---

## PDF Generation

You can generate a PDF directly from a LaTeX-markdown file by specifying a `.pdf` output path:

```bash
latex2plain notes.md clean.pdf
```

This runs the full LaTeX-to-plain-text conversion pipeline, then generates a PDF using [md-to-pdf](https://www.npmjs.com/package/md-to-pdf) which renders the converted markdown through headless Chrome (Puppeteer) for pixel-perfect output.

### How it works

1. The input Markdown + LaTeX is converted to plain Unicode Markdown (same pipeline as `.md` output).
2. The converted Markdown is rendered to PDF with **custom CSS styling** that matches the HTML template's design:
 - Sans-serif system fonts for body text
 - Serif math font stack for Greek letters and operators (α, ∫, →, etc.)
 - Monospace font for code blocks with rounded, light-gray backgrounds
 - Purple accent color for blockquotes and links
3. The final PDF is written to the specified `.pdf` path — no temporary files are created.

### Design

- **A4 page size** with comfortable margins (0.78in top/bottom, 0.9in left/right)
- **Automatic page breaks** — content flows across pages naturally
- **Code blocks** with rounded, light-gray backgrounds
- **Heading hierarchy** with appropriate sizing (22pt h1 → 11pt h6)

### Notes

- The `--dry-run` and `--diff` flags work as expected with `.pdf` output (they display the converted text, not a PDF).
- All conversion flags (`--no-superscripts`, `--no-fractions`, etc.) apply to the intermediate markdown before PDF generation.
- PDF output is not supported when reading from stdin or processing directories — those flows produce plain Markdown as usual.

---

## Conversion Pipeline

| Stage | Input | Output |
|-------|-------|--------|
| Code block protection | `` @@CODEBLOCK-8@@ `` | placeholder (restored after) |
| Dollar stripping | `$x^2$` → `x^2`, `$$\n...\n$$` → `...` | content with delimiters removed |
| Display math stripping | `\[x^2\]` | `x^2` |
| Style command stripping | `\displaystyle`, `\textstyle`, `\scriptstyle`, `\scriptscriptstyle` | _(removed)_ |
| `\pmod{}` | `\pmod{n}` | `(mod n)` |
| `\lim` formatting | `\lim_{x \to \infty}` | `lim (x → ∞)` |
| Symbol mappings | `\alpha` → `α`, `\infty` → `∞`, `\rightarrow` → `→` | Unicode symbols |
| `\text{}` | `\text{hello}` | `hello` |
| `\tag{}` | `\tag{1}` | `(1)` |
| Font commands | `\mathrm{xyz}`, `\mathbf{x}`, `\textit{x}`, `\textbf{x}`, `\mathcal{X}`, `\operatorname{foo}`, `\emph{...}`, `\boldsymbol{x}` | inner content only |
| Color commands | `\color{red}{x}`, `\textcolor{red}{x}` | inner content only |
| Cancel | `\cancel{x}`, `\cancelto{0}{x}` | `x`, `0` |
| Sout | `\sout{x}` | `x` |
| Underline / Overline | `\underline{x}`, `\overline{x}` | `x` |
| Over/Under braces | `\underbrace{x}`, `\overbrace{x}` | `x` |
| Boxes | `\boxed{x}`, `\fbox{x}` | `x` |
| Phantom | `\phantom{x}`, `\hphantom{x}`, `\vphantom{x}` | `x` |
| Accents | `\vec{x}`, `\hat{x}`, `\bar{x}`, `\tilde{x}`, `\dot{x}`, `\ddot{x}`, `\widehat{ABC}`, `\widetilde{ABC}` | inner content only |
| Extensible arrows | `\xrightarrow{text}`, `\xleftarrow{text}` | `text` |
| Invisible delimiters | `\left.`, `\right.` | _(removed)_ |
| Environments | `\begin{align}...\end{align}`, `\begin{cases}...\end{cases}`, etc. | inner content with `\\` → `;` and `&` → space |
| Matrix delimiters | `\begin{pmatrix}...\end{pmatrix}` | `(a b ; c d)` with `()` wrappers |
| Matrix delimiters | `\begin{bmatrix}...\end{bmatrix}` | `[a b ; c d]` with `[]` wrappers |
| Matrix delimiters | `\begin{vmatrix}...\end{vmatrix}` | `|a b ; c d|` with `||` wrappers |
| Matrix delimiters | `\begin{Vmatrix}...\end{Vmatrix}` | `‖a b ; c d‖` with `‖‖` wrappers |
| `\hline` / `\hdashline` | `\hline` | _(removed)_ |
| `\binom{}{}` | `\binom{n}{k}` | `C(n,k)` |
| `\over` | `{a \over b}` | `(a/b)` |
| `\choose` | `{n \choose k}` | `C(n,k)` |
| `\atop` | `{a \atop b}` | `(a / b)` |
| `\label{foo}` | _(removed)_ | — |
| `\ref{foo}` | `foo` | — |
| `\eqref{foo}` | `(foo)` | — |
| `\notag` | _(removed)_ | — |
| `\tag*{1}` | `(1)` | — |
| Subscripts | `n_0`, `x_{123}` | `n₀`, `x₁₂₃` |
| Superscripts | `x^2`, `e^{-n}` | `x²`, `e⁻ⁿ` |
| Fractions | `\frac{1}{2}`, `\frac{a+b}{c}` | `(1/2)`, `(a+b)/c` |
| Fractions (shorthand) | `\frac12`, `\frac1{2}`, `\frac{1}2` | `1/2` |
| Roots | `\sqrt{x}`, `\sqrt[3]{x}` | `√x`, `∛x` |
| Function parenthesization | `sin x`, `log n`, `exp(iθ)` | `sin(x)`, `log(n)`, `exp(iθ)` |
| Cleanup | extra spaces / blank lines | normalized |
| Code block restoration | placeholder | original `` @@CODEBLOCK-9@@ `` |

### Recursive Conversion

Nested LaTeX is properly handled throughout the pipeline:

| Input | Output |
|-------|--------|
| `\frac{\sqrt{x}}{y}` | `(√x / y)` |
| `\sqrt{\frac{a}{b}}` | `√(a / b)` |
| `\binom{\frac{1}{2}}{3}` | `C((1/2),3)` |
| `\pmod{\frac{a}{b}}` | `(mod a/b)` |
| `{ \frac{a}{b} \over c }` | `((a/b) / c)` |

---

## Stripping Reference

The stripping stage removes wrapper commands that add formatting but carry no semantic meaning in plain text.

### Font Commands

| LaTeX | Action |
|-------|--------|
| `\mathrm{...}` | Stripped (content preserved) |
| `\mathbf{...}` | Stripped |
| `\mathit{...}` | Stripped |
| `\mathsf{...}` | Stripped |
| `\mathtt{...}` | Stripped |
| `\mathnormal{...}` | Stripped |
| `\mathcal{...}` | Stripped |
| `\operatorname{...}` | Stripped |
| `\boldsymbol{...}` | Stripped |
| `\textbf{...}` | Stripped |
| `\textit{...}` | Stripped |
| `\textrm{...}` | Stripped |
| `\emph{...}` | Stripped |

### Accent Commands

| LaTeX | Action | LaTeX | Action |
|-------|--------|-------|--------|
| `\vec{x}` | → `x` | `\hat{x}` | → `x` |
| `\bar{x}` | → `x` | `\tilde{x}` | → `x` |
| `\dot{x}` | → `x` | `\ddot{x}` | → `x` |
| `\check{x}` | → `x` | `\breve{x}` | → `x` |
| `\acute{x}` | → `x` | `\grave{x}` | → `x` |
| `\widehat{ABC}` | → `ABC` | `\widetilde{ABC}` | → `ABC` |

### Boxes & Decorations

| LaTeX | Action |
|-------|--------|
| `\boxed{x}` | → `x` |
| `\fbox{x}` | → `x` |
| `\cancel{x}` | → `x` |
| `\cancelto{0}{x}` | → `0` (keeps to-value) |
| `\sout{x}` | → `x` |
| `\underline{x}` | → `x` |
| `\overline{x}` | → `x` |
| `\underbrace{x}` | → `x` |
| `\overbrace{x}` | → `x` |
| `\phantom{x}` | → `x` |
| `\hphantom{x}` | → `x` |
| `\vphantom{x}` | → `x` |
| `\xrightarrow{abc}` | → `abc` |
| `\xleftarrow{abc}` | → `abc` |

---

## Symbol Reference

### Functions

These LaTeX function names are converted to plain text (backslash removed). After all other conversions, parenthesization is applied so `sin x` becomes `sin(x)`:

| LaTeX | Output | LaTeX | Output |
|-------|--------|-------|--------|
| `\sin` | `sin` | `\arcsin` | `arcsin` |
| `\cos` | `cos` | `\arccos` | `arccos` |
| `\tan` | `tan` | `\arctan` | `arctan` |
| `\sinh` | `sinh` | `\csc` | `csc` |
| `\cosh` | `cosh` | `\sec` | `sec` |
| `\tanh` | `tanh` | `\cot` | `cot` |
| `\coth` | `coth` | `\sech` | `sech` |
| `\csch` | `csch` | | |
| `\exp` | `exp` | `\log` | `log` |
| `\ln` | `ln` | `\lg` | `lg` |
| `\lim` | `lim` | `\limsup` | `lim sup` |
| `\liminf` | `lim inf` | `\Pr` | `Pr` |
| `\det` | `det` | `\dim` | `dim` |
| `\hom` | `hom` | `\ker` | `ker` |
| `\arg` | `arg` | `\deg` | `deg` |
| `\max` | `max` | `\min` | `min` |
| `\sup` | `sup` | `\inf` | `inf` |
| `\gcd` | `gcd` | `\lcm` | `lcm` |
| `\bmod` | `mod` | | |

### `\lim` Formatting

The `\lim` command (and `\limsup`, `\liminf`) with subscripts is converted to a parenthesized form:

| LaTeX | Output |
|-------|--------|
| `\lim_{x \to \infty}` | `lim (x → ∞)` |
| `\lim_{n \to 0} \frac{1}{n}` | `lim (n → 0) (1/n)` |
| `\limsup_{k \to \infty}` | `lim sup (k → ∞)` |
| `\liminf_{n \to \infty}` | `lim inf (n → ∞)` |

### Greek Letters

| LaTeX | Unicode | | LaTeX | Unicode |
|-------|---------|---|-------|---------|
| `\alpha` | α | | `\beta` | β |
| `\gamma` | γ | | `\delta` | δ |
| `\epsilon` | ε | | `\varepsilon` | ε |
| `\zeta` | ζ | | `\eta` | η |
| `\theta` | θ | | `\vartheta` | ϑ |
| `\iota` | ι | | `\kappa` | κ |
| `\lambda` | λ | | `\mu` | μ |
| `\nu` | ν | | `\xi` | ξ |
| `\pi` | π | | `\varpi` | ϖ |
| `\rho` | ρ | | `\varrho` | ϱ |
| `\sigma` | σ | | `\varsigma` | ς |
| `\tau` | τ | | `\upsilon` | υ |
| `\phi` | φ | | `\varphi` | ϕ |
| `\chi` | χ | | `\psi` | ψ |
| `\omega` | ω | | | |
| `\Gamma` | Γ | | `\Delta` | Δ |
| `\Theta` | Θ | | `\Lambda` | Λ |
| `\Xi` | Ξ | | `\Pi` | Π |
| `\Sigma` | Σ | | `\Upsilon` | Υ |
| `\Phi` | Φ | | `\Psi` | Ψ |
| `\Omega` | Ω | | | |

### Comparison

| LaTeX | Unicode | | LaTeX | Unicode |
|-------|---------|---|-------|---------|
| `\leq` `\le` | ≤ | | `\geq` `\ge` | ≥ |
| `\neq` `\ne` | ≠ | | `\approx` | ≈ |
| `\approxeq` | ≊ | | `\equiv` | ≡ |
| `\sim` | ~ | | `\simeq` | ≃ |
| `\cong` | ≅ | | `\doteq` | ≐ |
| `\asymp` | ≍ | | `\ll` | ≪ |
| `\gg` | ≫ | | `\propto` | ∝ |
| `\prec` | ≺ | | `\preceq` | ⪯ |
| `\succ` | ≻ | | `\succeq` | ⪰ |
| `\lesssim` | ≲ | | `\gtrsim` | ≳ |
| `\lessgtr` | ≶ | | `\gtrless` | ≷ |

### Arithmetic & Binary Operations

| LaTeX | Unicode | | LaTeX | Unicode |
|-------|---------|---|-------|---------|
| `\cdot` | · | | `\times` | × |
| `\div` | ÷ | | `\pm` | ± |
| `\mp` | ∓ | | `\ast` | ∗ |
| `\star` | ⋆ | | `\circ` | ∘ |
| `\bullet` | ∙ | | `\diamond` | ⋄ |
| `\wr` | ≀ | | `\dagger` | † |
| `\ddagger` | ‡ | | `\oplus` | ⊕ |
| `\ominus` | ⊖ | | `\otimes` | ⊗ |
| `\oslash` | ⊘ | | `\odot` | ⊙ |
| `\bigcirc` | ○ | | `\setminus` | ∖ |
| `\amalg` | ⨿ | | | |

### Calculus & Analysis

| LaTeX | Unicode | | LaTeX | Unicode |
|-------|---------|---|-------|---------|
| `\infty` | ∞ | | `\partial` | ∂ |
| `\nabla` | ∇ | | `\int` | ∫ |
| `\iint` | ∬ | | `\iiint` | ∭ |
| `\oint` | ∮ | | `\sum` | Σ |
| `\prod` | Π | | `\coprod` | ∐ |

### Set Theory & Logic

| LaTeX | Unicode | | LaTeX | Unicode |
|-------|---------|---|-------|---------|
| `\in` | ∈ | | `\notin` | ∉ |
| `\subset` | ⊂ | | `\subseteq` | ⊆ |
| `\subseteqq` | ⫅ | | `\subsetneq` | ⊊ |
| `\Subset` | ⋐ | | | |
| `\supset` | ⊃ | | `\supseteq` | ⊇ |
| `\supseteqq` | ⫆ | | `\supsetneq` | ⊋ |
| `\Supset` | ⋑ | | | |
| `\cup` | ∪ | | `\cap` | ∩ |
| `\sqcup` | ⊔ | | `\sqcap` | ⊓ |
| `\vee` `\lor` | ∨ | | `\wedge` `\land` | ∧ |
| `\emptyset` `\varnothing` | ∅ | | `\complement` | ∁ |
| `\forall` | ∀ | | `\exists` | ∃ |
| `\nexists` | ∄ | | `\neg` `\lnot` | ¬ |
| `\therefore` | ∴ | | `\because` | ∵ |
| `\models` | ⊧ | | `\vdash` | ⊢ |
| `\dashv` | ⊣ | | `\bowtie` | ⋈ |
| `\mid` | ∣ | | `\nmid` | ∤ |

### Arrows

| LaTeX | Unicode | | LaTeX | Unicode |
|-------|---------|---|-------|---------|
| `\to` `\rightarrow` | → | | `\leftarrow` `\gets` | ← |
| `\leftrightarrow` | ↔ | | `\Rightarrow` | ⇒ |
| `\Leftarrow` | ⇐ | | `\Leftrightarrow` `\iff` | ⟺ |
| `\implies` | ⟹ | | `\impliedby` | ⟸ |
| `\mapsto` | ↦ | | `\longmapsto` | ⟼ |
| `\hookrightarrow` | ↪ | | `\hookleftarrow` | ↩ |
| `\twoheadrightarrow` | ↠ | | `\twoheadleftarrow` | ↞ |
| `\rightharpoonup` | ⇀ | | `\rightharpoondown` | ⇁ |
| `\leftharpoonup` | ↼ | | `\leftharpoondown` | ↽ |
| `\rightleftharpoons` | ⇌ | | `\leftrightharpoons` | ⇋ |
| `\uparrow` | ↑ | | `\downarrow` | ↓ |
| `\updownarrow` | ↕ | | `\Uparrow` | ⇑ |
| `\Downarrow` | ⇓ | | `\Updownarrow` | ⇕ |
| `\nearrow` | ↗ | | `\searrow` | ↘ |
| `\swarrow` | ↙ | | `\nwarrow` | ↖ |
| `\longrightarrow` | ⟶ | | `\longleftarrow` | ⟵ |
| `\longleftrightarrow` | ⟷ | | `\Longrightarrow` | ⟹ |
| `\Longleftarrow` | ⟸ | | `\Longleftrightarrow` | ⟺ |

### Misc Symbols

| LaTeX | Unicode | | LaTeX | Unicode |
|-------|---------|---|-------|---------|
| `\perp` `\bot` | ⊥ | | `\top` | ⊤ |
| `\parallel` | ∥ | | `\angle` | ∠ |
| `\measuredangle` | ∡ | | `\sphericalangle` | ∢ |
| `\triangle` | △ | | `\triangledown` | ▽ |
| `\triangleleft` | ◃ | | `\triangleright` | ▹ |
| `\prime` | ′ | | `\ell` | ℓ |
| `\hbar` `\hslash` | ℏ | | `\imath` | ı |
| `\jmath` | ȷ | | `\wp` | ℘ |
| `\aleph` | ℵ | | `\beth` | ℶ |
| `\gimel` | ℷ | | `\daleth` | ℸ |
| `\Re` | ℜ | | `\Im` | ℑ |
| `\Box` | □ | | `\Diamond` | ◇ |
| `\clubsuit` | ♣ | | `\diamondsuit` | ♢ |
| `\heartsuit` | ♡ | | `\spadesuit` | ♠ |
| `\S` | § | | `\P` | ¶ |

### Number Sets

| LaTeX | Unicode | | LaTeX | Unicode |
|-------|---------|---|-------|---------|
| `\mathbb{R}` | ℝ | | `\mathbb{N}` | ℕ |
| `\mathbb{Z}` | ℤ | | `\mathbb{Q}` | ℚ |
| `\mathbb{C}` | ℂ | | `\mathbb{P}` | ℙ |
| `\mathbb{H}` | ℍ | | `\mathbb{F}` | 𝔽 |

### Brackets & Delimiters

| LaTeX | Replacement | | LaTeX | Replacement |
|-------|-------------|---|-------|-------------|
| `\left(` | `(` | | `\right)` | `)` |
| `\left[` | `[` | | `\right]` | `]` |
| `\left\|` | `\|` | | `\right\|` | `\|` |
| `\lfloor` | ⌊ | | `\rfloor` | ⌋ |
| `\lceil` | ⌈ | | `\rceil` | ⌉ |
| `\langle` | ⟨ | | `\rangle` | ⟩ |

### Dots

| LaTeX | Unicode | | LaTeX | Unicode |
|-------|---------|---|-------|---------|
| `\ldots` | … | | `\cdots` | ⋯ |
| `\vdots` | ⋮ | | `\ddots` | ⋱ |

### LaTeX Escape Sequences

| LaTeX | Replacement | | LaTeX | Replacement |
|-------|-------------|---|-------|-------------|
| `\#` | `#` | | `\%` | `%` |
| `\{` | `{` | | `\}` | `}` |
| `\$` | `$` | | `\_` | `_` |
| `\&` | `&` | | `\textbackslash` | `\` |

### Spacing Commands

| LaTeX | Replacement |
|-------|-------------|
| `\quad` | 4 spaces |
| `\qquad` | 8 spaces |
| `\,` | 1 space |
| `\;` | 1 space |
| `\!` | (removed) |
| `\ ` (backslash-space) | 1 space |

---

## Supported Environments

When environment stripping is enabled (default), the following LaTeX math environments are converted to plain text:

| Environment | Description | Behaviour |
|-------------|-------------|-----------|
| `align`, `align*`, `aligned` | Alignment | `\\` → `;`, `&` stripped |
| `equation`, `equation*` | Single equation | Content extracted |
| `gather`, `gather*`, `gathered` | Gathering | `\\` → `;` |
| `multline`, `multline*` | Multi-line | `\\` → `;` |
| `split` | Split | `\\` → `;`, `&` stripped |
| `matrix` | Plain matrix | `\\` → `;`, `&` stripped, no delimiters |
| `pmatrix` | Parenthesised matrix | `\\` → `;`, `&` stripped, wrapped in `( )` |
| `bmatrix` | Bracket matrix | `\\` → `;`, `&` stripped, wrapped in `[ ]` |
| `vmatrix` | Single-bar matrix | `\\` → `;`, `&` stripped, wrapped in `| |` |
| `Vmatrix` | Double-bar matrix | `\\` → `;`, `&` stripped, wrapped in `‖ ‖` |
| `smallmatrix` | Inline matrix | `\\` → `;`, `&` stripped, no delimiters |
| `cases`, `dcases`, `rcases` | Cases | `\\` → `;`, `&` stripped |
| `array`, `subarray` | Array | `\\` → `;`, `&` stripped |
| `eqnarray`, `eqnarray*` | Equation array | `\\` → `;`, `&` stripped |
| `flalign`, `flalign*` | Full-length align | `\\` → `;`, `&` stripped |
| `alignat`, `alignat*` | Align at specific points | `\\` → `;`, `&` stripped |

Unknown environments pass through unchanged.

---

## Development

```bash
npm install
npm run build      # compile TypeScript
npm test           # run vitest suite
npm run dev        # build + run
npm run lint       # check code with ESLint
npm run format     # auto-format with Prettier
npm run format:check  # verify formatting
```

The project uses [ESLint](https://eslint.org/) for code quality and [Prettier](https://prettier.io/) for consistent formatting. Both run automatically in CI via [GitHub Actions](.github/workflows/ci.yml).

---

## License

MIT
