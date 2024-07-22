# SSG

A Node.js file and a Bash script work together to render a bunch of Nunjucks templates and posts written in a Markdown-like document language. Used for my personal site [kevincao.xyz](https://www.kevincao.xyz/). It is solely for personal use.

## Libraries Used

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
- `serve.js`: Spins up the dev server.
- `home.sh`: A collection of commands for managing the SSG.
- `layout.html`: Global layout, nearly every page inherits from this file.
- `post-layout.html`: Layout for each blog post.

## Markdown-like Markup Language

Blog posts are written in a Markdown-like markup language which is parsed and converted by `build.js`. Most of the features we love and expect from Markdown are here, and more!

- Inline:
    - Backticks for monospace.
    - Backticks for keyboard shortcuts, for example \`ctrl+t\` is automatically wrapped between `<kbd>` tags rather than `<code>`.
    - Asterisks for italics. No bold.
    - Dollar signs for inline LaTeX math.
    - Brackets for href links, per usual.
- Block:
    - Code blocks with triple backticks and syntax highlighting, as expected.
    - Wrapped code blocks with quadruple backticks.
    - Double dollar signs for block math.
    - Images with `!slug-alt-text.png`.
    - Raw HTML is detected and let through.
    - Paragraphs obviously.

The parser implemented is not really a parser, its more reminiscent of a hand-rolled lexer. I do sort of "recurse" down an implicit AST, because the inline markup like bold and italics are rendered recursively.

## Live Reloading

The HTTP server injects a short JS snippet into HTML files. This JS code spawns a WebSocket, which interacts with the WebSocket server. Whenever a modification is detected, the website is rebuilt, then the WebSocket server sends a message to the clients demanding they reload the page.

The list of URLs with WebSockets on them is stored in a multiset. Once a WebSocket opens, it indicates to the server its URL and this URL is promptly stored in the multiset. Once a WebSocket closes (aka the page unloads), it indicates to the server its URL and this URL is promptly decremented in the multiset. We use a multiset to support multiple instances of the same WebSocket on the same URL—for example, the developer might have multiple tabs open on the same webpage.

On initial build the blog posts and webpage data is cached, so rebuilds are really quick. Almost instantaneous to my eyes. We use the multiset described previously to rebuild only the webpages that the developer is on. We cannot do this another way. The templates for the webpages rely on a list of blogposts, so if the developer changes something in a blog post, we need to re-render a webpage.

Overall, I'm quite proud of this live reloading system I cooked up. It's definitely not good, but its really rewarding to edit a blog post in neovim and then instantaneous get feedback (the rendered result) on a Chrome tab I have open beside it. Almost magical.
