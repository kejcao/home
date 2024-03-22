Dynamic Programming 101 | 1 | 2024-02-25 | tags

Dynamic programming is a method to optimize recursive brute-force algorithms by taking advantage of overlapping subproblems. It was developed by Richard E. Bellman and is called "[dynamic programming](https://en.wikipedia.org/wiki/Dynamic_programming#History_of_the_name)" because Richard wished to hide the fact that he was conducting mathematical research from a gentleman in Washington named Wilson, who had a pathological fear of research. The word "dynamic" is to convey that it is multistage and time-varying. In addition, Richard chose the name because it sounded impressive and is reminiscent of the term "linear programming," also a form of mathematical optimization.


Let's consider a problem: Say we have $n$ coins $C=\{c_1,\dotsc,c_n\}$ worth $c_i$ each. What is the size of the smallest subset of $C$ that sums to a number $s$? Is it possible to form such a subset?

$$ T(0) = 0, \\ T(n) = \min \big\{ T(n-c) \mid c \in C \cup \{\infty\} \big\} + 1. $$

You should convince yourself that the recurrence relation is true. Go through an example or two. In Python, a direct translation:

```py
C = set({1, 2, 3})
def T(n):
    if n == 0:
        return 1
    return min(*[T(n - c) for c in C if n - c >= 0], float("inf")) + 1

T(6)
```


Floyd-Warshall

Let $f(i,j,V)$ denote the shortest path from $i$ to $j$ using only vertices in $V$. Then,

$$f(i,j,\emptyset) = w(i,j), \\ f(i,j,V \cup \{v\}) = \min \big\{ f(i,j,V), f(i,v,V) + f(v,j,V)\big\}.$$

results in $O(|V|^3)$ to find shortest paths between every vertex to every vertex using dynamic programming.

```py
for k in range(len(graph)):
    for i in range(len(graph)):
        for j in range(len(graph)):
    	    graph[i][j] = min(graph[i][j], graph[i][k] + graph[k][j])
```

