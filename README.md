# SSG

A hodgepodge of confused Bash scripts and a Node.js file that come together to render a menagerie of Nunjucks templates and posts written in a Markdown-like document language.

## Technologies

- `babel` to transcompile and miniaturize modern JavaScript to code a legacy browser would understand.
- `highlight.js` to add a bit of color to otherwise plain code blocks.
- `katex` to render the LaTeX math stuff.
- `nunjucks` to render the HTML templates.
- `tailwindcss` for really convenient styling.

## Directory Structure

- `images`: unoptimized, raw images.
- `src`: source code: mostly template files and posts.
- `static`: files that don't qualify as source code, like favicon.ico or optimized media.
- `build.js`: renders source code and posts from `src` to `build`.
- `compile.sh`: runs `build.js` then combines `static` and `build` into `pub`, which can be directly served.
- `pub`: raw HTML, CSS, JavaScript, and miscellaneous media ready to be served.
- `build`: directory containing rendered `index.html` files and posts from `src`.
- `test.sh`: for development.
- `layout.html`: global layout. Nearly every page inherits from this file.
- `post-layout.html`: layout for each post.
