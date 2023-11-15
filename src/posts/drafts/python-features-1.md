Good Python Features | 3 | 2023-10-20 | python

Python is the language I know best and probably the only language I can claim to *really* know. Over the years I've picked up a few tricks and features that perhaps not too many people know, but are either really interesting or useful.

## Internals

Python works like how most modern interpreters work. It first goes through a lexing stage, where your source code is turned into a list of tokens. It then parses these tokens into an abstract syntax tree which is then converted into bytecode. Bytecode is bascially an idealized assembly that's machine agnostic, and to ultimately run your source code Python interprets the bytecode with a VM. Each of these steps are exposed and can be observed through a module in the standard library. For example, we can tokenize source code with the `tokenize` module.

```py
import tokenize
import io

print(*tokenize.tokenize(io.BytesIO(
    b'print("hello, world")').readline), sep='\n')
```

The `ast.parse` function in the `ast` module parses source code into an abstract syntax tree (abbreviated as AST) and calling `ast.dump` let's us see the AST in a prettier manner,

```py
import ast

print(ast.dump(ast.parse('x = 2 + 3'), indent=4))
```

And we can disassemble Python functions into bytecode, just like how we can diassemble executables into native assembly.

```py
import dis

def f():
    print('hello, world')
    return 2 + 3

dis.dis(f)
```

Play with these code snippets, run them and provide them different arguments. You gain a deeper understanding of how Python works. These Python modules all have command line interfaces which you can access via `python3 -m [module]` if you're interested.

## Multiline Strings

Most of you probably know about multiline strings.

```py
print('''
<body>
    <p>Hello, world!</p>
</body>
''')
```

However, if we run the code above we get a newline before and after the text. We could use something like `str.strip()` to remove it but I think a better way is to explicitly use backslashes, like so:

```py
print('''\
<body>
    <p>Hello, world!</p>
</body>\
''')
```

## Type Annotations

Most you know probably know about type annotations

```py
def dbl(x: int) -> int:
    return 2 * x

print(dbl.__annotations__)
```

## Comprehension

Already your aware of the existence of list comprehension and you use it on a daily bases. But did you know there exists generator, set, and dictionary comprehension? For example,

```py
print(' '.join(str(x*x) for x in range(10))) # generator
print({x*x % 10 for x in range(100)}) # set
print({i: i*i for i in range(10)}) # dictionary
```

## Walruses & Lambs

I wrote a shell and to handle the piping I took advantage of the walrus operator and a lambda.

```py
if len(cmds := splitby(cmd, '|')) > 1:
    signal.signal(signal.SIGPIPE, lambda *_: ...) # ignore SIGPIPE
```

## Obscure Libraries

There is a joke that you can import antigravity in Python and indeed the Python standard library contains modules with esoteric uses. We can pop open a URL in the user's webbrowser,

```py
import webbrowser

webbrowser.open('google.com')
```

Or functions to convert between color spaces (which would be more useful in JavaScript then Python),

```py
import colorsys

print(colorsys.rgb_to_hls(0.2, 0.4, 0.4))
print(colorsys.hls_to_rgb(.5, .3, .33))
```

Or a module to generate UUIDs, one that contains a bunch of different hashing algorithms, and another used to let the user safely input a password.

```py
import uuid
import hashlib
import getpass

print(uuid.uuid4())
print(hashlib.sha1(b'hello, world!').hexdigest())
print(getpass.getpass())
```

All of these little features make Python a really fun and easy language to work in.