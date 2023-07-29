Optimizing Starting Times of Bash & Neovim | 4 | 2023-08-02

In [Even Faster Bash Startup](https://work.lisk.in/2020/11/20/even-faster-bash-startup.html) Tomáš Janoušek explains that whenever he needs to pop open a terminal (say to use as a calculator or open Vim as a scratchpad) he presses a keyboard shortcut (in my case this is super key + x) and starts typing into it. Bash starting up slowly (say in 200ms) causes keypresses to not register. This is very annoying indeed. He uses fancy `set` commands to profile his `.bashrc`, but mine isn't very large or complicated so I just but the following code into my `.bashrc`,

```bash
#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

starttime=$(date +%s.%N)

...

endtime=$(date +%s.%N)
echo "in $(bc <<< "($endtime-$starttime)*1000 / 1") ms."
```

I eventually isolated the problem to be the invocation `eval "$(pyenv init -)"` which is used to setup [pyenv](https://github.com/pyenv/pyenv#set-up-your-shell-environment-for-pyenv)—a tool for managing different Python versions—and takes about 100ms. `fzf`, a tool for finding files quickly, takes up ~13ms and since I don't use it often I decided to take it out of my `.bashrc` too. The results of these two prunings is a ~15x speed improvement in load time.

```
$ hyperfine -w3 'bash -i' 'bash --rcfile ~/.bashrc.old -i'
Benchmark 1: bash -i
  Time (mean ± σ):       7.2 ms ±   2.4 ms    [User: 5.1 ms, System: 2.7 ms]
  Range (min … max):     5.3 ms …  15.9 ms    138 runs

Benchmark 2: bash --rcfile ~/.bashrc.old -i
  Time (mean ± σ):     118.6 ms ±   0.9 ms    [User: 89.2 ms, System: 44.1 ms]
  Range (min … max):   116.7 ms … 120.1 ms    24 runs

Summary
  bash -i ran
   16.44 ± 5.58 times faster than bash --rcfile ~/.bashrc.old -i
```

[hyperfine](https://github.com/sharkdp/hyperfine) is a marvelous CLI tool to benchmark the performance of shell commands. I used it above to measure the performance.

A Reddit [post](https://www.reddit.com/r/neovim/comments/opipij/guide_tips_and_tricks_to_reduce_startup_and/) describes ways to get Neovim to startup faster.

[Faster Bash Startup by Daniel Parker.](https://danpker.com/posts/faster-bash-startup/)
