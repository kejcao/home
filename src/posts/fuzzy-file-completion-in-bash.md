Fuzzy File Completion in Bash | 2 | 2023-07-31 | linux,bash,C,algorithm

A shell is basically a computer program that allows users to run other computer programs, which do different things depending on the inputs one gives it in the form of arguments. I use one of these shells called Bash and often I have the need to refer to a file or directory so the program I'm running can perform some action on it. To ease the strain of typing out a path/filename in full I can press the "tab" key to let Bash attempt to fill in (that is, complete) the filename for me. In the GIF below, you can see Bash tab completion in action.

!regular-bash-file-completion-demo.gif

I had to press tab 3 times to complete the filename "`a-file-with-a-really-long-name3`." This is because Bash tab completion strictly matches prefixes. Projects like [fzf](https://github.com/junegunn/fzf#fuzzy-completion-for-bash-and-zsh) and [peco](https://github.com/peco/peco) offer fuzzy completion, which means they use more forgiving and smarter matching algorithms. Think of fuzzy file completion as Google searching your files—the algorithms tolerate typos and words written in the wrong order. None of them (to my knowledge) integrate very naturally with Bash tab completion. With fzf one has to press Ctrl+T to fuzzy complete files, double asterisks then tab to fuzzy complete, and Alt+C to jump to directories. They also have a more interactive and disruptive interface, as shown in the GIF below.

!fzf-bash-file-completion-demo.gif

I wanted to try out fuzzy file completion that integrates with Bash tab completion nicely. I took a took a peek at Bash's source code and to see if I could hard-code fuzzy file completion into it. I did manage it, but the code to do this is quite messy, since in the process of hijacking some of the functions responsible for file completion the code inadvertently messes other parts of the code up, so I had to use an ugly global variable, but I'll spare you the details of that.

Essentially, the function `rl_completion_matches` (which is [here](https://github.com/bminor/bash/blob/master/lib/readline/complete.c#L2198)) is responsible for all Bash—or more generally GNU readline, the library Bash is using for input—completion. It has a few notable variables: `match_list` is a dynamically allocated, null-terminated list of filenames (each element is an allocated string); `matches` is the size of this list; `text` is the user input; and `entry_function` is the function which is to be used to find whether a match matches. In this function somewhere I laid my own code, the code you see below.

```c
if (matches && text[0] != '\0')
  if (entry_function == rl_filename_completion_function)
    {
      int score[matches + 1], max = 0;
      for (int i = 1; match_list[i]; ++i)
        {
          score[i] = fuzzy_match (match_list[i], text);
          max = max > score[i] ? max : score[i];
        }

      int j = 0;
      for (int i = 1; match_list[i]; ++i)
        if (score[i] > max - 6)
          match_list[++j] = match_list[i];
        else
          xfree (match_list[i]);
      match_list[j+1] = NULL;
      matches = j;
    }
```

Which checks to make sure we do have matches and that we're matching filenames instead of usernames, variables, etc. I loop through the matches and save the score my `fuzzy_match` function produces, which measures how close two strings are. It also saves the biggest score. Then we loop through the matches again but this time we first check that the score is bigger than 8, just to weed out the filenames that obviously don't match; then we make sure that this score is bigger then the biggest score minus some threshold, which I chose to be 6. Otherwise the filename doesn't match—we free and remove it from the list.

Throughout this post you may notice that the code is not written in my usual style. This is because I was trying my darnedest to comply and imitate the GNU coding style, which is what Bash conforms to. Before undergoing this project I thought that the GNU style is abhorrent—with its ludicrous way of formatting curly braces—but I say writing all this code in it, the style is growing on me. There is an elegance to it. Anyway,

I still haven't explained how the `fuzzy_match` function is implemented. I tried a few different approaches. My first attempt was to use TRE, a regex library for fast approximate (that is to say fuzzy) string matching. I believe it uses the bitap algorithm, which returns Levenshtein distance.

```c
#include <tre/tre.h>

static int
fuzzy_match (const char *s1, const char *s2)
{
  char query[strlen (s2) + 5];
  query[0] = '^';
  strcpy (query + 1, s2);
  strcpy (query + strlen (s2) + 1, ".*$");

  regex_t r;
  tre_regcomp (&r, query, REG_EXTENDED);
  static regaparams_t params = {
    .cost_ins = 1,
    .cost_del = 10,
    .cost_subst = 10,
    .max_cost = 100,
    .max_del = 100,
    .max_ins = 100,
    .max_subst = 100,
    .max_err = 100,
  };
  regamatch_t match = { 0 };
  if (tre_regaexec (&r, s1, &match, params, 0) || match.cost > 8)
    return 0;
  return 1;
}
```

It barely worked. I tried fine-tuning the parameters, but the matches continued to be horrible. Note that this is an earlier function, which used a different method to hijack file completion, so we return a bool representing whether to keep the match or not instead of an integer score. I tried a handwritten Damerau–Levenshtein distance function next.

```c
static int
min (int a, int b, int c, int d)
{
  a = a < b ? a : b;
  a = a < c ? a : c;
  a = a < d ? a : d;
  return a;
}

static int
damerau_levenshtein_distance (const char *s1, const char *s2)
{
  int a[strlen (s1) + 2][strlen (s2) + 2];
  a[0][0] = strlen (s1) + strlen (s2);
  for (int i = 0; i < strlen (s1) + 2; ++i)
    {
      a[i][0] = a[0][0];
      a[i][1] = i;
    }
  for (int i = 1; i < strlen (s2) + 2; ++i)
    {
      a[0][i] = a[0][0];
      a[1][i] = i;
    }

  int alphabet[256] = {0};

  for (int i = 0; i < strlen (s1); ++i)
    {
      int l = 0;
      for (int j = 0; j < strlen (s2); ++j)
        {
          int cost = 1;
          if (s1[i] == s2[i])
            {
              l = j;
              cost = 0;
            }
          int ai = i+2, aj = j+2;
          int k = alphabet[s2[j]];
          a[ai][aj] = min (
            a[ai-1][aj-1] + cost,               // substitution
            a[ai  ][aj-1] + 1,                  // deletion
            a[ai-1][aj  ] + 1,                  // insertion
            a[k-1][l-1] + (i-k-1) + 1 + (j-k-l) // transposition
          );
        }
      alphabet[s1[i]] = i;
    }
  return a[strlen (s1) + 1][strlen (s2) + 1];
}
```

Unfortunately, that didn't work out very well either. I decided to do some research, which is to say I took a look at what algorithm fzf uses. It turns out they use a modified Smith–Waterman algorithm implemented in Go. I don't know any Go, so I followed (basically wrote a straightforward copy) the Wikipedia article's [description](https://en.wikipedia.org/wiki/Smith%E2%80%93Waterman_algorithm#Algorithm) of the algorithm, I neglected to implement the fourth step, traceback, since that is unnecessary. I modified it such that

1. Strings are compared case-insensitively. Hyphens and underscores are equated.
2. All text in the user input must be present in the filename.
3. It prefers prefix matches—matches at the beginning of the string—and matches immediately after a dot or space.

Note that my implementation of the algorithm uses a linear gap penalty, so it can be slightly simplified as stated by the Wikipedia [article](https://en.wikipedia.org/wiki/Smith%E2%80%93Waterman_algorithm#Linear).

```c
#include "bashline.h"

static int
max (int a, int b)
{
  return a > b ? a : b;
}

static int
max4 (int a, int b, int c, int d)
{
  return max(max(max(a, b), c), d);
}

// `s1` is user input and `s2` is a filename both of which should be basenames,
// not full paths. It uses a modified Smith–Waterman algorithm to fuzzy match.
static int
smith_waterman (const char *s1, const char *s2)
{
  // strictly match hidden files.
  if (s1[0] == '.' && s2[0] != '.'
  ||  s1[0] != '.' && s2[0] == '.')
    return INT_MIN;
  // always match empty `s1`.
  if (s1[0] == '\0')
    return INT_MAX;

  // the star attaction: the Smith–Waterman algorithm.
  int a[strlen (s1) + 1][strlen (s2) + 1];
  for (int i = 0; i < strlen (s1) + 1; ++i)
    a[i][0] = 0;
  for (int i = 0; i < strlen (s2) + 1; ++i)
    a[0][i] = 0;

  bool matched[strlen (s1)];
  memset (matched, false, strlen (s1));
  int score = 0;
  for (int i = 1; i < strlen (s1) + 1; ++i)
    for (int j = 1; j < strlen (s2) + 1; ++j)
      {
        a[i][j] = max4 (
          a[i-1][j-1] + (s1[i-1] == s2[j-1] ? 3 : -3),
          a[i-1][j] - 2, a[i][j-1] - 2, 0
        );
        score = max (score, a[i][j]);
        if (s1[i-1] == s2[j-1])
          matched[i-1] = true;
      }

  // reward prefix matches, especially in short words.
  for (int i = 0; s1[i] && s2[i] && s1[i] == s2[i]; ++i)
    score += (strlen (s2) <= 3 ? 9 : 3);

  // reward matches after dots and spaces.
  for (int i = 0; s2[i]; ++i)
    if (s2[i] == '.' || s2[i] == ' ')
      for (int j = 0; s1[j]; ++j)
        {
          if (i+1 + j >= strlen (s2) || s1[j] != s2[i+1 + j])
            break;
          score += 3;
        }

  // every character in `s1` must be present in `s2`.
  for (int i = 0; s1[i]; ++i)
    if (!matched[i])
      return INT_MIN;

  return score;
}

int
fuzzy_match (const char *a, const char *b)
{
  char s1[strlen (a) + 1], s2[strlen (b) + 1];
  strcpy (s1, a);
  strcpy (s2, b);
  for (int i = 0; i < strlen (s1); ++i)
    {
      s1[i] = tolower (s1[i]);
      if (s1[i] == '-')
        s1[i] = '_';
    }
  for (int i = 0; i < strlen (s2); ++i)
    {
      s2[i] = tolower (s2[i]);
      if (s2[i] == '-')
        s2[i] = '_';
    }
  return smith_waterman (
    basename (bash_dequote_text (s2)),
    basename (bash_dequote_text (s1))
  );
}
```

!regular-bash-file-completion-demo.gif

I considered normalizing unicode characters using [utf8proc](https://github.com/JuliaStrings/utf8proc) or [libunistring](https://www.gnu.org/software/libunistring/manual/libunistring.html#Introduction) but that's too much work for almost no benefit since I don't have many filenames on my system that contain unicode characters. The full patch with the ugly internal global variable that make it work and other assorted implementation details can be found [here](/0001-Add-fuzzy-file-completion.patch).

To record the videos I told OBS to capture a terminal window and Shotcut was used to trim the videos. A whole bunch of sleeps and xdotool commands were used to emulate the keypresses, so as to get consistent footage. I know, the code doesn't look very pretty and I'm quite certain that the backgrounded subshells are unnecessary for `start2` and `start3`.

```bash
start1() {
    (
    sleep 1
    xdotool type 'clear'
    xdotool key Return
    sleep 1
    xdotool type --delay 200 'cd /t'
    sleep .2
    xdotool key Tab
    sleep .2
    xdotool type --delay 200 'de'
    sleep .2
    xdotool key Tab
    sleep .2
    xdotool key Return
    sleep .3
    xdotool type --delay 200 'ls -1'
    xdotool key Return
    sleep .5
    xdotool type --delay 200 'cat un'
    sleep .2
    xdotool key Tab
    sleep .3
    xdotool key Return
    sleep .5
    xdotool type --delay 200 'touch a-'
    sleep .2
    xdotool key Tab
    sleep .2
    xdotool type --delay 200 'fil'
    sleep .2
    xdotool key Tab
    sleep .2
    xdotool type --delay 200 '3'
    sleep .2
    xdotool key Tab
    sleep .2
    xdotool key Return
    sleep .5
    xdotool type --delay 200 'cd a-'
    sleep .2
    xdotool key Tab
    sleep .2
    xdotool type --delay 200 'dir'
    sleep .2
    xdotool key Tab
    sleep .2
    xdotool key Return
    sleep 1
    ) &
    bash~
}

start2() {
    xdotool type 'clear'
    xdotool key Return
    (
    sleep 1.2
    xdotool type --delay 200 'cd /tmp/demo'
    xdotool key Return
    sleep .2
    xdotool type --delay 200 'ls -1'
    xdotool key Return
    sleep .5
    xdotool type --delay 200 'cat sh'
    sleep .2
    xdotool key Tab
    sleep .3
    xdotool key Return
    sleep .5
    xdotool type --delay 200 'touch 3'
    sleep .2
    xdotool key Tab
    sleep .2
    xdotool key Return
    sleep .5
    xdotool type --delay 200 'cd dir'
    sleep .2
    xdotool key Tab
    sleep .2
    xdotool key Return
    sleep 1
    ) &
}

start3() {
    xdotool type 'clear'
    xdotool key Return
    (
    sleep 1.2
    xdotool type --delay 200 'cd /tmp/**'
    sleep .2
    xdotool key Tab
    sleep .2
    xdotool type --delay 200 'demo'
    sleep .2
    xdotool key Return
    sleep .2
    xdotool key Return
    sleep .2
    xdotool type --delay 200 'ls -1'
    xdotool key Return
    sleep .5
    xdotool type --delay 200 'cat '
    sleep .2
    xdotool key Ctrl+T
    sleep .2
    xdotool type --delay 200 'cat '
    sleep .4
    xdotool key Return
    sleep .2
    xdotool key Return
    sleep .5
    xdotool type --delay 200 'touch '
    sleep .2
    xdotool key Ctrl+T
    sleep .2
    xdotool type --delay 200 '3'
    sleep .4
    xdotool key Return
    sleep .1
    xdotool key Return
    sleep .3
    xdotool key Alt+C
    sleep .1
    xdotool type --delay 200 'dir'
    sleep .3
    xdotool key Return
    sleep 1
    ) &
}
```
