# LaTeX to Plain Text — Demo

This file contains various LaTeX math expressions that test the full conversion pipeline.

## Greek Letters

\alpha + \beta = \gamma

\Gamma, \Delta, \Theta, \Lambda, \Xi, \Pi, \Sigma, \Upsilon, \Phi, \Psi, \Omega

## Calculus & Analysis

\int_{0}^{\infty} e^{-x} \, dx = 1

\frac{\partial^2 f}{\partial x^2} + \frac{\partial^2 f}{\partial y^2} = 0

\nabla \cdot \mathbf{F} = \frac{\partial F_x}{\partial x} + \frac{\partial F_y}{\partial y}

## Arrows and Relations

x \to \infty \implies \frac{1}{x} \to 0

A \subset B \subseteq C \implies A \subseteq C

f: \mathbb{R} \to \mathbb{C}

## Fractions and Roots

\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}

\sqrt[3]{x^2 + y^2} \neq \sqrt{x^2} + \sqrt{y^2}

## Sums and Products

\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}

\prod_{k=1}^{n} k = n!

## Set Theory

\{ x \in \mathbb{R} \mid x^2 < 2 \}

A \cap B = \emptyset \implies A \text{ and } B \text{ are disjoint}

## Trigonometry

\sin^2 \theta + \cos^2 \theta = 1

\tan \theta = \frac{\sin \theta}{\cos \theta}

## Limits

\lim_{x \to 0} \frac{\sin x}{x} = 1

\lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n = e

## Matrices

\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}

\det \begin{bmatrix}
1 & 2 \\
3 & 4
\end{bmatrix} = -2

## Aligned Equations

\begin{align}
E &= mc^2 \\
F &= ma \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t}
\end{align}

## Cases

f(x) = \begin{cases}
x^2 & \text{if } x \ge 0 \\
0 & \text{if } x < 0
\end{cases}

## Combinatorics

\binom{n}{k} = \frac{n!}{k! \, (n-k)!}

## Mod

x \equiv y \pmod{n}

## Subscripts and Superscripts

x_1^2 + x_2^2 = r^2

e^{i\pi} + 1 = 0

## Code Blocks

A regular code block:

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

And some inline `code` with **bold** and *italic* formatting.

---

That's all folks!
