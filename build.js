const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const hljs = require('highlight.js');
const postcss = require('postcss');
const babel = require('@babel/core');
const svgo = require('svgo');
const sharp = require('sharp');
const katex = require('katex');

const layout = 'layout.html';
let compileAll = true;

const lastBuildTime = fs.statSync('build/index.html').mtime;
if (lastBuildTime < fs.statSync('layout.html').mtime ||
    lastBuildTime < fs.statSync('post-layout.html').mtime) {
  compileAll = true;
}

function StyleExtension() {
  this.tags = ['style'];

  this.parse = function(parser, nodes, lexer) {
    const tok = parser.nextToken().value;
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok);
    const body = parser.parseUntilBlocks('endstyle');
    parser.advanceAfterBlockEnd();
    return new nodes.CallExtension(this, 'run', args, [body]);
  };

  this.run = function(context, body) {
    return new nunjucks.runtime.SafeString(`<style>
      ${postcss([require('postcss-preset-env'), require('autoprefixer')])
        .process(body(), { from: undefined, to: undefined }).css}
    </style>`);
  };
}

function ScriptExtension() {
  this.tags = ['script'];

  this.parse = function(parser, nodes, lexer) {
    const tok = parser.nextToken().value;
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok);
    const body = parser.parseUntilBlocks('endscript');
    parser.advanceAfterBlockEnd();
    return new nodes.CallExtension(this, 'run', args, [body]);
  };

  this.run = function(context, body) {
    return new nunjucks.runtime.SafeString(`<script>
    ${babel.transformSync(body(), {
      presets: ['@babel/preset-env', 'minify'],
      targets: '> 0.25%, not dead'
    }).code}
    </script>`);
  };
}

let env = new nunjucks.Environment(new nunjucks.FileSystemLoader());
env.addExtension('StyleExtension', new StyleExtension());
env.addExtension('ScriptExtension', new ScriptExtension());
env.addFilter('raw', str => {
  return env.renderString(str, this.ctx);
});

function tohtml(txt) {
  // Parse the frontmatter.

  let lines = txt.split('\n');
  let frontmatter = {};
  let i;
  for (i = 0; i < lines.length; ++i) {
    if (Object.keys(frontmatter) != 0 && lines[i].trim() == '') {
      break;
    }
    const [key, ...val] = lines[i].split(':');
    if (key == undefined || val == undefined) {
      console.error('invalid frontmatter.');
      process.exit(1);
    }
    frontmatter[key.trim()] = val.join(':').trim();
  }
  if (i == lines.length) {
    console.error('invalid frontmatter.');
    process.exit(1);
  }

  let html = '';

  // Parse the content.

  lines = lines.slice(i);
  for (let i = 0; i < lines.length; ++i) {
    lines[i] = lines[i].trim();

    if (!lines[i]) {
      continue;
    }

    // We're at the beginning of a block, and either it's a code
    // block, raw HTML, or a paragraph.
    if (lines[i].startsWith('<') || lines[i].startsWith('{%')) {
      let block = [lines[i]];
      if (/<\/[^>]*>$/.test(lines[i])) {
        html += lines[i];
        continue;
      }

      while (++i < lines.length &&
        !(lines[i].startsWith('</') ||
          lines[i].startsWith('{%'))
      ) {
        block.push(lines[i]);
      }
      if (i >= lines.length) {
        console.error('post has unterminated HTML block.');
        process.exit(1);
      }
      block.push(lines[i]);

      html += block.join('\n');
    } else if (lines[i].startsWith('---')) {
      let block = [lines[i]];
      while (++i < lines.length && !lines[i].startsWith('---')) {
        block.push(lines[i]);
      }
      if (i >= lines.length) {
        console.error('post has unterminated code block.');
        process.exit(1);
      }

      const language = block[0].replace(/^---/, '').trim();
      let code = block.slice(1).join('\n');
      if (language != '') {
        code = hljs.highlight(code, { language }).value;
      } else {
        code = code
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }
      html += `<pre><code>${code}</code></pre>`;
    } else {
      let block = lines[i];
      while (++i < lines.length && lines[i].trim()) {
        block += lines[i] + '\n';
      }
      block = block.trim()

      function processInline(txt) {
        txt = txt.trim()
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        let html = '';
        for (let i = 0; i < txt.length; ++i) {
          if (txt[i] == '*') {
            let itxt = '';
            while (++i < txt.length && txt[i] != '*') {
              itxt += txt[i];
            }
            if (i >= txt.length) {
              console.error('unterminated italics.');
              process.exit(1);
            }
            html += `<em>${processInline(itxt)}</em>`
          } else if (txt[i] == '`') {
            let itxt = '';
            while (++i < txt.length && txt[i] != '`') {
              itxt += txt[i];
            }
            if (i >= txt.length) {
              console.error('unterminated code.');
              process.exit(1);
            }
            html += `<code>${itxt}</code>`
          } else if (txt[i] == '$') {
            let itxt = '';
            while (++i < txt.length && txt[i] != '$') {
              itxt += txt[i];
            }
            if (i >= txt.length) {
              console.error('unterminated inline math.');
              process.exit(1);
            }
            html += `<code>${katex.renderToString(itxt, {})}</code>`
          } else if (/^\[[^\]]*\]\([^\)]*\)/.test(txt.slice(i))) {
            const len = txt.slice(i).indexOf(')') + 1;
            html += txt.slice(i, i + len).replace(/^\[([^\]]*)\]\(([^\)]*)\)$/, '<a href="$2">$1</a>');
            i += len;
          } else {
            html += txt[i];
          }
        }
        return html;
      }

      // Could be display mode math, an image, a list, or just
      // paragraph.
      if (block.startsWith('\\[')) {
        html += katex.renderToString(
          block.replace(/^\\\[/, '').replace(/\\\]$/, ''),
          { displayMode: true }
        );
      } else if (block.startsWith('1.')) {
        html += '<ol>';
        for (const item of block.matchAll(/\d+\.(.*)\n?/g)) {
          html += `<li>${processInline(item[1])}</li>\n`;
        }
        html += '</ol>';
      } else if (block.startsWith('!')) {
        block = block
          .replace(/!\[([^\]]*)\]\(([^.]*)\.svg\)/g, `
            <a href="/media/$2.svg">
              <img
                loading="lazy"
                decoding="async"
                src="/media/$2.svg"
                alt="$1"
              />
            </a>
          `)
          .replace(/!\[([^\]]*)\]\((([^.]*)\.[^)]*)\)/g, `
            <a href="/media/$3-1280w.jpeg">
              <img
                loading="lazy"
                decoding="async"
                sizes="(max-width: 50em) 100vw, 50em"
                srcset="
                  /media/$3-320w.jpeg 320w,
                  /media/$3-640w.jpeg 640w,
                  /media/$3-1280w.jpeg 1280w
                "
                src="/media/$3-640w.jpeg"
                alt="$1"
              />
            </a>
          `);
        html += block;
      } else {
        html += `<p>${processInline(block)}</p>`;
      }
    }
  }

  return [frontmatter, html];
}

