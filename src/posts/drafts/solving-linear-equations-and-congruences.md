Solving Systems of Linear Equations & Congruences | 4 | 2023-08-31 | math,algorithm,python

To solve the system of linear equations

\[
\begin{align*}
    2x + 7y &= 34 \\
    5x - 4y &= -1
\end{align*}
\]

We can equivalently formulate the statement in terms of a matrix

\[
\begin{pmatrix}
    2 &  7 & 34 \\
    5 & -4 & -1
\end{pmatrix}
\]

Where clearly all the coefficients and other numbers correspond in a straightforward manner. Thus, we can manipulate this matrix by performing elementary row operations, which include:

1. Swapping rows; the position of the rows don't matter—same system.
2. Scaling rows; we can multiply each row by a constant. Think of this as multiplying both sides of an equation by a constant, it doesn't matter—the equality it represents still holds.
3. Adding rows; we can add two rows together. Think of this as adding two linear equations together—adding two things that are equal is still equal.

We can use an algorithm called Gauss–Jordan elimination to solve the system of linear equations. First, we put the matrix into "echelon form," where the coefficients form a triangle of sorts.

\[
\begin{pmatrix}
    2 &  7 & 34 \\
    5 & -4 & -1
\end{pmatrix}
\]


```py
def guass(mat):
    for r1, r2 in zip(mat, mat[1:]):
        assert len(r1) == len(r2)

    # turn to echelon form
    for i in range(len(mat)-1):
        for j in range(i+1, len(mat)):
            if mat[j][i] == 0:
                continue
            r = mat[j][i] / mat[i][i]
            mat[j][i] = 0
            for x in range(i+1, len(mat[0])):
                mat[j][x] -= r*mat[i][x]

    # back substitution
    for i in reversed(range(0, len(mat))):
        if mat[i][i] == 0:
            continue
        mat[i][-1] *= 1 / mat[i][i]
        mat[i][i] = 1
        for j in reversed(range(0, i)):
            mat[j][-1] -= mat[j][i] * mat[i][-1]
            mat[j][i] = 0

    # is it inconsistent?
    for i in range(len(mat)):
        for j, x in enumerate(mat[i][:-1]):
            if j == i:
                if x != 1:
                    return None
            elif x != 0:
                return None
    return mat

for row, solution in zip(guass([
    [ 1,  2, -1,  1,  6],
    [-1,  1,  2, -1,  3],
    [ 2, -1,  2,  2, 14],
    [ 1,  1, -1,  2,  8],
]), [1, 2, 3, 4]):
    assert row[-1] - solution < 1e-16

for row, solution in zip(guass([
    [ 2,  1, -1,   8],
    [-3, -1,  2, -11],
    [-2,  1,  2,  -3],
    [ 0,  0,  0,   0],
]), [2, 3, -1, 0]):
    assert row[-1] - solution < 1e-16

assert guass([
    [3, -1, 2,  2],
    [2,  1, 1, -1],
    [1,  3, 0, -1],
]) == None
```

It is useful to consult an [example](https://en.wikipedia.org/wiki/Gaussian_elimination#Example_of_the_algorithm) while writing the algorithm. Of course, one can use many of the preexisting libraries that has already implemented this, but it is instructive and fun to implement it yourself.

[Wikipedia](https://en.wikipedia.org/wiki/Modular_arithmetic) has an excellent article on modular arithmetic, so read it if you aren't familiar with the subject. But to summarize its section on modular multiplicative inverses, there exists an inverse $a^{-1}$ such that $aa^{-1} = 1 \pmod{n}$ iff $\gcd(a, n) = 1$. By definition of congruences $aa^{-1}-1 = kn$ for some integer $k$ and rearranging we get $aa^{-1} - kn = 1$. Since $a$ and $n$ are coprime, we can use Bézout's theorem to find $a^{-1}$ (and $k$, but that doesn't matter).

A congruence of the form $ax = b \pmod{n}$ is solvable iff $\gcd(a,n) \mid b$. If $\gcd(a,n) = 1$ then we can apply what we learned a paragraph earlier and find the inverse of $a$ so that the solution is $x=a^{-1}b \pmod{n}$. Otherwise, let $g=\gcd(a,n)$, we can reduce the congruence down into the equivalent one $a/g = b/g \pmod{n/g}$ for which $\gcd(a/g, n/g) = 1$ and we can apply our previous technique of finding inverses. The script below does just that.

```py
def gcd(a, b):
    while b:
        a, b = b, a % b
    return a

def xgcd(a, b):
    px, x = 1, 0
    py, y = 0, 1
    while b:
        q = a // b
        px, x = x, px - q*x
        py, y = y, py - q*y
        a, b = b, a % b
    return px, py

def solve(a, b, n):
    '''Solves ax = b (mod n).'''
    assert n > 0
    if b % (g := gcd(a, n)) != 0:
        return ''
    a, b, n = a//g, b//g, n//g
    offset = (b * xgcd(a, n)[0]) % n
    return f'{n}n + {offset}'

assert [solve(*c) for c in [
    ( 6,  3, 7), ( 3,  3, 9), ( 0, 0, 7),
    (10,  0, 6), ( 1,  5, 1), (-1, 3, 5),
    ( 2, -1, 9), ( 3, -5, 9),
]] == [
    '7n + 4', '3n + 1', '1n + 0', '3n + 0',
    '1n + 0', '5n + 2', '9n + 4', ''
]
```

This [PDF](https://www.math.lsu.edu/~adkins/m4181/4181f19ex2reva.pdf) is a great review of certain number theory concepts.
