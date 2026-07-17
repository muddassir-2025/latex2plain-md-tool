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

# Write to a new file
latex2plain notes.md clean.md

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

---

## Conversion Pipeline

| Stage | Input | Output |
|-------|-------|--------|
| Code block protection | `` ```ts ... ``` `` | placeholder (restored after) |
| Dollar stripping | `$x^2$` → `x^2`, `$$\n...\n$$` → `...` | content with delimiters removed |
| `\pmod{}` | `\pmod{n}` | `(mod n)` |
| Symbol mappings | `\alpha` → `α`, `\infty` → `∞`, `\rightarrow` → `→` | Unicode symbols |
| `\text{}` | `\text{hello}` | `hello` |
| `\tag{}` | `\tag{1}` | `(1)` |
| Structural commands | `\binom{n}{k}` | `C(n,k)` |
| Structural commands | `\label{foo}` | _(removed)_ |
| Structural commands | `\ref{foo}` | `foo` |
| Structural commands | `\eqref{foo}` | `(foo)` |
| Structural commands | `\notag` | _(removed)_ |
| Structural commands | `\tag*{1}` | `(1)` |
| Subscripts | `n_0`, `x_{123}` | `n₀`, `x₁₂₃` |
| Superscripts | `x^2`, `e^{-n}` | `x²`, `e⁻ⁿ` |
| Fractions | `\frac{1}{2}`, `\frac{a+b}{c}` | `1/2`, `(a+b)/c` |
| Roots | `\sqrt{x}`, `\sqrt[3]{x}` | `√x`, `∛x` |
| Cleanup | extra spaces / blank lines | normalized |

---

## Symbol Reference

### Functions

These LaTeX function names are converted to plain text (backslash removed):

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
| `\Rightarrow` | ⇒ | | `\Leftarrow` | ⇐ |
| `\Leftrightarrow` `\iff` | ⟺ | | `\implies` | ⟹ |
| `\impliedby` | ⟸ | | | |
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
