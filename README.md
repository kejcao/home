# SSG

A hacky, homemade SSG. For my own personal website.

## Directory Structure

- `images`: unoptimized images.
- `src`: source code, template files, `index.html` and posts.
- `static`: files that don't qualify as source code, like favicon.ico or optimized media.
- `build.js`: optimizes images and renders source code and posts from `src` to `build`.
- `compile.sh`: runs `build.js` and combines `static` and `build` into `pub`, which can be directly served.
- `pub`: raw HTML, CSS, JavaScript, and media ready to be served.
- `build`: folder containing rendered `index.html` files and posts from `src`.
- `test.sh`: runs `compile.sh` then spins up a test server, for development.
- `layout.html`: global layout.
- `post-layout.html`: layout for each post.
