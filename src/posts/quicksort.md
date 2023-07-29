A Decent Quicksort Function in C | 3 | 2023-04-13 | algorithm,C

We'll be writing a quicksort function whose header file looks like this

```c
#ifndef SORT_H
#define SORT_H

#include <stddef.h>

typedef int (*cmpfn_t)(const void *, const void *);
void sort(void *base, size_t nmemb, size_t size, cmpfn_t cmp);

#endif
```

The header file defines the type `cmpfn_t` as a function pointer that returns an integer and takes two void pointers. You can see the function signature of the `sort` function we'll be implementing; it takes a void pointer to an array, the number of elements in this array, the size of each element, and a function to compare elements. For `cmp(a,b)` it should return an integer less than zero if a<b, equal to zero if a=b, and greater than zero if a>b.

Let's look at a basic implementation

```c
#include "sort.h"

static void swap(char *a, char *b, size_t size) {
    while(size --> 0) {
        char tmp = *a;
        *a++ = *b;
        *b++ = tmp;
    }
}

#define a(i) (base + (i)*size)

void sort(void *base, size_t nmemb, size_t size, cmpfn_t cmp) {
    if(nmemb <= 1) {
        return;
    }

    int i = 0, j = nmemb;
    for(;;) {
        do { ++i; } while(cmp(a(i), base) < 0);
        do { --j; } while(cmp(a(j), base) > 0);
        if(i >= j) {
            break;
        }
        swap(a(i), a(j), size);
    }
    swap(a(j), base, size);

    sort(a(0), j, size, cmp);
    sort(a(j+1), nmemb-j-1, size, cmp);
}
```

We need to be able to swap elements so we define a simple swap function and we also define a simple macro `a(i)` to convert an array index into a pointer to the element by multiplying the index by the size of each element and adding that to the array pointer (which points to the first element).

In the quicksort function, an array of zero or one elements is already sorted so we just return. The partitioning happens by "collapsing the walls" or constricting the two pointers `i` in the forward direction and `j` in the backward direction until they intersect or pass each other by, in which case we break out of the loop since the array is partitioned. We're using the first element as the pivot, so in the `for` loop we first increment `i` while the element at `i` is smaller than the first element (the pivot)—basically we're advancing `i` until the element at `i` is in the wrong place, aka it's greater than the pivot. Similar logic for the loop with `j` but in the opposite direction. When both `i` and `j` are pointing to elements in the wrong places, we swap them, placing them in the right places.

At the end everything to the left of `j` should be smaller than or equal the first element (the pivot) and everything to the right should be bigger. We swap `j` with the first element (the pivot) so the pivot is in the middle and we recursively sort everything to the left and to the right of `j` (where the pivot is now).

I wrote this program to test the sorting function

```c
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include "sort.h"

#define LEN (2<<14)

void swap(int *a, int *b) {
    int *c = a;
    *a = *b;
    *b = *c;
}

int cmpint(const void *a, const void *b) {
    return *(int *)a - *(int *)b;
}

/* completely random */
#define T1()                   \
    for(int i=0; i<LEN; ++i) { \
        a[i] = rand();         \
    }

/* nearly sorted */
#define T2()                            \
    for(int i=0; i<LEN; ++i) {          \
        a[i] = i;                       \
        if(i != 0 && rand()%256 == 0) { \
            swap(&a[i], &a[i-1]);       \
        }                               \
    }                                   \

/* sorted in reverse */
#define T3()                   \
    for(int i=0; i<LEN; ++i) { \
        a[i] = LEN-i;          \
    }

/* random with some uniques */
#define T4()                    \
    for(int i=0; i<LEN; ++i) {  \
        a[i] = rand() % (LEN/5) \
    }

/* pipe organ */
#define T5()                       \
    for(int i=0; i<LEN/2; ++i) {   \
        a[i] = i;                  \
    }                              \
    for(int i=LEN/2; i<LEN; ++i) { \
        a[i] = LEN-i;              \
    }                              \


int main(void) {
    //srand(time(NULL));

    int *a = malloc(sizeof(int) * LEN);

    T2();

    sort(a, LEN, sizeof(int), cmpint);
    //qsort(a, LEN, sizeof(int), cmpint);
}
```

You can uncomment the `srand` line to get new random numbers each time you run the program and you can uncomment the `qsort` line to test stdlib's sort function instead of ours. For me, I'm pretty sure that that's the glibc implementation. You can switch the `T2()` line with the other macros, they generate different pathological inputs—that is, specific inputs that are purposefully designed to make an algorithm run slower than it usually does. For example, quicksort runs on average $O(n\log n)$ but on pathlogical inputs it runs closer to $O(n^2)$.

