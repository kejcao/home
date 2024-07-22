# SSG

A Node.js file and a Bash script work together to render a bunch of Nunjucks templates and posts written in a Markdown-like document language. Used for my personal site [kevincao.xyz](https://www.kevincao.xyz/).

## Libraries

- Ran server side
    - `babel` to transcompile and miniaturize JavaScript.
    - `highlight.js` to syntax highlight code blocks.
    - `nunjucks` to render the HTML templates.
- Ran client side
    - `Mathjax` to render LaTeX math formulas.

## Directory Structure & Important Files

- `src`: Source code, template files and Markdown posts.
- `pub`: The rendered site.
- `pub/static`: Static files like favicon.ico.
- `build.js`: Renders source code and posts from `src` to `build`.
- `home.sh`: A collection of commands for managing the SSG.
- `layout.html`: Global layout, nearly every page inherits from this file.
- `post-layout.html`: Layout for each blog post.

## Markdown-like Markup Language

Blog posts are written in a Markdown-like markup language which is parsed and converted by `build.js`. Most of the inline text features we love and expect from Markdown are here

- backticks for monospace,
- asterisks for italics,
- dollar sign for inline LaTeX math,
- brackets for href links.

It automatically wraps keyboard shortcuts surrounded by backticks (e.g. "\`ctrl+t\`") into `<kbd>` tags instead of code tags. Images are handled slightly differently, as `!img.png` on its own line where the image is found in `/images` and the alt-text is set to the filename.

Also we have

- code blocks with triple backticks (wrapped if there are quadruple backticks),
