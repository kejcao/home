Capitalizing Titles | 4 | 2023-09-30 | math,algorithm,python

I use [capitalizemytitle.com](https://capitalizemytitle.com/style/Chicago/) to capitalize titles or to check that I've done it correctly. I wanted a local solution though, in case the Internet goes out or something. Besides, it's trivial to do this in Python. Although Python has a builtin `"string".title()` function, it sucks. It isn't smart enough to not captialize articles or coordinate conjunctions—it doesn't captialize hyphenated words correctly either.

There are different rules depending on the style guide you choose to abide by, but most of them require you to lowercase 

```py
import nltk

# builtin str.title() capitalizes letter after single quotes.
def upper_(s):
    # to account for words starting with starting quotes.
    if s[0] in {"'", '"'}:
        return s[0] + s[1].upper() + s[2:]
    return s[0].upper() + s[1:]

title = nltk.pos_tag(input().split())
for i in range(len(title)):
    word, pos = title[i]
    word = word.lower()
    if i == 0 or i == len(title)-1:
        print(word)
        title[i] = upper_(word)
    elif pos in {'DT', 'CC', 'IN', 'TO'}:
        title[i] = word
    elif '-' in word:
        a, b = word.split('-', maxsplit=1)
        title[i] = f'{upper_(a)}-{b}'
    else:
        title[i] = upper_(word)
print(*title)
```
