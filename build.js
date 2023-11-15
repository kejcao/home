const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const hljs = require('highlight.js');
const babel = require('@babel/core');
const katex = require('katex');
const readline = require('readline');

const GLOBAL_LAYOUT_FILE = 'layout.html';
const POST_LAYOUT_FILE = 'src/post-layout.html';

let all = false, verbose = false;

function shouldUpdate(src, dest) {
  if (all) { return true; }
  try {
    return fs.statSync(src).mtime > fs.statSync(dest).mtime;
  } catch (_) {
    return true;
  }
}

let env = new nunjucks.Environment(new nunjucks.FileSystemLoader());

// env.addExtension('StyleExtension', new function() {
//   this.tags = ['style'];

//   this.parse = function(parser, nodes, lexer) {
//     const tok = parser.nextToken().value;
//     const args = parser.parseSignature(null, true);
//     parser.advanceAfterBlockEnd(tok);
//     const body = parser.parseUntilBlocks('endstyle');
//     parser.advanceAfterBlockEnd();
//     return new nodes.CallExtension(this, 'run', args, [body]);
//   };

//   this.run = function(context, body) {
//     return new nunjucks.runtime.SafeString(`<style>
//       ${postcss([require('postcss-preset-env'), require('postcss-minify')])
//         .process(body(), { from: undefined, to: undefined }).css}
//     </style>`);
//   };
// }());

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