On my computer running the program takes 1 second, we can reduce that to 7 milliseconds by choosing a wiser pivot, because consider what our function is doing on a nearly sorted array: it's taking 0 as a pivot and sorting everything to the right of it, then it chooses 1 as a pivot and sorts everything to the right of that, then it chooses 2 as a pivot and sorts everything to the right of that, and so on. We get $O(n^2)$ performance rather than our expected $O(n\log n)$. We can prevent this by choosing the element at the middle as the pivot but then the reverse sort and pipe organ array stymies the function in a similar way. The solution is to estimate the median of an array by choosing the median out of the first, middle, and last element.

```c
static void *med3(void *a, void *b, void *c, cmpfn_t cmp) {
    return cmp(a,b) < 0
        ? (cmp(a,c) < 0 ? (cmp(b,c) < 0 ? b : c) : a)
        : (cmp(a,c) < 0 ? a : (cmp(b,c) < 0 ? c : b));
}

void sort(void *base, size_t nmemb, size_t size, cmpfn_t cmp) {
    if(nmemb <= 1) {
        return;
    }

    if(nmemb > 16) {
        swap(base, med3(base, a(nmemb/2), a(nmemb-1), cmp), size);
    } else {
        swap(base, a(nmemb/2), size);
    }

    int i = 0, j = nmemb;
    for(;;) {
        do { ++i; } while(cmp(a(i), base) < 0);
        do { --j; } while(cmp(a(j), base) > 0);
        if(i >= j) {
            break;
        }
        swap(a(i), a(j), size);
    }
    swap(a(j), base, size);

    sort(a(0), j, size, cmp);
    sort(a(j+1), nmemb-j-1, size, cmp);
}
```

We have a new `med3` function that takes three elements and chooses the median out of them. If we have less than 16 elements than we can just choose the middle as the pivot; otherwise we become more sophisticated with our choice and choose the median out of the first, middle, and last element. We choose a pivot by swapping the pivot with the first element, since our algorithm uses the first element as the pivot.

This is better, but it still chokes on the pipe organ input. When we have more than 32 elements we can be yet more sophisticated with our approach and choose the "ninther," the median of medians—look at the code below

```c
void sort(void *base, size_t nmemb, size_t size, cmpfn_t cmp) {
    if(nmemb <= 1) {
        return;
    }

    if(nmemb > 32) {
        size_t unit = nmemb/8;
        swap(base, med3(
            med3(a(unit*0), a(unit*1), a(unit*2), cmp),
            med3(a(unit*3), a(unit*4), a(unit*5), cmp),
            med3(a(unit*6), a(unit*7), a(unit*8-1), cmp), cmp), size);
    } else if(nmemb > 16) {
        swap(base, med3(base, a(nmemb/2), a(nmemb-1), cmp), size);
    } else {
        swap(base, a(nmemb/2), size);
    }

    int i = 0, j = nmemb;
    for(;;) {
        do { ++i; } while(cmp(a(i), base) < 0);
        do { --j; } while(cmp(a(j), base) > 0);
        if(i >= j) {
            break;
        }
        swap(a(i), a(j), size);
    }
    swap(a(j), base, size);

    sort(a(0), j, size, cmp);
    sort(a(j+1), nmemb-j-1, size, cmp);
}
```

We find the median of 9 evenly spaced elements in our array by finding the median three elements three times then finding the median of that. Thus the name median of medians.

One final optimization is to switch to insertion sort for arrays with smaller elements since quicksort and recursion is a little too heavy-handed for an array of 4 or 5 elements.

```c
static void isort(void *base, size_t nmemb, size_t size, cmpfn_t cmp) {
    for(void *pi = base + size; pi < base + nmemb*size; pi+=size) {
        for(void *pj = pi; pj > base && cmp(pj, pj-size) < 0; pj-=size) {
            swap(pj, pj-size, size);
        }
    }
}

void sort(void *base, size_t nmemb, size_t size, cmpfn_t cmp) {
    if(nmemb < 8) {
        isort(base, nmemb, size, cmp);
        return;
    }

    if(nmemb > 32) {
        size_t unit = nmemb/8;
        swap(base, med3(
            med3(a(unit*0), a(unit*1), a(unit*2), cmp),
            med3(a(unit*3), a(unit*4), a(unit*5), cmp),
            med3(a(unit*6), a(unit*7), a(unit*8-1), cmp), cmp), size);
    } else if(nmemb > 16) {
        swap(base, med3(base, a(nmemb/2), a(nmemb-1), cmp), size);
    } else {
        swap(base, a(nmemb/2), size);
    }

    int i = 0, j = nmemb;
    for(;;) {
        do { ++i; } while(cmp(a(i), base) < 0);
        do { --j; } while(cmp(a(j), base) > 0);
        if(i >= j) {
            break;
        }
        swap(a(i), a(j), size);
    }
    swap(a(j), base, size);

    sort(a(0), j, size, cmp);
    sort(a(j+1), nmemb-j-1, size, cmp);
}
```

