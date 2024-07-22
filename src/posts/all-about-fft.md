DD: FFT | 1 | 2024-07-22 | tags

The Fourier transform is a powerful idea in mathematics and computer science that permits us to decompose a signal into a sum of sine waves.

FFT refers to a broad class of algorithms that can compute DFT in $O(n\log n)$. The most common is Cooley-Tukey and the basic idea is to divide and conquer by splitting the problem into even and odd components. Many forms of Cooley-Tukey exist. I will be describing the radix-2 decimation-in-time FFT variant. Throughout, we assume $N$ is a power of two. Without further ado,

$$
\begin{aligned} 
    X_k &= \sum_{n=0}^{N-1} \omega^{nk}x_n \\
        &= \sum_{\text{even } n} \omega^{nk}x_{n} + \sum_{\text{odd } n} \omega^{nk}x_n \\
        &= \sum_{n=0}^{N/2-1} \omega^{(2n)k}x_{2n} + \sum_{n=0}^{N/2-1} \omega^{(2n+1)k}x_{2n+1} \\
        &= \sum_{n=0}^{N/2-1} \omega^{(2n)k}x_{2n} + \omega^k \sum_{n=0}^{N/2-1} \omega^{(2n)k}x_{2n+1} \\
        &= E_k + \omega^k O_k
\end{aligned}
$$

$E_k$ and $O_k$ essentially do the same thing as $X_k$, they're all summing elements times the powers of the primitive root of unity, but $E_k$ and $O_k$ operate on a restricted subset of the original $N$ elements. In the full algorithm, we would compute $E_k$ and $O_k$ for $k=1,\dotsc,N/2$.

It may be helpful to think of the subscripts as array indices when comparing the math to the following C++ implementation:

```cpp
#include <complex>
#include <vector>

using namespace std;

using C = complex<double>;
const double PI = acos(-1);

void fft(vector<C> &a) {
  int N = a.size();
  if (N == 1) return;

  vector<C> E(N/2), O(N/2);
  for (int k = 0; k < N/2; k++) {
    E[k] = a[2*k];
    O[k] = a[2*k + 1];
  }
  fft(E);
  fft(O);

  C w(1);
  for (int k = 0; k < N/2; k++) {
    a[k] = E[k] + w*O[k];
    a[k + N/2] = E[k] - w*O[k];
    w *= exp(C(1j * -2*PI / N));
  }
}
```
