Preventing tmux from Devouring My RAM | 1 | 2024-01-16 | tmux,linux

I use tmux solely to enable scroll and search functionality, since the terminal emulator I drive does not support them. I did originally use alacritty, which has those features built-in, but it had an unacceptable startup latency for my workflow. I have my `!Win+space` key bound to open a terminal, so to launch an application I launch a terminal then run the application as a CLI command. Basically, I launch a lot of terminals and consequently burn through a lot of tmux sessions.

I noticed a while ago that I was eating through my RAM. On investigating further with `top` I realize that an army of `bash` processes were hogging a sizable portion of my swap space. It took me a while to then figure out that these processes were detached tmux sessions. A quick search didn't yield any information on somehow disabling them, so as an ad-hoc bandaid I threw together a quick script to kill all detached sessions.

```bash
#!/bin/bash

tmux ls \
  | grep -v attached \
  | cut -d: -f1 \
  | xargs -t -n1 tmux kill-session -t
```

I would periodically run this script manually, when my RAM usage was uncomfortably high. Certainly, this method isn't robust nor convenient, so after some intense Google searching today I finally found a permanent solution that involves simply turning on a tmux option.

```shell
$ tmux set-option -g destroy-unattached on
```

I wish I'd found this option earlier, damn it.