The insertion sort works as you'll expect, but it uses pointers instead of indices. Basically we loop on `pi` from the second element until the last and at each iteration we loop from `pi` to the first element and while our element isn't in the right place, we swap it.

The constants I chose here like 8 or 16 or 32 are completely arbitrary and I haven't tested them to see if better ones are available. Also, I'm not sure I covered all the edgecases and pathological inputs. If you spot any mistakes give me an email. In total the code looks like this

```c
#include "sort.h"

static void swap(char *a, char *b, size_t size) {
    while(size --> 0) {
        char tmp = *a;
        *a++ = *b;
        *b++ = tmp;
    }
}

static void isort(void *base, size_t nmemb, size_t size, cmpfn_t cmp) {
    for(void *pi = base + size; pi < base + nmemb*size; pi+=size) {
        for(void *pj = pi; pj > base && cmp(pj, pj-size) < 0; pj-=size) {
            swap(pj, pj-size, size);
        }
    }
}

static void *med3(void *a, void *b, void *c, cmpfn_t cmp) {
    return cmp(a,b) < 0
        ? (cmp(a,c) < 0 ? (cmp(b,c) < 0 ? b : c) : a)
        : (cmp(a,c) < 0 ? a : (cmp(b,c) < 0 ? c : b));
}

#define a(i) (base + (i)*size)

void sort(void *base, size_t nmemb, size_t size, cmpfn_t cmp) {
    if(nmemb < 8) {
        isort(base, nmemb, size, cmp);
        return;
    }

    if(nmemb > 32) {
        size_t unit = nmemb/8;
        swap(base, med3(
            med3(a(unit*0), a(unit*1), a(unit*2), cmp),
            med3(a(unit*3), a(unit*4), a(unit*5), cmp),
            med3(a(unit*6), a(unit*7), a(unit*8-1), cmp), cmp), size);
    } else if(nmemb > 16) {
        swap(base, med3(base, a(nmemb/2), a(nmemb-1), cmp), size);
    } else {
        swap(base, a(nmemb/2), size);
    }

    int i = 0, j = nmemb;
    for(;;) {
        do { ++i; } while(cmp(a(i), base) < 0);
        do { --j; } while(cmp(a(j), base) > 0);
        if(i >= j) {
            break;
        }
        swap(a(i), a(j), size);
    }
    swap(a(j), base, size);

    sort(a(0), j, size, cmp);
    sort(a(j+1), nmemb-j-1, size, cmp);
}
```

I measured the performance of our homemade sort function and stdlib's sort function (probably glibc's implementation). I compiled with `-O3` and ran `perf stat -r 5 ./a.out` which basically measures the time it took to run `./a.out`, repeats that measurement 5 times, then averages the run times. I compiled 10 executables, testing the 5 different inputs on both our function and stdlib's.

<table>
    <tr>
        <td></td>
        <th>mine</th>
        <th>stdlib</th>
    </tr>
    <tr>
        <th>T1() random</th>
        <td>1.39s</td>
        <td>1.47s</td>
    </tr>
    <tr>
        <th>T2() sorted</th>
        <td>0.50s</td>
        <td>0.44s</td>
    </tr>
    <tr>
        <th>T3() sorted reversed</th>
        <td>0.47s</td>
        <td>0.35s</td>
    </tr>
    <tr>
        <th>T4() with uniques</th>
        <td>1.32s</td>
        <td>1.46s</td>
    </tr>
    <tr>
        <th>T5() pipe organ</th>
        <td>0.71s</td>
        <td>0.34s</td>
    </tr>
</table>

From this table we can see our algorithm runs slightly faster on completely random inputs but slower on pathological ones.

Some good resources on quicksort are:

- [Lecture slides on quicksort](https://web.ecs.syr.edu/~royer/cis675/slides/07engSort.pdf).
- The original paper on ninther (median of medians) is John W. Tukey's ["The Ninther, a Technique for Low-Effort Robust (Resistant) Location in Large Samples"](https://sci-hub.se/10.1016/b978-0-12-204750-3.50024-1).
- A paper [arXiv:1904.01009 \[cs.PL\]](https://arxiv.org/abs/1904.01009) which among other algorithms has a couple good implementations of quicksort.
- glibc source code implements quicksort at [stdlib/qsort.c](https://elixir.bootlin.com/glibc/latest/source/stdlib/qsort.c).
