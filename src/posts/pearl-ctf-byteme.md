Pearl CTF: Byte Me | 3 | 2024-03-10 | ctf,python,writeup

A university in Dhanbad, India recently hosted the [Pearl CTF](https://pearlctf.in/) challenge. I participated in it and solved a couple challenges, including one titled "byteme" with the description, "I know you are a python expert, but can you reverse this?" We are provided with a single [`byteme.pyc`](/store/byteme.pyc) file. Let's find the flag.

Python is a bytecode interpreter which operate by essentially compiling high-level source code into a sort of idealized assembly, called bytecode—this bytecode is then ran by the Python virtual machine (PVM), which is how your code is actually executed.

If you've ever used Python before, you might've noticed the `__pycache__` directory. That directory contains `*.pyc` files which are basically just raw bytecode. We can directly run the `*.pyc` file with the Python command as we would a `*.py` file. However if we try to run `byteme.pyc`, Python whines about a bad magic number.

```shell
$ python byteme.pyc 
RuntimeError: Bad magic number in .pyc file
$ xxd -l32 byteme.pyc 
00000000: f00d 0d0a 0000 0000 4716 e865 4225 0000  ........G..eB%..
00000010: e300 0000 0000 0000 0000 0000 0006 0000  ................
```

The magic number in question is `0x0df0` or 3568 in decimal. From the CPython source code in file [PC/launcher.c](https://github.com/python/cpython/blob/5b8664433829ea967c150363cf49a5c4c1380fe8/PC/launcher.c#L1250-L1275) we see that since 3568 is in the range of 3550–3599, the `byteme.pyc` file was produced from a 3.13 version of the CPython interpeter.

I happen to have the CPython source code on my local machine on the latest commit as of writing, `b4b4e764a798bab60324871074ce4cdebb9d01bb`. This version of CPython has the magic number 3569. We want a version with the magic number 3568, so let's look for the commit that changed this magic number and checkout the commit right before that.

```shell
$ git log -1 -L 485,485:Lib/importlib/_bootstrap_external.py
commit 7114cf20c015b99123b32c1ba4f5475b7a6c3a13
Author: Ken Jin <kenjin@python.org>
Date:   Thu Mar 7 03:30:11 2024 +0800

    gh-116381: Specialize CONTAINS_OP (GH-116385)
    
    * Specialize CONTAINS_OP
    
    * 📜🤖 Added by blurb_it.
    
    * Add PyAPI_FUNC for JIT
    
    ---------
    
    Co-authored-by: blurb-it[bot] <43283697+blurb-it[bot]@users.noreply.github.com>

diff --git a/Lib/importlib/_bootstrap_external.py b/Lib/importlib/_bootstrap_external.py
--- a/Lib/importlib/_bootstrap_external.py
+++ b/Lib/importlib/_bootstrap_external.py
@@ -484,1 +485,1 @@
-MAGIC_NUMBER = (3568).to_bytes(2, 'little') + b'\r\n'
+MAGIC_NUMBER = (3569).to_bytes(2, 'little') + b'\r\n'
$ git checkout 7114cf20c015b99123b32c1ba4f5475b7a6c3a13^
```

Then we can build CPython as [instructed](https://devguide.python.org/getting-started/setup-building/) by the official documentation. If we ran the file, it prompts us for a password. From now on, all Python files should be interpreted with our newly built Python interpreter, on the commit before `7114cf20c015b99123b32c1ba4f5475b7a6c3a13`.

We can disassemble the bytecode by simply skipping the magic number, timestamp, and some other junk before loading and disassembling the raw bytecode.

```py
import dis
import marshal

with open('byteme.pyc', 'rb') as f:
    f.seek(16)
    dis.dis(marshal.load(f))
```

I provide the full output of this code (the disassembly of `byteme.pyc`) in this [text file](/store/byteme-disassembly.txt) for those interested.

# Part 1: Starting at the End

A cursory overview of the disassembly yields 3 `input()` statements, and thus 3 input-the-right-password type challenges. I tried to reverse engineer the first challenge, but I see a conditional requirement for a password of length 12 and a md5 hash that would take too long to brute-force. I don't know how to precede with the first input challenge, so let us begin by looking and cracking the last one. This is the disassembly:

```
220           LOAD_GLOBAL              9 (input + NULL)
              LOAD_CONST               6 ('> ')
              CALL                     1
              STORE_FAST               2 (chain)

221           LOAD_GLOBAL              3 (print + NULL)
              CALL                     0
              POP_TOP

223           BUILD_LIST               0
              LOAD_CONST               7 ((117, 84, 87, 108, 59, 85, 66, 71, 71, 30, 16))
              LIST_EXTEND              1
              STORE_FAST               3 (best)

224           LOAD_GLOBAL             11 (list + NULL)
              CALL                     0
              STORE_FAST               4 (mod)

225           LOAD_CONST               8 (69)
              STORE_FAST               5 (plier)

227           LOAD_GLOBAL             13 (range + NULL)
              LOAD_GLOBAL             15 (len + NULL)
              LOAD_FAST                2 (chain)
              CALL                     1
              CALL                     1
              GET_ITER
      L3:     FOR_ITER                47 (to L4)
              STORE_FAST               6 (i)

228           LOAD_FAST                4 (mod)
              LOAD_ATTR               17 (append + NULL|self)
              LOAD_FAST                5 (plier)
              LOAD_GLOBAL             19 (ord + NULL)
              LOAD_FAST_LOAD_FAST     38 (chain, i)
              BINARY_SUBSCR
              CALL                     1
              BINARY_OP               12 (^)
              CALL                     1
              POP_TOP

229           LOAD_GLOBAL             19 (ord + NULL)
              LOAD_FAST_LOAD_FAST     38 (chain, i)
              BINARY_SUBSCR
              CALL                     1
              STORE_FAST               5 (plier)
              JUMP_BACKWARD           49 (to L3)

227   L4:     END_FOR
              POP_TOP

231           LOAD_FAST_LOAD_FAST     67 (mod, best)
              COMPARE_OP              88 (bool(==))
              POP_JUMP_IF_FALSE       78 (to L5)
```

If you are unfamiliar with Python bytecode, then this is a great opportunity to learn some. Try to see how it corresponds with my high-level Python translation:

```py
chain = input()
print()

best = [117, 84, 87, 108, 59, 85, 66, 71, 71, 30, 16]
mod = list()
plier = 69

for i in range(len(chain)):
    mod.append(plier ^ ord(chain[i]))
    plier = ord(chain[i])

if mod != best:
    ... # jump to L5, the failure case
```

It is clear we need a list of integers in `chain` that matches `best`. It is simple enough to write some code that constructs the correct list and prints it out.

```py
best = [117, 84, 87, 108, 59, 85, 66, 71, 71, 30, 16]
plier = 69
chain = [plier := plier ^ n for n in best]
print(''.join(chr(i) for i in chain))
```

If we run the code we get `0d3_d1s4sm}` which is a string that appears to be the end of the flag.

# Part 2: Brute-Forcing MD5

Now we know each password input corresponds to a part of the flag. I suspect that the first 6 characters of the MD5 hash in the first challenge is `pearl{`, the prefix that every flag starts with in Pearl CTF. This is the disassembly:

```
 39           LOAD_GLOBAL              3 (input + NULL)
              LOAD_CONST               8 ('> ')
              CALL                     1
              STORE_FAST               0 (spell)

 40           LOAD_GLOBAL              1 (print + NULL)
              CALL                     0
              POP_TOP

 42           LOAD_GLOBAL              5 (len + NULL)
              LOAD_FAST                0 (spell)
              LOAD_ATTR                7 (strip + NULL|self)
              CALL                     0
              CALL                     1
              LOAD_CONST               9 (12)
              COMPARE_OP             119 (bool(!=))
              POP_JUMP_IF_TRUE        57 (to L1)
              LOAD_GLOBAL              9 (md5 + NULL)
              LOAD_FAST                0 (spell)
              LOAD_ATTR                7 (strip + NULL|self)
              CALL                     0
              LOAD_ATTR               11 (encode + NULL|self)
              CALL                     0
              CALL                     1
              LOAD_ATTR               13 (hexdigest + NULL|self)
              CALL                     0
              LOAD_CONST              10 ('9ce86143889d80b01586f8a819d20f0c')
              COMPARE_OP             119 (bool(!=))
              POP_JUMP_IF_FALSE       43 (to L2)
```

From the disassembly it is evident that our input must be 12 characters in length. In addition, given the that the last part of the flag we recovered in Part 1 has only alphanumeric characters + underscore, we can presume that the full flag will be composed solely of those characters. It is easy enough to brute-force the hash. I use John the Ripper.

```shell
$ john --format=Raw-MD5 --mask=pearl{[0-9a-z_][0-9a-z_][0-9a-z_][0-9a-z_][0-9a-z_][0-9a-z_] <(echo 9ce86143889d80b01586f8a819d20f0c)
Press 'q' or Ctrl-C to abort, almost any other key for status
0g 0:00:00:12 22.38% (ETA: 08:42:15) 0g/s 47774Kp/s 47774Kc/s 47774KC/s pearl{usuea8..pearl{_xuea8
0g 0:00:00:17 32.02% (ETA: 08:42:15) 0g/s 48269Kp/s 48269Kc/s 48269KC/s pearl{i1advb..pearl{o6advb
0g 0:00:00:22 41.71% (ETA: 08:42:14) 0g/s 48601Kp/s 48601Kc/s 48601KC/s pearl{b3e1gf..pearl{h8e1gf
0g 0:00:00:31 59.07% (ETA: 08:42:14) 0g/s 48853Kp/s 48853Kc/s 48853KC/s pearl{xt8mvl..pearl{2z8mvl
pearl{e4sy_p     (?)
1g 0:00:00:36 DONE (2024-03-09 08:41) 0.02718g/s 49003Kp/s 49003Kc/s 49003KC/s pearl{k1sy_p..pearl{q6sy_p
```

In 36 seconds we receive the beginning of the flag, `pearl{e4sy_p`.

# Part 3: Solving Linear Constraints

The second challenge is much like the previous ones. The `input()` is stored in the variable `answer` and the validity checks are 14 chunks of bytecode where each looks similar to this:

```
 113    L2:     LOAD_FAST                0 (answer)
                LOAD_CONST               8 (6)
                BINARY_SUBSCR
                LOAD_FAST                0 (answer)
                LOAD_CONST               9 (7)
                BINARY_SUBSCR
                BINARY_OP                0 (+)
                LOAD_FAST                0 (answer)
                LOAD_CONST              10 (8)
                BINARY_SUBSCR
                BINARY_OP                0 (+)
                LOAD_FAST                0 (answer)
                LOAD_CONST              11 (5)
                BINARY_SUBSCR
                BINARY_OP               10 (-)
                LOAD_CONST              12 (190)
                COMPARE_OP              88 (bool(==))
                POP_JUMP_IF_TRUE         2 (to L3)
                LOAD_ASSERTION_ERROR
                RAISE_VARARGS            1
```

I wrote some short, scrappy code which I won't share here to automatically extract those chunks into arithmetic constraints. I pasted these constraints into a Python script to throw at the Z3 theorem prover to solve for the array.

```py
from z3 import *

solver = Solver()
a = [Int(f'a[{i}]') for i in range(10)]

solver.add(
    [
        a[6] + a[7] + a[8] - a[5] == 190,
        a[6] + a[5] + a[5] - a[2] == 202,
        a[9] + a[3] + a[2] + a[5] == 433,
        a[7] + a[0] - a[0] + a[3] == 237,
        a[1] - a[9] - a[5] + a[4] == -50,
        a[2] - a[3] + a[1] - a[1] == -6,
        a[8] - a[7] - a[6] + a[5] == -88,
        a[0] + a[8] - a[5] - a[3] == -117,
        a[5] + a[6] + a[8] + a[2] == 385,
        a[5] - a[4] - a[5] + a[9] == 4,
        a[2] - a[9] + a[5] - a[0] == 63,
        a[2] - a[5] + a[4] - a[9] == 13,
        a[8] + a[3] + a[7] - a[6] == 167,
        a[6] - a[5] - a[0] - a[5] == -126,
        a[2] - a[5] - a[6] - a[4] == -199,
    ]
)

if solver.check() == sat:
    model = solver.model()
    print(''.join(
        chr(model.evaluate(a[i]).as_long())
        for i in range(len(a))
    ))
```

It prints the middle of the flag, `34sy_byt3c`.

In conclusion, the full flag stitched together is

```
pearl{e4sy_p34sy_byt3c0d3_d1s4sm}
```

and this was a fun challenge that really tested my Python expertise and improved my knowledge of Python bytecode. The Pearl CTF website was quite laggy for me. Some of the challenges were broken—I think they had upwards of 500 support tickets—and, the rating system is sort of scuffed. I got the same amount of points for exploiting a simple PRNG vulnerability in a Flask application as I did this one.
