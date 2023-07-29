Using ChatGPT to Generate Vim/Neovim Colorschemes | 1 | 2023-07-23 | vim,LLM,ChatGPT,AI,python

ChatGPT is "the fastest-growing consumer application in history," so no doubt you have already heard of it. I saw a Reddit [post](https://www.reddit.com/r/neovim/comments/14an2bu/texttocolorscheme_a_new_plugin_that_uses/) that promotes an extension that makes very creative use of ChatGPT to generate colorschemes for the Vim/Neovim text editors. I'd love to add a little flair and eye candy to the editor I spend most of my days in—but I don't what to learn the commands and keyboard shortcuts of of yet another wholly unnecessary extension. I also don't have an API key for ChatGPT nor do I want to go through the trouble of getting one. I do have an account I made on the website a while ago though, so I logged in and used the web interface to prompt it. I don't know what exactly to prompt it with, so I looked through the [source code](https://github.com/svermeulen/text-to-colorscheme) of the extension and found the prompt it uses stored in a [string literal](https://github.com/svermeulen/text-to-colorscheme/blob/a6226a2d771b52dfadea81b308069a8655e0c978/lua/text-to-colorscheme/internal/openai.lua#L99C1-L99C1). I wrote my own prompt, using the extension's as a template. The original prompt told ChatGPT to return Lua code, but I tell it to return Python code so I can copy then paste and feed its response into a script.

```py
import sys
from textwrap import dedent

# You will be prompted; respond with a dark-themed color palette
# (as Python code) that best matches the prompt. All colors must
# be brighter than the background color and somewhat distinct from
# each other. For example:
#                                                                  
# ```
# fg = '<hexcolor>'
# bg = '<hexcolor>'
# c1 = '<hexcolor>'
# c2 = '<hexcolor>'
# c3 = '<hexcolor>'
# c4 = '<hexcolor>'
# c5 = '<hexcolor>'
# c6 = '<hexcolor>'
# c7 = '<hexcolor>'
# ```

exec(dedent(sys.stdin.read()))
print(f'''
hi Normal guifg={fg} guibg={bg}

hi DiffText guifg={c1} guibg=NONE
hi ErrorMsg guifg={c1} guibg=NONE
hi WarningMsg guifg={c1} guibg=NONE
...
hi StatusLineNC gui=NONE guibg={bg} guifg={fg}
hi Search guibg={c5} guifg={fg}
hi VertSplit gui=NONE guifg={c7} guibg=NONE
hi Visual gui=NONE guibg={c7}
''')
```

The comment at the top is the prompt I give ChatGPT. When it then responds in the form of the text between the triple backticks, I run the script then paste in the text. I press Ctrl+D to tell the script that I'm done, and it executes my input as Python code—we dedent it because you know how Python absolutely adores arbitrary indentation. It thus sets the variables `fg`, `bg`, `c1`, etc. to the hex color strings before it simply prints out a formatted multiline string literal which can be copied and pasted into a `.vimrc`. Note that I cut out a lot of text in the middle of the multiline string to make the code easier to read and less verbose. I got all those `hi` vimscript commands from the [vimcolors.org](https://vimcolors.org/) website. I replaced all the hard-coded colors into variables. Below is a conversation I had with ChatGPT, where I used this method to generate a couple colorschemes, which are shown as images.

```
ME:
    You will be prompted; respond with a dark-themed color palette
    (as Python code) that best matches the prompt. All colors must
    be brighter than the background color and somewhat distinct from
    each other. For example:

    ```
    fg = '<hexcolor>'
    bg = '<hexcolor>'
    c1 = '<hexcolor>'
    c2 = '<hexcolor>'
    c3 = '<hexcolor>'
    c4 = '<hexcolor>'
    c5 = '<hexcolor>'
    c6 = '<hexcolor>'
    c7 = '<hexcolor>'
    ```
GPT:
    fg = '#FFFFFF' # White
    bg = '#000000' # Black
    c1 = '#B22222' # Firebrick
    c2 = '#8B4513' # SaddleBrown
    c3 = '#FF4500' # OrangeRed
    c4 = '#FF8C00' # DarkOrange
    c5 = '#FFFF00' # Yellow
    c6 = '#00CED1' # DarkTurquoise
    c7 = '#9932CC' # DarkOrchid
ME:
    firelight
GPT:
    fg = '#FF4500' # OrangeRed
    bg = '#000000' # Black
    c1 = '#FFD700' # Gold
    c2 = '#FFA500' # Orange
    c3 = '#FF6347' # Tomato
    c4 = '#FF8C00' # DarkOrange
    c5 = '#FFDAB9' # PeachPuff
    c6 = '#DC143C' # Crimson
    c7 = '#B22222' # Firebrick
```

!gpt-color-scheme-firelight.png

```
ME:
    noir
GPT:
    fg = '#FFFFFF' # White
    bg = '#000000' # Black
    c1 = '#808080' # Gray
    c2 = '#2F4F4F' # DarkSlateGray
    c3 = '#696969' # DimGray
    c4 = '#A9A9A9' # DarkGray
    c5 = '#708090' # SlateGray
    c6 = '#363636' # Davy's Gray
    c7 = '#1C1C1C' # Jet Black
```

!gpt-color-scheme-noir.png

```
ME:
    cyberpunk
GPT:
    fg = '#00FF00' # Lime Green
    bg = '#000000' # Black
    c1 = '#FF00FF' # Magenta
    c2 = '#00FFFF' # Cyan
    c3 = '#FF4500' # OrangeRed
    c4 = '#FFC0CB' # Pink
    c5 = '#800080' # Purple
    c6 = '#FFA500' # Orange
    c7 = '#FFD700' # Gold
```

!gpt-color-scheme-cyberpunk.png

```
ME:
    ocean waves
GPT:
    fg = '#FFFFFF' # White
    bg = '#0A192F' # Dark Blue
    c1 = '#1A759F' # Cerulean
    c2 = '#4AB6C4' # Light Blue
    c3 = '#3686A0' # Steel Blue
    c4 = '#5499C7' # Sky Blue
    c5 = '#82B3D0' # Pale Blue
    c6 = '#EAF6FF' # Baby Blue
    c7 = '#0D2B46' # Dark Navy Blue
```

!gpt-color-scheme-ocean-waves.png

```
ME:
    cherry blossom
GPT:
    fg = '#FFFFFF' # White
    bg = '#F8F8F8' # Light Gray
    c1 = '#FAD7DB' # Pale Pink
    c2 = '#F6C3C9' # Light Pink
    c3 = '#F2AEB2' # Baby Pink
    c4 = '#ED98A3' # Rose Pink
    c5 = '#E8828E' # Coral Pink
    c6 = '#E16D7B' # Salmon Pink
    c7 = '#DB5868' # Deep Pink
```

!gpt-color-scheme-cherry-blossom-bad.png

```
ME:
    make the background darker.
GPT:
    fg = '#FFFFFF' # White
    bg = '#301B28' # Dark Purple
    c1 = '#FFB3C1' # Light Pink
    c2 = '#FF8CA8' # Pale Pink
    c3 = '#FF6590' # Baby Pink
    c4 = '#FF4179' # Rose Pink
    c5 = '#FF1E63' # Coral Pink
    c6 = '#FF0050' # Salmon Pink
    c7 = '#FF003D' # Deep Pink
```

!gpt-color-scheme-cherry-blossom-good.png

On the last prompt you can see that I can tell ChatGPT to "make the background darker" and perform other color adjustments. Using ChatGPT to generate colorschemes for my text editor is one of the most useful things I've ever done with it or any other LLM for that matter.

I "install" the colorschemes in Neovim by pasting them into appropriately named `.vim` files under my `.config/nvim/colors` directory.
