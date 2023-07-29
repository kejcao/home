Writing English Words as Hexadecimal | 3 | 2023-05-25 | nlp,python

I was curious as to what English words could be written solely with the 6 letters available in the hexadecimal numerical system, so I hammered together a short Python script which takes as its sole argument a filename of newline separated words and regurgitates the words that consist of only letters A–F.

```py
import sys

if len(sys.argv) != 2:
    print('usage: onlyhex [FILE]')
    quit()

with open(sys.argv[1]) as fp:
    for word in fp.readlines():
        word = word.strip()
        if len(word) > 2 and set(word).issubset(set("abcdef")):
            print(word)
```

Running the script on some 400K English words in text files from a [git repo](https://github.com/dwyl/english-words) returns numerous but obscure results. Instead you may want to run it on a list from another [git repo](https://github.com/first20hours/google-10000-english) of the 10-20K most common English words. This winnows the results into interesting words like cafe, ace, face, deaf, add, decaf, and fade. This means numbers like `0xfadedface` and `0xdecafcafe` are valid hexadecimal, corresponding to 67342564046 and 59805518590 in our familiar decimal system, respectively.

But why limit ourselves to only the letters A–F when we can represent letters such as O with the similarly looking digit zero—also valid in hexadecimal? The following Python script includes a small adjustment to the previous which allows words containing the letter "O" and converts them to the digit "0".

```py
import sys

if len(sys.argv) != 2:
    print('usage: onlyhex [FILE]')
    quit()

with open(sys.argv[1]) as fp:
    for word in fp.readlines():
        word = word.strip()
        if len(word) > 2 and set(word).issubset(set("abcdefo")):
            print(word.translate(str.maketrans("o", "0")))
```

This script outputs new words such as `dec0de` and `c0c0a`. These words can be formed into phrases such as `0x0ddf00d`, `0xafedface`, `0xdefacedfacade`, `0xdecafc0ffee`, `0xdeafbee`, `0xabadbed`, `0xc0dedcab`, all of which are valid hexadecimal. The following script is similar to the last one but it sorts the words into noun and/or adjective buckets and combines them into valid hexadecimal phrases.

```py
import random
import sys

from nltk.corpus import wordnet

if len(sys.argv) != 2:
    print('usage: onlyhex [FILE]')
    quit()

nouns, adjectives = [], []

with open(sys.argv[1]) as fp:
    for word in fp.readlines():
        word = word.strip()
        if len(word) > 2 and set(word).issubset(set("abcdefo")):
            types = set(s.pos() for s in wordnet.synsets(word))
            word = word.translate(str.maketrans("o", "0"))
            if 'n' in types:
                nouns.append(word)
            if 'a' in types:
                adjectives.append(word)

for _ in range(10):
    print(f'0x{random.choice(adjectives)}{random.choice(nouns)}')
```

For example, running this on a corpus of words yields

```
$ python3 onlyhex.py words.txt
0xdeaffade
0x0fff00d
0xbeddedcaca0
0xdeadba0bab
0xdeaff00d
0xfacedface
0xdead0af
0xfacedabb
0xdeafba0bab
0x0ffdeaf
```
