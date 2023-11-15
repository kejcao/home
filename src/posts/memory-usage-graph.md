Memory Usage Graphs in Python | 2 | 2023-09-08 | python

As of late I've been writing a raytracer and was rendering polygon meshes composed of millions of triangles so I was interested in how much memory I used and how much I could save by switching to floats (vs using doubles) or making optimizations to how I store my BVH nodes.

I decided to cook up a general purpose script to measure this kind of thing. It's written in Python and pretty straightforward, in fact there's not much to explain. We open a subprocess running the command specified by the user, then query certain files in `/proc` that show memory usage every interval (specified by the user, but by default half a second) and when the subprocess terminates we pop open a Matplotlib graph to show the results.

```py
#!/usr/bin/python3

import argparse
import subprocess
import sys
import time

import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

parser = argparse.ArgumentParser(
    prog='ram.py',
    description='Measure RAM usage of program.',
)
parser.add_argument(
    'cmd', nargs='+',
    help='the command to run'
)
parser.add_argument(
    '-n', '--interval', default=.5, type=float,
    help='wait INTERVAL seconds before querying for RAM'
)
args = parser.parse_args()

with subprocess.Popen(args.cmd) as p:
    rss, vsz = [], []
    try:
        while True:
            with open(f'/proc/{p.pid}/smaps_rollup') as fp:
                fp.readline()
                rss.append(int(fp.readline().split()[1]) / 1024)
            with open(f'/proc/{p.pid}/stat') as fp:
                vsz.append(int(fp.readline().split()[22]) / 1024 / 1024)
            try:
                p.wait(timeout=args.interval)
            except subprocess.TimeoutExpired:
                pass
            else: # no except
                break
    except FileNotFoundError:
        pass

plt.plot([args.interval*i for i in range(len(rss))], rss, label='rss')
plt.plot([args.interval*i for i in range(len(vsz))], vsz, label='vsz')
plt.gca().yaxis.set_major_formatter(ticker.FormatStrFormatter('%d MB'))
plt.ylabel('ram usage')
plt.legend()
plt.show()
```

One thing of note is that it shows both the RSS (resident set size) and VSZ (virtual memory size) usage. RSS is the amount of physical RAM held by the process and VSZ is how much memory the process has used or theoretically has access to, if that makes sense.  Below is a graph drawn by "`ram.py -n .1 ./raytracer`". It renders Stanford's [3D scan](https://graphics.stanford.edu/data/3Dscanrep/) of a dragon—made of roughly a million triangles. I could easily save 100MB of RAM by switching to floats rather than using doubles.

!ram-usage-graph.png
