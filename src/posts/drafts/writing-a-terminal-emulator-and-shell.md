Writing a Shell in Python | 3 | 2023-08-20 | python,shell,terminal emulator

It is surprisingly easy to write a simple shell in Python. `shlex` (shell lexical analysis) is a built-in Python module that splits a string using shell-like syntax. The second parameter toggles whether or not to parse comments. In C you would've had to done all that yourself and it would've been at least 20 lines. It forks the command and if we're the child process (in which case `fork()` returns 0) we execute it and quit. If we're the parent we wait for the child to finish before continuing to repeat this REPL process indefinitely.

```py
import os
import readline
import shlex

while True:
    cmd = shlex.split(input('$ '), True)

    if (pid := os.fork()) == 0:
        os.execvp(cmd[0], cmd)
        quit()
    else:
        os.waitpid(pid, 0)
```

Only 11 lines—8 lines if we don't count empty lines and the unnecessary `readline` import—yet we got a not-too-shabby shell that supports comments and quotes. A fatal flaw is however that the very important `cd` command doesn't work, along with other universal features like piping, redirection, and backgrounding. Also, in the code we aren't doing any error checking which is lame.

```
$ ls # comments too!
main.py  mini.py
$ echo 'quotes work'
quotes work
$ cd ..
Traceback (most recent call last):
  File "/home/kjc/py/tks/mini.py", line 9, in <module>
    os.execvp(cmd[0], cmd)
  File "<frozen os>", line 574, in execvp
  File "<frozen os>", line 616, in _execvpe
  File "<frozen os>", line 607, in _execvpe
FileNotFoundError: [Errno 2] No such file or directory
```

I believe if `os.fork()` and other assorted commands fail they would raise an exception so I don't need to check the return code. With just a few extra lines of code—about 110 more to be precise—we can add common shell constructs and error checking.

```py
import itertools
import os
import readline
import shlex
import signal
import sys

readline.parse_and_bind('tab: complete')

def prompt():
    def error(msg: str):
        print(f'tks: {msg}', file=sys.stderr)

    def spawn(cmd: list[str],
        read: int|None=None,
        write: int|None=None
    ) -> int:
        if (pid := os.fork()) == 0:
            def helper(delim: str) -> list[str]:
                a = []
                try:
                    while True:
                        a.append(cmd[i := cmd.index(delim) + 1])
                        del cmd[i-1:i+1]
                except (ValueError, IndexError):
                    pass
                return a
            ins, outs = helper('<'), helper('>')

            for fp in ins:
                os.dup2(fd := os.open(fp, os.O_RDONLY), 0)
                os.close(fd)
            for fp in outs:
                os.dup2(fd := os.open(
                    fp, os.O_CREAT|os.O_TRUNC|os.O_WRONLY,
                    0o644
                ), 1)
                os.close(fd)

            if read is not None:
                os.dup2(read, 0)
                os.close(read)
            if write is not None:
                os.dup2(write, 1)
                os.close(write)

            try:
                os.execvp(cmd[0], cmd)
            except FileNotFoundError:
                error(f'{cmd[0]}: command not found')
            sys.exit()
        return pid

    def try_builtin(cmd: list[str]) -> bool:
        if cmd[0] == 'cd':
            try:
                if len(cmd) > 2:
                    error('too many arguments')
                    return True
                if len(cmd) == 1:
                    cmd.append('~')
                os.chdir(os.path.expanduser(cmd[1]))
            except FileNotFoundError as e:
                error(str(e))
            return True
        return False

    # loop through semicolon seperated cmds
    for cmd in [
        list(x)
        for flag, x in itertools.groupby(
            shlex.shlex(
                input(f'{os.getlogin()}$ '),
                posix=True, punctuation_chars=';>|'
            ),
            lambda x: x == ';'
        ) if not flag
    ]:
        # if cmd empty or cmd is a built-in command
        if not cmd or try_builtin(cmd):
            continue

        try:
            # handle pipes if we have to
            if len(cmds := [
                list(x)
                for flag, x in itertools.groupby(
                    cmd, lambda x: x == '|'
                ) if not flag
            ]) > 1:
                # ignore broken pipe errors that might arise
                signal.signal(signal.SIGPIPE, lambda *_: ...)

                pids = []
                last = None
                for i in range(len(cmds)):
                    read, write = os.pipe()
                    pids.append(spawn(cmds[i], read=last, write=write if i != len(cmds)-1 else None))
                    os.close(write)
                    if last is not None:
                        os.close(last)
                    last = read
                os.close(last)
                for p in pids:
                    os.waitpid(p, 0)
            else:
                os.waitpid(spawn(cmd), 0)
        except FileNotFoundError as e:
            error(str(e))
            continue

try:
    while True:
        try:
            prompt()
        except KeyboardInterrupt:
            print()
except EOFError:
    print()
```

We can do cool things like IO redirection, piping, and separating commands with semicolons. See the shell session with this spanking-new shell below.

```
kjc$ ls
main.py  mini.py
kjc$ cat <mini.py | wc -l
12
kjc$ ls|sort >results; shuf results
mini.py
main.py
results
kjc$ tr </dev/random -cd '[:alnum:]' | head -c32; echo
KH3PVHM1A8FhLZnNqjQPIghU9sqH04kZ
kjc$ asdf
tks: asdf: command not found
```

I was going to add background processes to it as well but I'm not quite sure how to do that and it was going to inflate the number of lines quite substantially.
