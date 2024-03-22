Running with Bunnies: Google Foobar Level 4 | 1 | 2024-02-11 | foobar,cp

Google Foobar is an invite-only set of programming challenges consisting of 5 progressively harder levels. To participate, you can use the referral code from someone else who has access to it or you may stumble upon the opportunity like I did when Googling technical topics; for example, I searched something relating to convolutional neural networks and got the request to participate in Foobar.

Level 1–3 are fairly straightforward, but I recently completed one of the Level 4 ones that was a little difficult—probably because I'm unfamiliar with graph algorithms. I reiterate the programming problem here and provide my solution.

## The Problem

You and the bunny workers need to get out of this collapsing death trap of a space station—and fast! Unfortunately, some of the bunnies have been weakened by their long work shifts and can't run very fast. Their friends are trying to help them, but this escape would go a lot faster if you also pitched in. The defensive bulkhead doors have begun to close, and if you don't make it through in time, you'll be trapped! You need to grab as many bunnies as you can and get through the bulkheads before they close.

The time it takes to move from your starting point to all of the bunnies and to the bulkhead will be given to you in a square matrix of integers. Each row will tell you the time it takes to get to the start, first bunny, second bunny, ..., last bunny, and the bulkhead in that order. The order of the rows follows the same pattern (start, each bunny, bulkhead). The bunnies can jump into your arms, so picking them up is instantaneous, and arriving at the bulkhead at the same time as it seals still allows for a successful, if dramatic, escape. (Don't worry, any bunnies you don't pick up will be able to escape with you since they no longer have to carry the ones you did pick up.) You can revisit different spots if you wish, and moving to the bulkhead doesn't mean you have to immediately leave—you can move to and from the bulkhead to pick up additional bunnies if time permits.

In addition to spending time traveling between bunnies, some paths interact with the space station's security checkpoints and add time back to the clock. Adding time to the clock will delay the closing of the bulkhead doors, and if the time goes back up to 0 or a positive number after the doors have already closed, it triggers the bulkhead to reopen. Therefore, it might be possible to walk in a circle and keep gaining time: that is, each time a path is traversed, the same amount of time is used or added.

Write a function of the form `solution(times, time_limit)` to calculate the most bunnies you can pick up and which bunnies they are, while still escaping through the bulkhead before the doors close for good. If there are multiple sets of bunnies of the same size, return the set of bunnies with the lowest worker IDs (as indexes) in sorted order. The bunnies are represented as a sorted list by worker ID, with the first bunny being 0. There are at most 5 bunnies, and `time_limit` is a non-negative integer that is at most 999.

For instance, in the case of

```
[
  [0, 2, 2, 2, -1], # 0 = Start
  [9, 0, 2, 2, -1], # 1 = Bunny 0
  [9, 3, 0, 2, -1], # 2 = Bunny 1
  [9, 3, 2, 0, -1], # 3 = Bunny 2
  [9, 3, 2, 2,  0], # 4 = Bulkhead
]
```

and a time limit of 1, the five inner array rows designate the starting point, bunny 0, bunny 1, bunny 2, and the bulkhead door exit respectively. You could take the path:

```
Start End Delta Time Status
- 0  -  1 Bulkhead initially open
0 4 -1  2
4 2  2  0
2 4 -1  1
4 3  2 -1 Bulkhead closes
3 4 -1  0 Bulkhead reopens; you and the bunnies exit
```

With this solution, you would pick up bunnies 1 and 2. This is the best combination for this space station hallway, so the solution is `[1, 2]`. These are the test cases:

```py
solution.solution(
    [
        [0, 1, 1, 1, 1],
        [1, 0, 1, 1, 1],
        [1, 1, 0, 1, 1],
        [1, 1, 1, 0, 1],
        [1, 1, 1, 1, 0]
    ], 3) == [0, 1])

solution.solution(
    [
        [0, 2, 2, 2, -1],
        [9, 0, 2, 2, -1],
        [9, 3, 0, 2, -1],
        [9, 3, 2, 0, -1],
        [9, 3, 2, 2,  0]
    ], 1) == [1, 2]
```

## My Solution

Some immediate observations:

- There are at most 5 bunnies, which indicates that the time complexity of our algorithms don't matter.
- The square matrix is an adjacency matrix for a directed graph with integer weights.
- A negative cycle in the graph implies that all bunnies can be saved.

So my solution is as follows: firstly, run the Bellman–Ford algorithm on the starting point of the graph to detect negative cycles. If one exists, we can save them all by exploiting the cycle, so return all bunnies. If not we precede to run the Floyd–Warshall algorithm to find the shortest distances from each vertex to every other vertex. We then brute force all subsets of the bunnies and consider whether or not we can save them; we do this by iterating over permutations of the subset and considering the distance each permutation would take if considered as a path. We take the minimum distance and say that it is the distance of the subset. If this distance is within the time limit and the subset saves more bunnies then the previous solution, then take note of it. Return the solution.

```py
import itertools

def bellman_ford(graph):
    n = len(graph)
    distances = [0] + [float('inf')] * (n - 1)

    for _ in range(n - 1):
        for u in range(n):
            for v in range(n):
                if distances[u] + graph[u][v] < distances[v]:
                    distances[v] = distances[u] + graph[u][v]

    for u in range(n):
        for v in range(n):
            if distances[u] + graph[u][v] < distances[v]:
                return True
    return False

def solution(times, time_limit):
    # return all bunnies if negative cycle found
    if bellman_ford(times):
        return range(len(times) - 2)

    n_bunnies = len(times) - 2

    # floyd-warshall
    for k in range(len(times)):
        for i in range(len(times)):
            for j in range(len(times)):
                times[i][j] = min(times[i][j], times[i][k] + times[k][j])

    solution = set()
    for subset in range(2**n_bunnies):
        subset = set(i for i in range(n_bunnies) if (subset >> i) & 1)

        # calculate cost/distance of paths
        subset_time = float('inf')
        for path in itertools.permutations(subset):
            path = (-1,) + path + (len(times) - 2,)
            path_time = sum(times[a + 1][b + 1] for a, b in zip(path, path[1:]))
            subset_time = min(path_time, subset_time)

        # if subset is impossible, then skip
        if subset_time > time_limit:
            continue

        # if we find a better solution, note it down
        if len(subset) > len(solution):
            solution = subset

    return sorted(solution)
```

A note: Google Foobar uses Python 2.7, which doesn't yet support the feature of tuple unpacking using an asterisk, so I am forced to use an alternative, uglier notation in the for loop over permutations to construct the path.

```py
path = (-1,) + path + (len(times) - 2,) # used instead of:
# path = (-1, *path, len(times) - 2)
```