env.addFilter('raw', str => {
  return env.renderString(str, this.ctx);
});

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
      if (txt[i] == '\\' && txt[i+1] == ending) {
        ++i;
      }
      content += txt[i];
    }
    return content;
  }

  for (; !finished(); ++i) {
    if (txt[i] == '\\') {
      html += escapeHTML(txt[i+1]);
      ++i;
      continue;
    }

    switch(txt[i]) {
      case '*':
        html += `<em>${renderInline(readUntil('*').replace(/\*/g, '\\*'))}</em>`;
        break;
      case '`':
        const data = readUntil('`');

        if (data.startsWith('!')) {
          html += `<kbd>${
            data.slice(1).split('+')
              .map(x => `<kbd>${x}</kbd>`).join('+')
          }</kbd>`;
          break;
        }

        html += `<code>${escapeHTML(data)}</code>`;
        break;
      case '$':
        html += `${katex.renderToString(readUntil('$'), {})}`;
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

async function toHTML(lines, update) {
  let html = [];

  async function readUntil(endings) {
    let block = [];
    while (true) {
      const {value, done} = await lines.next();
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
      } else if (line.startsWith('\\[')) {
        const latex = line.trim().endsWith('\\]')
          ? line.trim().slice(2, -2)
          : ([line].concat(await readUntil(['\\]']))).slice(1, -1).join('\n');
        html.push(katex.renderToString(latex, { displayMode: true }));
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
        html.push(`<h${size}>${renderInline(line.slice(size).trim())}</h${size}>`);
      } else if (line.startsWith('```') || line.startsWith('````')) {
        let wrap = line.startsWith('````');
        let block = [line].concat(await readUntil(wrap ? ['````'] : ['```']));
        const language = block[0].slice(wrap ? 4 : 3).trim();
        let code = block.slice(1, block.length - 1).join('\n');
        if (language != '') {
          code = hljs.highlight(code, { language }).value;
        } else {
          code = escapeHTML(code);
        }
        // To avoid Jinja misinterpretation as placeholder.
        code = code
          .replace(/{/g, '&lbrace;')
          .replace(/}/g, '&rbrace;');
        html.push(`<pre${
          wrap ? " style=\"white-space:pre-wrap\"" : ""
        }><code>${code}</code></pre>`);
      } else {
        let block = line;
        // while (true) {
        //   const {value, done} = await lines.next();
        //   if (value.trim() || done) { break; }
        //   block += value;
        // }

        if (block.startsWith('1.')) {
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

          let first = true;
          let paragraphs = [''];

          for (let line of block.split('\n')) {
            if (line.startsWith('- ')) {
              if (!first) {
                item += (`<li>${paragraphs.map(renderInline).map(p => {
                  return p;
                }).join(' ')
                  }</li>`);
                paragraphs = [''];
              }
              first = false;
            }
            line = line.replace(/^-/, '');
            if (!line.trim()) {
              paragraphs.push('');
            }
            paragraphs[paragraphs.length - 1] += line;
          }

          item += (`<li>${paragraphs.map(renderInline).map(p => {
            return p;
          }).join(' ')
            }</li>`);

          item += '</ul>';
          html.push(item);
        } else {
          html.push(`<p>${renderInline(block.replace('\n', ' '))}</p>`);
        }
      }
      if (!update) {
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

async function postToHTML(path, update=true) {
  function parseDate(s) {
    const [y,m,d] = s.split('-');
    return new Date(y, m-1, d);
  }

  const lines = linesOf(path);

  const frontmatter = ((await lines.next()).value).split('|');
  if (frontmatter.length != 3 && frontmatter.length != 4) {
    throw new Error('invalid frontmatter.');
  }

  let html = await toHTML(lines, update);
  return [{
    title: renderInline(frontmatter[0].trim()),
    desc: html[0] ?? '',
    date: parseDate(frontmatter[2].trim()).toLocaleDateString(
      'en-US', { year: "numeric", month: "short", day: "numeric"}),
    tags: (frontmatter.length == 4 ? frontmatter[3].split(',').map(x => x.trim()) : []).sort(),
  }, html.join('')];
}

function renderWebpages(dir, frontmatters) {
  fs.readdirSync(dir).forEach(fp => {
    const absfp = path.join(dir, fp);

    if (fs.statSync(absfp).isDirectory()) {
      renderWebpages(absfp, frontmatters);
      return;
    }

    if (fp == 'index.html') {
      if (verbose) {
        console.log(`rendering ${dir}`)
      }
      const out = absfp.replace(/^src/, 'build');
      try {
        fs.mkdirSync(
          path.dirname(out),
          { recursive: true }
        );
      } catch (_) { }

      try {
        fs.writeFile(
          out,
          env.render(absfp, { posts: frontmatters, layout: GLOBAL_LAYOUT_FILE }),
          err => {
            if (err) {
              console.error(err);
              process.exit(1);
            }
          }
        );
      } catch(e) {
        console.error(`${fp}: ${e}`)
      }
    }
  });
}

async function firstLines(path, n) {
  let lines = '';
  for await (const line of
    readline.createInterface({
      input: fs.createReadStream(path)
    })) {

    if (n-- <= 0) { break; }
    lines += line + '\n';
  }
  return lines;
}

async function renderPosts(past) {
  let frontmatters = past ? past : [];
  for (const fp of await fs.promises.readdir('src/posts/')) {
    const outdir = path.join('build/posts', path.parse(fp).name);
    const srcfp = path.join('src/posts', fp);

    if (path.extname(fp) == '.md') {
      const willUpdate = shouldUpdate(
        path.join('src/posts/', fp),
        path.join(outdir, 'index.html')
      );

      // render the post into HTML and parse metadata
      let frontmatter, content;
      try {
        [frontmatter, content] = await postToHTML(srcfp, willUpdate);
      } catch (e) {
        throw e;
        // console.error(`${fp}: ${e.message}`)
        // process.exit(1);
      }
      frontmatter['slug'] = path.parse(fp).name;
      frontmatter['content'] = content;
      frontmatters.push(frontmatter);

      // if we should update, then rewrite the HTML
      if (willUpdate) {
        if (verbose) {
          console.log(`rendering post ${fp}`)
        }
        try {
          await fs.promises.mkdir(outdir);
        } catch (_) { }
        await fs.promises.writeFile(
          path.join(outdir, 'index.html'),
          env.render(POST_LAYOUT_FILE, {
            post: frontmatter,
            layout: GLOBAL_LAYOUT_FILE
          }),
        );
      }
    }
  }
  return frontmatters;
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

let mutex = true;
module.exports = {
  build: async function () {
    if (mutex) {
      mutex = false;
      const org = process.cwd();
      process.chdir('/home/kjc/home');

      renderWebpages('src/', (await renderPosts()).sort((a, b) => {
        return new Date(b['date']).getTime() - new Date(a['date']).getTime();
      }));

      process.chdir(org);
      mutex = true;
    } else {
      console.log('no')
    }
  }
};

if (require.main == module) {
  all = true;
  (async () => {
    let start = performance.now();
    await module.exports.build();
    let duration = performance.now() - start;
    console.log(`finished in ${(duration / 1000).toFixed(2)} secs.`);
  })();
}
