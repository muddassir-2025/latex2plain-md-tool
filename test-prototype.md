chapter 1: calculus review

derivative rules

the derivative of x^n is n x^{n-1} 
example: d/dx (x^3) = 3x^2

important: the chain rule is essential for composite functions

Integration

the fundamental theorem of calculus says:
int_a^b f(x) dx = F(b) - F(a)

def: a definite integral computes the area under a curve between two points

key formulas:
- int x^n dx = x^{n+1} / (n+1) + C
- int 1/x dx = ln|x| + C

here's a quick python function to compute numeric integration:
def trapezoidal_rule(f, a, b, n):
    h = (b - a) / n
    result = (f(a) + f(b)) / 2
    for i in range(1, n):
        result += f(a + i * h)
    return result * h

note: the trapezoidal rule approximates the area under a curve
summary: we covered derivative rules, integration, and numerical methods

Visit https://example.com for more practice problems.
