Parsing Context-Free Languages | 4 | 2023-09-30 | math,algorithm,python

Given a set of symbols or strings $S$,

\[
\begin{gather*}
    S^0 = \{\epsilon\} \\
    S^1 = S \\
    S^n = \{ab : a \in S^{n-1}, b \in S\}
\end{gather*}
\]

where $\epsilon$ stands for the empty string and multiplying two strings together means concatenating them; e.g. $\{a,b\}^2 = \{aa, ab, ba, bb\}$.

\[
\begin{align*}
    S^* &= \bigcup_{i\geq 0} S^i \\
    S^+ &= \bigcup_{i\geq 1} S^i
\end{align*}
\]

where they're called "Kleene star" and "Kleene plus" respectively—they're sort of like `*` and `+` operators in regex. Clearly $S^* = S^+ \setminus \{\epsilon\}$.

A finite, non-empty set of symbols can be called an alphabet which is denoted by $\Sigma$. A language is just some set $L \subset \Sigma^*$.

We can express a ray from $\vec{o}$ to $\vec{t}$

\[
\vec{p} = \vec{o} + t(\vec{v}-\vec{o})
\]
