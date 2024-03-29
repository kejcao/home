rep: A Tool for Repeating Commands | 3 | 2022-07-18 | C,linux

When I needed to run a command multiple times, I would wrap that command into a loop.

```bash
for i in {1..10}; do ...; done
```

But it's a bother to type that out just to repeat a command a few times, so I wrote a simple C script that simplifies the process.

```c
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>
#include <stdbool.h>

char *join(char **strs, int len) {
    int lens = 0;
    for(int i=0; i<len; ++i) {
        lens += (strlen(strs[i])+1);
    }
    char *str = malloc(lens);
    for(int i=0; i<len; ++i) {
        strcat(str, strs[i]);
        strcat(str, " ");
    }
    return str;
}

int main(int argc, char **argv) {
    if(argc < 2) {
        fprintf(stderr, "usage: rep [n] cmd\n");
        exit(EXIT_FAILURE);
    }

    char *endptr;
    int repeat = strtol(argv[1], &endptr, 10);
    bool parsable = (*endptr == '\0');

    if(!parsable) {
        repeat = 20;
    }

    if(repeat <= 0) {
        fprintf(stderr, "cannot repeat %s times.\n", argv[1]);
        exit(EXIT_FAILURE);
    }

    /* you can change sh to bash or zsh or whatever other shell. */
    char *cmd[4] = {"sh", "-c", join(
        /* if the first argument is a parsable number, skip it. */
        argv + (parsable ? 2 : 1),
        argc - (parsable ? 2 : 1)
    ), NULL};

    while(repeat--) {
        pid_t pid;
        switch(pid=fork()) {
            case -1:
                perror("fork()");
                exit(EXIT_FAILURE);
            case 0:
                if(execvp(cmd[0], cmd) == -1) {
                    perror("execvp()");
                    exit(EXIT_FAILURE);
                }
                break;
            default: {
                int status;
                if(waitpid(pid, &status, 0) == -1) {
                    perror("waitpid()");
                    exit(EXIT_FAILURE);
                }
            }
        }
    }
}
```

For example,

```bash
$ rep ls # repeat ls 20 times.
$ rep 100 ./exe1 '$(./exe2)' # run exe1 100 times, with its first argument as the output of exe2.
```

If the first argument is fully parsable as an integer, it will be taken as the number of times to repeat. Otherwise, it's treated as the beginning of a command.
