picoCTF writeups | 3 | 2023-10-30 | ctf

## New Caesar

[New Caesar](https://play.picoctf.org/practice/challenge/158) requires us to reverse engineer the encryption mechanism of a short Python script.

```py
import string

LOWERCASE_OFFSET = ord("a")
ALPHABET = string.ascii_lowercase[:16]

def b16_encode(plain):
    enc = ""
    for c in plain:
        binary = "{0:08b}".format(ord(c))
        enc += ALPHABET[int(binary[:4], 2)]
        enc += ALPHABET[int(binary[4:], 2)]
    return enc

def shift(c, k):
    t1 = ord(c) - LOWERCASE_OFFSET
    t2 = ord(k) - LOWERCASE_OFFSET
    return ALPHABET[(t1 + t2) % len(ALPHABET)]

flag = "redacted"
key = "redacted"
assert all([k in ALPHABET for k in key])
assert len(key) == 1

b16 = b16_encode(flag)
enc = ""
for i, c in enumerate(b16):
    enc += shift(c, key[i % len(key)])
print(enc)
```

1. It encodes the flag into a base16 like representation.
2. It shifts each character of this representation by a fixed `key`. Notice how the `key` variable is a member of `ALPHABET` and of length only 1, because of the assertions.

Let's decrypt it.

```py
def b16_decode(cipher):
    print(''.join(
        chr((ALPHABET.index(a)<<4) + ALPHABET.index(b))
        for a, b in zip(cipher[::2], cipher[1::2])
    ))

for a in ALPHABET:
    print(b16_decode(''.join(
        shift(c, a)
        for c in f'{FLAG}'
    )))
```

Run it

```shell
$ python3 new_caesar.py | strings
...
CR=RS
None
TcNcd.N$&!"U#T& P/&"%S"Q S (SST#!&(PR/"
None
et_tu?_5723f4e71a0736d3b1d19dde4279ac03
None
@`FHCDwEvHBrAHDGuDsBuBJuuvECHJrtAD
None
QqWYTU
...
```

And we get the flag in the middle there.
