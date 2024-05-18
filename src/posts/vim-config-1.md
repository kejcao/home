Configuring Neovim | 1 | 2024-05-07 | neovim,workflow

I use Neovim and spend more time configuring it than actually coding—I'm exaggerating, of course, but I do spend an inordinate amount of time with my nose in my Neovim config. There are constantly new additions I think to add or small adjustments to make to my `init.lua`. Here I present two neat ad-hoc code snippets in my config. In the wise words of Georgi Gerganov, "I like big `.vimrc` and I cannot lie."

Proponents claim that Neovim is very lightweight unlike the bloated alternative IDEs such as VSCode. They point to latency numbers and the ability of Neovim to handle files on the order of gigabytes. And this is indeed true if my Treesitter and LSP plugins didn't make editing any C file >2000 lines take half a second each time I press a fucking key.

Neovim equipped with my config and 200 plugins takes multiple agonizing seconds to load a plain text file more than a couple megabytes. During this loading duration Neovim freezes so if I (god forbid) accidentally open an especially large file, I have no choice but to forcibly and ungracefully kill it. This is not to mention—even if I do manage to open the file, it takes like 2 seconds to add a newline.

This is why I've some code in my config that automatically emergency panic exits if I open a file >1MB, less I have to bear that eternal delay for Neovim to load the file. The code gains an extra dimensionality of cleverness when you realize that I run `vim --clean` on a file >1MB to edit the file, ignoring/bypassing my config entirely and thus the plugins that make Neovim unwieldy slow on large files.

```vim
vim.cmd [[
function! CheckFileSize()
    if getfsize(expand('%')) > 1 * 1024 * 1024
        qa!
    endif
endfunction

autocmd BufReadPre * call CheckFileSize()
]]
```

Anyway, when exploring a webpage's source code for example, I open a Neovim buffer and paste in source code. However, in this scenario, Neovim doesn't recognize the filetype (because its a `[No Name]` buffer) so even the bare essentials like syntax highlighting aren't available. It requires too much of my executive function to type something like `:set ft=html`. Therefore, I use Google's [Magika](https://google.github.io/magika/) filetype detector to automatically guess the filetype of the buffer without engaging any part of my conscious brain.

```lua
local function magika()
    local buffer_content = vim.api.nvim_buf_get_lines(0, 0, -1, false)
    local buffer_content_str = table.concat(buffer_content, "\n")
    local output = vim.fn.system("magika --json -", buffer_content_str)
    if vim.v.shell_error == 0 then
        local guess = vim.json.decode(output)[1].dl.ct_label
        if guess ~= vim.NIL then
            vim.bo.filetype = guess
            print(string.format('Guessed "' .. guess .. '"'))
        end
    else
        print("Error with Magika " .. output)
    end
end
vim.api.nvim_create_user_command("Magika", magika, {})

vim.cmd [[
nnoremap <C-g> :Magika<CR>
]]
```

I don't use a plugin manager (unlike the normies) and instead my plugins are Git repositories cloned into `pack/plug/*`. To update these plugins I have a Bash script to glob over each repository and `git pull` updates. It works fine. I often forget to run it though. I really only run it if I think there's a bug in one of my plugins—in which case, I hope that someone else has experienced my problem too and that its fixed in the `master` branch.

```bash
#!/bin/bash

for fp in ./pack/plugs/*/*; do
    (
        cd "$fp"
        git pull
    )
done
```

I compile Neovim from scratch. In fact, the Neovim source code (on `master` branch) is sitting comfortably in my home directory. I'm not sure why I build from source rather than use the standard package supplied by my package manager. I think it has to do with a bleeding-edge feature that wasn't available in one of the stabler releases of Neovim, so I built from scratch to get access to that feature.
