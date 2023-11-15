*p*-adic Valuation & Legendre's Formula in Haskell | 3 | 2023-08-07 | haskell,math

I recently did a Haskell exercise that involves implementing an infinite list where the $n$th position corresponds to the largest power of 2 that evenly divides $n$. I thought of the following neat, two-line solution.

```haskell
ruler :: [Integer]
ruler = foldr (interleave . repeat) [] [0..]
  where interleave (a:x) y = a : interleave y x
```

I found it by noticing a pattern. See how every 2nd element is 0, every 4th element is 1, every 8th element is 2, and so on. From this I stumbled upon the method of interleaving two infinite lists together infinitely.

```haskell
ghci> take 20 $ ruler
[0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2]
ghci> skip (_:x:xs) = x : skip xs; skip _ = []
ghci> take 20 $ skip $ ruler
[1,2,1,3,1,2,1,4,1,2,1,3,1,2,1,5,1,2,1,3]
ghci> skip (_:_:_:x:xs) = x : skip xs; skip _ = []
ghci> take 20 $ skip $ ruler
[2,3,2,4,2,3,2,5,2,3,2,4,2,3,2,6,2,3,2,4]
```

A more obvious, brute-force solution would've look like

```haskell
ruler = map twos [1..]
  where
    twos n
      | n /= 0 && n `mod` 2 /= 0 = 1 + (twos $ n `div` 2)
      | otherwise                = 0
```

This exercise reminded me of $p$-adic valuation, which is a function in mathematics that returns, for prime $p$, the highest exponent such that this prime raised to it will divide into (that is to say is a factor of) an integer $n$. Wikipedia defines it as

\[
v_p(n) = \begin{cases}
  \max\{k \in \mathbb{N} : p^k \mid n\} & \text{if } n \neq 0 \\
  \infty                                & \text{if } n = 0.
\end{cases}
\]

Note $v_p(n) = v_p(-n)$ which is to say the function is even, since if a number $k$ divides into $n$, then $k$ also divides into $-n$. An implementation of this function in Haskell using the same method of interweaving lists as before looks like

```haskell
ruler :: Int -> [Integer]
ruler p = foldr (interleave p . repeat) [] [0..]
  where
    interleave  p (a:x) y = replicate (p-1) a ++ interleave' p y x
    interleave' p (a:x) y = a : interleave p y x
```

Which to my dismay is significantly less pithy then the one before that can only compute $p=2$. I swear there must exist an easier way to duplicate an element in the first infinite list $p-1$ times while taking only one of the second. I'm still learning the ropes when it comes to Haskell. I wrote a Python script that I'm sure is correct to check the validity of my Haskell implementations.

```py
p = 2
check = eval(input())
for i in range(1, 1001):
    n = 0
    oi = i
    while i%p == 0 and i != 0:
        i //= p
        n += 1
    if n != check[oi-1]:
        raise ValueError(f'{oi-1}: {n} != {check[oi-1]}')
```

BTW in math there's a formula, Legendre's formula, that makes it really easy to calculate the $p$-adic valuation of a factorial.

\[
v_p(n!) = \sum_{i=1}^{\infty} \left\lfloor \frac{n}{p^i} \right\rfloor
\]

Note that eventually $p^i > n$ for all $i$ greater than a certain point, so in Haskell to evaluate the sum in a finite amount of time we take until the result of the floored division between $n$ and $p^i$ is 0, in which case all subsequent divisions will also amount to 0.

```haskell
legendre p n = sum $ takeWhile (/=0) [n `div` p^i | i <- [1..]]
```
