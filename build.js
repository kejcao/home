const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const hljs = require('highlight.js');
const babel = require('@babel/core');
const postcss = require('postcss');
const readline = require('readline');
const { convert } = require('html-to-text');

const GLOBAL_LAYOUT_FILE = 'layout.html';
const POST_LAYOUT_FILE = 'src/post-layout.html';

let renderAll = false;

function shouldUpdate(src, dest) {
  if (renderAll) { return true; }
  try {
    return fs.statSync(src).mtime > fs.statSync(dest).mtime;
  } catch (_) {
    return true;
  }
}

let env;
function initNunjucks() {
  env = new nunjucks.Environment(new nunjucks.FileSystemLoader());

  env.addExtension('StyleExtension', new function() {
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
      ${postcss([require('postcss-preset-env'), require('postcss-minify')])
          .process(body(), { from: undefined, to: undefined }).css}
    </style>`);
    };
  }());

  env.addExtension('ScriptExtension', new function() {
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
  }());

  env.addFilter('raw', str => {
    return env.renderString(str, this.ctx);
  });
}

// env.addExtension('ImageExtension', new function() {
//   this.tags = ['img'];

//   this.parse = function(parser, nodes, lexer) {
//     const tok = parser.nextToken().value;
//     const args = parser.parseSignature(null, true);
//     parser.advanceAfterBlockEnd(tok);
//     const body = parser.parseUntilBlocks('endimg');
//     parser.advanceAfterBlockEnd();
//     return new nodes.CallExtension(this, 'run', args, [body]);
//   };

//   this.run = function(context, src, alt, body) {
//     return new nunjucks.runtime.SafeString(`
//       <a class="img" href="/media/${src}-1280w.jpeg">
//         <img
//           loading="lazy"
//           decoding="async"
//           sizes="(max-width: 50em) 100vw, 50em"
//           srcset="
//             /media/${src}-320w.jpeg 320w,
//             /media/${src}-640w.jpeg 640w,
//             /media/${src}-1280w.jpeg 1280w
//           "
//           src="/media/${src}-640w.jpeg"
//           alt="${alt}"
//         />
//       </a>
//     `);
//   };
// }());

function escapeHTML(txt) {
  return txt
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderInline(txt) {
  let i = 0;
  let html = '';

  function finished() {
    return i >= txt.length;
  }

  function readUntil(ending) {
    let content = '';
    while (txt[++i] != ending) {
      if (finished()) {
        throw new Error(`unterminated inline block "${ending}".`);
      }
      if (txt[i] == '\\' && txt[i + 1] == ending) {
        ++i;
      }
      content += txt[i];
    }
    return content;
  }

  for (; !finished(); ++i) {
    if (txt[i] == '\\') {
      html += escapeHTML(txt[i + 1]);
      ++i;
      continue;
    }

    switch (txt[i]) {
      case '*':
        html += `<em>${renderInline(readUntil('*').replace(/\*/g, '\\*'))}</em>`;
        break;
      case '`':
        const data = readUntil('`');

        if (data.startsWith('!')) {
          html += `<kbd>${data.slice(1).split('+')
            .map(x => `<kbd>${x}</kbd>`).join('+')
            }</kbd>`;
          break;
        }

        html += `<code>${escapeHTML(data)}</code>`;
        break;
      case '$':
        html += `$${readUntil('$')}$`;
        break;
      case '[':
        const content = renderInline(readUntil(']'));
        if (txt[++i] != '(' || finished()) {
          throw new Error('malformed link.');
        }
        const url = escapeHTML(readUntil(')'));
        html += `<a href="${url}">${content}</a>`;
        break;
      default:
        html += escapeHTML(txt[i]);
    }
  }
  return html;
}

async function toHTML(lines, preview = false) {
  let html = [];

  async function readUntil(endings) {
    let block = [];
    while (true) {
      const { value, done } = await lines.next();
      if (done) {
        throw new Error(`unterminated block "${endings}".`);
      }
      if (endings.some(s => value.startsWith(s))) {
        block.push(value);
        return block;
      }
      block.push(value);
    }
  }

  try {
    for await (const line of lines) {
      if (!line.trim()) { continue; }

      if (line.startsWith('<') || line.startsWith('{%')) {
        if (/<\/.*?>$/.test(line) || /<.*?\/>$/.test(line)) {
          html.push(line);
          continue;
        }
        html.push(([line].concat(await readUntil(['</', '{%']))).join('\n'))
      } else if (line.startsWith('$$')) {
        let latex = line.trim().length > 2 && line.trim().endsWith('$$')
          ? line.trim().slice(2, -2)
          : ([line].concat(await readUntil(['$$']))).slice(1, -1).join('\n').trim();
        if (!latex.startsWith('\\begin') && latex.includes('\\\\\n')) {
          latex = `\\begin{gathered}${latex}\\end{gathered}`;
        }
        html.push(`<p>$$${latex}$$</p>`);
      } else if (line.startsWith('!')) {
        let filename = line.slice(1).trim();
        if (!fs.existsSync(`images/${filename}`)) {
          throw new Error(`${filename} does not exist.`);
        }
        if (path.parse(filename).ext == '.png') {
          filename = `${path.parse(filename).name}.jpg`;
        }
        html.push(`
          <a class="img" href="/static/media/${filename}">
            <img
              loading="lazy"
              decoding="async"
              src="/static/media/${filename}"
              alt="${path.parse(filename).name.replace(/-/g, ' ')}"
            />
          </a>
        `);
      } else if (line.startsWith('#')) {
        const size = line.match(/^#*/)[0].length;
        if (size > 5) {
          throw new Error('too big of a header.');
        }
        html.push(`<h${size + 1}>${renderInline(line.slice(size).trim())}</h${size + 1}>`);
      } else if (line.startsWith('```') || line.startsWith('````')) {
        let wrap = line.startsWith('````');
        let block = [line].concat(await readUntil(wrap ? ['````'] : ['```']));
        let language = block[0].slice(wrap ? 4 : 3).trim();
        let expand = false;

        if (language.split(' ')[1] == 'EXP') {
          expand = true;
          language = language.split(' ')[0];
        }

        let code = block.slice(1, block.length - 1).join('\n');
        if (language != '' && language != 'pseudo') {
          code = hljs.highlight(code, { language }).value;
        } else {
          code = escapeHTML(code);
        }

        // To avoid Jinja misinterpretation as placeholder.
        if (language != 'pseudo') {
          code = code
            .replace(/{/g, '&lbrace;')
            .replace(/}/g, '&rbrace;');
        }

        let attributes = [];
        if (wrap) {
          attributes.push('style="hyphens:none; text-align:start; white-space:pre-wrap; word-wrap:break-word"');
        }
        if (language == 'pseudo') {
          attributes.push('class="pseudocode"')
        } else {
          code = `<code>${code}</code>`
        }

        let tmp = `<pre ${attributes.join(' ')}>${code}</pre>`
        if (!expand) {
          html.push(tmp);
        } else {
          html.push(`<details><summary>Click me to see code!</summary>${tmp}</details>`);
        }
      } else {
        let block = line + '\n';
        while (true) {
          const { value, done } = await lines.next();
          if (done || !value.trim()) { break; }
          block += value + '\n';
        }
        block = block.trim()

        if (block == '---') {
          html.push('<hr>');
        } else if (block.startsWith('1.')) {
          let item = '';
          item += '<ol>';
          for (const i of block.matchAll(/\d+\.(.*)\n?/g)) {
            item += `<li>${renderInline(i[1])}</li>\n`;
          }
          item += '</ol>';
          html.push(item);
        } else if (block.startsWith('- ')) {
          let item = '';
          item += '<ul>';

          for (let line of block.split('\n')) {
            if (!line.startsWith('- ')) {
              throw new Error('invalid list');
            }
            item += `<li>${renderInline(line.replace(/^-/, ''))}</li>`;
          }

          item += '</ul>';
          html.push(item);
        } else {
          html.push(`<p>${renderInline(block.replace('\n', ' '))}</p>`);
        }
      }
      if (preview) {
        break;
      }
    }
  } catch (e) {
    // e.message = `line ${i+1}: ${e.message}`;
    throw e;
  }
  return html;
}

async function* linesOf(path) {
  for await (const line of
    readline.createInterface({
      input: fs.createReadStream(path)
    })) {

    yield line;
  }
}

function render(src, vars) {
  try {
    return env.render(src, vars);
  } catch (e) {
    throw new Error(`${e}`)
  }
}

async function postToHTML(path) {
  function parseDate(s) {
    const [y, m, d] = s.split('-');
    return new Date(y, m - 1, d);
  }

  const lines = linesOf(path);

  const frontmatter = ((await lines.next()).value).split('|');
  if (frontmatter.length != 4) {
    throw new Error('invalid frontmatter.');
  }

  let html = await toHTML(lines);
  return {
    title: renderInline(frontmatter[0].trim()),
    desc: html[0] ?? '',
    plainDesc: convert(html[0] ?? ''),
    date: parseDate(frontmatter[2].trim()).toLocaleDateString(
      'en-US', { year: "numeric", month: "short", day: "numeric" }),
    tags: (frontmatter.length == 4 ? frontmatter[3].split(',').map(x => x.trim()) : []).sort(),
    content: html.join(''),
  };
}

let blogPosts = [];
async function renderWebpage(absfp) {
  const start = performance.now()
  const out = absfp.replace(/^src/, 'pub');

  try {
    await fs.promises.mkdir(path.dirname(out), { recursive: true });
  } catch (_) { }

  await fs.promises.writeFile(
    out,
    render(absfp, {
      posts: blogPosts,
      last_build: new Date().toISOString(),
      layout: GLOBAL_LAYOUT_FILE
    }),
  );

  const duration = performance.now() - start;
  console.log(`rendered ${absfp} in ${(duration / 1000).toFixed(2)} secs`)
}

async function renderWebpages(src) {
  for (const fp of await fs.promises.readdir(src)) {
    const absfp = path.join(src, fp);

    if (fs.statSync(absfp).isDirectory()) {
      renderWebpages(absfp);
      continue;
    }

    if (fp == 'index.html') {
      const out = absfp.replace(/^src/, 'pub');
      if (shouldUpdate(absfp, out)) {
        renderWebpage(absfp);
      }
    }
  }
}

let cache = {};
async function renderBlogPosts() {
  blogPosts = [];
  for (const fp of await fs.promises.readdir('src/posts')) {
    const outdir = path.join('pub/posts', path.parse(fp).name);
    const srcfp = path.join('src/posts', fp);

    if (path.extname(fp) == '.md') {
      const needToUpdate = shouldUpdate(
        path.join('src/posts/', fp),
        path.join(outdir, 'index.html')
      );

      let blogPost;
      if (!needToUpdate && cache.hasOwnProperty(fp)) {
        blogPost = cache[fp]
      } else {
        try {
          blogPost = await postToHTML(srcfp);
          cache[fp] = blogPost;
        } catch (e) {
          throw new Error(`${fp}: ${e.message}`);
        }
      }

      blogPost['slug'] = path.parse(fp).name;
      blogPosts.push(blogPost);

      if (needToUpdate) {
        try {
          await fs.promises.mkdir(outdir, { recursive: true });
        } catch (_) { }

        await fs.promises.writeFile(
          path.join(outdir, 'index.html'),
          render(POST_LAYOUT_FILE, {
            post: blogPost,
            layout: GLOBAL_LAYOUT_FILE
          }),
        );
      }
    }
  }
  blogPosts = blogPosts.sort((a, b) => {
    return new Date(b['date']).getTime() - new Date(a['date']).getTime();
  });
}

// function test() {
//   function assertEq(a, b) {
//     if (a != b) {
//       throw new Error(`'${a}' != '${b}'`);
//     }
//   }
//   try {
//     assertEq(renderInline('\\`*`test`*\\*\\$ <doo'), '`<em><code>test</code></em>*$ &lt;doo');
//     assertEq(renderInline('[\\[(te\\]s*t*)](url)'), '<a href="url">[(te]s<em>t</em>)</a>');
//     assertEq(renderInline('*\\*d\\`* `2\\``'), '<em>*d`</em> <code>2`</code>');
//   } catch(e) {
//     throw new Error(`assertion fail(): ${e}`);
//   }
// }
// test()

module.exports = {
  renderWebpage: renderWebpage,
  build: async function() {
    let start = performance.now();
    initNunjucks();

    await renderBlogPosts();
    await renderWebpages('src/');

    let duration = performance.now() - start;
    console.log(`finished rendering webpages in ${(duration / 1000).toFixed(2)} secs.`);
  }
};

if (require.main == module) {
  renderAll = true;
  (async () => {
    await module.exports.build();
  })();
}
