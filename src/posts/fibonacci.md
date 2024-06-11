Calculating the 1 Billionth Fibonacci Number in 8 Seconds | 1 | 2024-06-09 | math,algo,py

The Fibonacci sequence was popularized in Western Europe by Leonardo of Pisa, where he used it to model rabbit population growth in his 1202 book *Liber Abaci*. However, the sequence was already known by Indian mathematicians as early as 200 BC, when it was used to enumerate possible patterns of Sanskrit poetry.

The Fibonacci sequence is defined by a simple recurrence, where the $n$th Fibonacci number is $F_n = F_{n-1} + F_{n-2}$. The function which implements this recurrence in code is often used to demonstrate the dynamic programming technique called memoization, which can be applied to the function resulting in dramatic speedups. A straightforward implementation of this function in Python is trivial:

```py
import functools

@functools.cache
def fib(n):
    match n:
        case 0: return 0
        case 1: return 1
    return fib(n-1) + fib(n-2)
```

Looking at this recursive function and the corresponding recurrence, we notice that it's a waste of memory to memoize $O(n)$ numbers when it's only necessary to remember the previous two Fibonacci numbers to calculate the next one. An iterative approach is not only faster than recursion, but also much more memory efficient.

```py
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

It will be useful for us to view the above function in a certain way. The code inside the for loop can be thought of as applying a linear map $T : \mathbb{R}^2 \to \mathbb{R}^2$ to the two variables $a$ and $b$, transforming them into two new numbers. This linear map is defined with $Tv = (v_2, v_1+v_2)$. An example of this in code may help with your understanding, where we separate out and define $T$ explicitly:

```py
def fib(n):
    T = lambda v: (v[1], v[0] + v[1])
    v = (0, 1)
    for _ in range(n):
        v = T(v)
    return v[0]
```

This is useful because we can now find the matrix representation of this linear map $T$ by finding the values of $T$ for the basis vectors of $\mathbb{R}^2$, the domain of $T$.

$$
\begin{aligned}
    T(1,0) &= (0,1+0) = (0,1) \\
    T(0,1) &= (1,0+1) = (1,1)
\end{aligned}
\implies
Tv = \begin{pmatrix}
    0 & 1 \\
    1 & 1 
\end{pmatrix}v
$$

Confusingly, we can also construct another map $Tv = (v_1 + v_2, v_1)$ which is almost the same as the previous map but swaps the position. This results in a slightly different matrix, which seems to be more standard in literature than the first for some reason.

$$
\begin{aligned}
    T(1,0) &= (1+0,1) = (1,1) \\
    T(0,1) &= (0+1,0) = (1,0)
\end{aligned}
\implies
Tv = \begin{pmatrix}
    1 & 1 \\
    1 & 0 
\end{pmatrix}v
$$

The matrix for $T$, containing all ones except for the bottom-right corner which is a zero, is a very special matrix called the [Fibonacci $Q$-matrix](https://mathworld.wolfram.com/FibonacciQ-Matrix.html). Note that multiplying the matrix $Q^k$ by the initial vector containing the first two Fibonacci numbers $(F_1,F_0) = (1,0)$ simply yields $Q^k (1,0)^T = (F_{n+1},F_n)^T$.

The corresponding code using this new map $T$ would look like this:

```py
def fib(n):
    T = lambda v: (v[0] + v[1], v[0])
    v = (1, 0)
    for _ in range(n):
        v = T(v)
    return v[1]
```

In fact, we can directly exponentiate the $Q$-matrix to get the $n$th Fibonacci number. We have this equation:

$$
Q^k = \begin{pmatrix}
    1 & 1 \\
    1 & 0 
\end{pmatrix}^k = \begin{pmatrix}
    F_{n+1} & F_n \\
    F_n & F_{n-1}
\end{pmatrix}
$$

Therefore, a faster algorithm to find the $F_n$ involves calculating the $n$th power of $Q$. This can be computed in $O(\log n)$ time using binary exponentiation.

```py
import numpy as np

def fib(n):
    Q = np.array([[1,1],[1,0]], dtype=object)
    return np.linalg.matrix_power(Q, n)[0,1]
```

It seems wasteful to exponentiate the entire 2x2 matrix when we only need one of the entries. Can we avoid the unnecessary computation? Because matrix multiplication is associative, we can think of $Q^{2n}$ in two ways: $Q^{(2n)}$ and $(Q^n)^2$. This gives us the following equality:

$$
\begin{pmatrix}
    F_{2n+1} & F_{2n} \\
    F_{2n} & F_{2n-1}
\end{pmatrix} = Q^{2n} =
\begin{pmatrix}
    F_{n+1} & F_{n} \\
    F_{n} & F_{n-1}
\end{pmatrix}^2
$$

By explicitly multiplying the matrix on the right-hand side by itself and matching its entries with those of the matrix on the left-hand side, we obtain a couple identities involving the Fibonacci numbers.

$$
\begin{aligned}
    F_{2n+1} &= F_{n+1}^2 + F_n^2 \\
    F_{2n} &= F_{n+1}F_n + F_nF_{n-1}
\end{aligned}
$$

Firstly, note that,

$$
\begin{aligned}
    &\hphantom{\implies}\,\, F_{n} = F_{n-1} + F_{n-2} \\
    &\implies F_{n+1} = F_n + F_{n-1} \\
    &\implies F_{n+1} - F_n = F_{n-1}
\end{aligned}
$$

Therefore, we can rewrite the second identity, replacing $F_{n-1}$.

$$
\begin{aligned}
    F_{2n} &= F_{n+1}F_n + F_nF_{n-1} \\
    &= F_n (F_{n+1} + F_{n-1}) \\
    &= F_n (F_{n+1} + (F_{n+1} - F_n)) \\
    &= F_n (2F_{n+1} - F_n)
\end{aligned}
$$

With these two identities, we can express $F_{2n}$ and $F_{2n+1}$ solely in terms of $F_n$ and $F_{n+1}$. Let's abbreviate these Fibonacci numbers with single-letter variables.

$$
    a,b := F_n, F_{n+1} \\
    c := F_{2n} = a (2b - a) \\
    d := F_{2n+1} = b^2 + a^2
$$

Given this, it's easy to derive concise and fast code to calculate the $n$th Fibonacci number. In the Python code below, I use GMP to speedup integer arithmetic.

```py
from gmpy2 import mpz

def fib(n):
    if n == 0:
        return (mpz(0), mpz(1))

    (a, b) = fib(n // 2)
    c = a * (2*b - a)
    d = a**2 + b**2

    if n % 2 == 0:
        return (c, d)
    return (d, c + d)
```

Running the code,

```py
n = fib(1_000_000_000)[0]
print(n, file=open('out', 'w'))
```

It takes 8.6 seconds to calculate the 1 billionth Fibonacci number and 38.4 seconds for the I/O. The result is a 208,987,641 digit number stored in a 200 MB file. I verified the digit count, it matches estimates I received from calculating the log10 of Binet's formula. 

Speaking of Binet's formula, how does one derive that? Well, there are two ways: Examining the eigendecomposition of the $Q$-matrix or using generating functions. Rather than explaining them here, for more information see the [Wikipedia article](https://en.wikipedia.org/wiki/Fibonacci_sequence#Matrix_form) on the Fibonacci sequence.

Note that many of the things discussed in this blog post is generalizable to linear recurrences in general.
