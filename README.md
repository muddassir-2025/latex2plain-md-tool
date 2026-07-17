# latex2plain

> Convert LaTeX math notation in Markdown files to clean, readable plain Unicode text.

```
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
| Dollar stripping | `$x^2$` | `x^2` |
| Dollar stripping | `$$\n...\n$$` | `...` |
| Symbol mappings | `\alpha` | `α` |
| Symbol mappings | `\infty` | `∞` |
| Symbol mappings | `\rightarrow` | `→` |
| `\text{}` | `\text{hello}` | `hello` |
| Subscripts | `n_0` | `n₀` |
| Subscripts | `x_{123}` | `x₁₂₃` |
| Superscripts | `x^2` | `x²` |
| Superscripts | `e^{-n}` | `e⁻ⁿ` |
| Fractions | `\frac{1}{2}` | `1/2` |
| Fractions | `\frac{a+b}{c}` | `(a+b)/c` |
| Roots | `\sqrt{x}` | `√x` |
| Roots | `\sqrt[3]{x}` | `∛x` |
| Cleanup | extra spaces / blank lines | normalised |

---

## Symbol Reference

### Greek Letters

| LaTeX | Unicode |
|-------|---------|
| `\alpha` | α |
| `\beta` | β |
| `\gamma` | γ |
| `\delta` | δ |
| `\epsilon` | ε |
| `\theta` | θ |
| `\lambda` | λ |
| `\mu` | μ |
| `\pi` | π |
| `\sigma` | σ |
| `\omega` | ω |
| `\Gamma` | Γ |
| `\Delta` | Δ |
| `\Sigma` | Σ |
| `\Omega` | Ω |

### Operators

| LaTeX | Unicode |
|-------|---------|
| `\leq` | ≤ |
| `\geq` | ≥ |
| `\neq` | ≠ |
| `\approx` | ≈ |
| `\equiv` | ≡ |
| `\times` | × |
| `\div` | ÷ |
| `\pm` | ± |
| `\infty` | ∞ |
| `\sum` | Σ |
| `\prod` | Π |
| `\int` | ∫ |
| `\partial` | ∂ |
| `\nabla` | ∇ |
| `\forall` | ∀ |
| `\exists` | ∃ |
| `\in` | ∈ |
| `\subset` | ⊂ |
| `\cup` | ∪ |
| `\cap` | ∩ |

### Arrows

| LaTeX | Unicode |
|-------|---------|
| `\to` | → |
| `\leftarrow` | ← |
| `\Rightarrow` | ⇒ |
| `\Leftarrow` | ⇐ |
| `\Leftrightarrow` | ⟺ |
| `\mapsto` | ↦ |

---

## Development

```bash
npm install
npm run build    # compile TypeScript
npm test         # run vitest suite
npm run dev      # build + run
```

---

## License

MIT