function renderWebpages(dir) {
  fs.readdirSync(dir).forEach(fp => {
    const absfp = path.join(dir, fp);
    if (fs.statSync(absfp).isDirectory()) {
      renderWebpages(absfp);
      return;
    }

    if (fp == 'index.html') {
      console.log(absfp);
      try {
        fs.mkdirSync(
          path.dirname(absfp.replace(/^src/, 'build')),
          { recursive: true }
        );
      } catch (_) { }
      fs.writeFile(
        absfp.replace(/^src/, 'build'),
        env.render(absfp, { posts, layout }),
        err => {
          if (err) {
            console.error(err);
            process.exit(1);
          }
        }
      );
    }
  });
}

function getAndRenderPosts() {
  fs.readdirSync('src/posts/').forEach(fp => {
    if (path.extname(fp) == '.post') {
      const [frontmatter, content] = tohtml(
        fs.readFileSync(`src/posts/${fp}`, 'utf8')
      );

      frontmatter['slug'] = fp.split('.', 2)[0];
      frontmatter['content'] = content;

      posts.push(frontmatter);

      if (!compileAll && 
        fs.statSync(path.join('src/posts/', fp)).mtime <
        fs.statSync(`build/posts/${fp.split('.', 2)[0]}/index.html`).mtime) {
        return;
      }

      const dir = `build/posts/${frontmatter['slug']}/`;
      try {
        fs.mkdirSync(dir);
      } catch (_) { }

      console.log(fp)

      fs.writeFile(
        `${dir}index.html`,
        env.render(`post-layout.html`, { post: frontmatter, layout }),
        err => {
          if (err) {
            console.error(err);
            process.exit(1);
          }
        }
      );
    }
  });
}

function compileImages() {
  fs.readdirSync('images/').forEach(fp => {
    const absfp = path.join('images/', fp);

    if (path.extname(fp) == '.svg') {
      console.log(fp);
      fs.readFile(absfp, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        fs.writeFile(
          path.join('static/media/', fp),
          svgo.optimize(data, { path: fp, multipass: true }).data,
          err => {
            if (err) {
              console.error(err);
              process.exit(1);
            }
          }
        );
      });
    } else {
      console.log(fp);
      function path_for(width) {
        return path.join(
          'static/media/',
          `${fp.split('.', 2)[0]}-${width}w.jpeg`
        );
      }
      sharp(absfp).resize(320).toFile(path_for(320));
      sharp(absfp).resize(640).toFile(path_for(640));
      sharp(absfp).resize(1280).toFile(path_for(1280));
    }
  });
}

compileImages();

let posts = [];
getAndRenderPosts();
posts.sort((a, b) => {
  return new Date(b['date']).getTime() - new Date(a['date']).getTime();
});
renderWebpages('src/');
