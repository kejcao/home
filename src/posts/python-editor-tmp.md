DD: Untitled | 1 | 2024-07-21 | tags

In the command line sometimes we want to open a text editor for the user to type text into, then retrieve this text as a string in code. For example, git commit messages or C-x C-e in Bash. We can do this in Python by opening a temporary file then run the editor as a subprocess.

```py
import os
import subprocess
import tempfile

def open_editor():
    with tempfile.NamedTemporaryFile(suffix=".tmp") as tf:
        try:
            editor = os.environ["EDITOR"]
        except KeyError:
            editor = "vim"
        subprocess.run([editor, tf.name], check=True)

        with open(tf.name, "r") as f:
            return f.read()

print(open_editor())
```
