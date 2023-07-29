const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const hljs = require('highlight.js');
const babel = require('@babel/core');
const katex = require('katex');

const GLOBAL_LAYOUT_FILE = 'layout.html';
const POST_LAYOUT_FILE = 'post-layout.html';

function shouldUpdate(src, dest) {
  if (process.argv.length >= 3 && process.argv[2] == '-a') {
    return true;
  }
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

function toHTML(txt) {
  let lines = txt.split('\n');
  let ptr = 0;
  let html = [];

  function get(name, endings) {
    let block = [lines[ptr]];
    while (++ptr < lines.length) {
      if (endings.some(s => lines[ptr].startsWith(s))) {
        break;
      }
      block.push(lines[ptr]);
    }
    if (ptr >= lines.length) {
      throw new Error(`unterminated ${name}.`);
    }
    block.push(lines[ptr]);
    return block;
  }

  function escapeHTML(txt) {
    return txt
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderInline(txt) {
    let ptr = 0;

    function matchSpecial(c) {
      return (ptr >= txt.length || txt[ptr] == c) && (ptr <= 0 || txt[ptr - 1] != '\\');
    }

    function get(name, ending) {
      let content = '';
      while (++ptr < txt.length && !matchSpecial(ending)) {
        content += txt[ptr];
      }
      if (ptr >= txt.length) {
        throw new Error(`unterminated ${name}.`);
      }
      return content;
    }

    let html = '';
    for (ptr = 0; ptr < txt.length; ++ptr) {
      if (matchSpecial('*')) {
        html += `<em>${escapeHTML(renderInline(get('italics', '*')))}</em>`;
      } else if (matchSpecial('`')) {
        html += `<code>${escapeHTML(get('code', '`'))}</code>`;
      } else if (matchSpecial('$')) {
        html += `${katex.renderToString(get('math', '$'), {})}`;
      } else if (matchSpecial('[')) {
        const content = escapeHTML(renderInline(get('link', ']')));
        if (++ptr >= txt.length || !matchSpecial('(')) {
          throw new Error('malformed link.');
        }
        const url = escapeHTML(get('link', ')'));
        html += `<a href="${url}">${content}</a>`;
      } else {
        html += escapeHTML(txt[ptr]);
      }
    }
    return html;
  }

  try {
    for (ptr = 0; ptr < lines.length; ++ptr) {
      if (!lines[ptr].trim()) {
        continue;
      }

      if (lines[ptr].startsWith('<') || lines[ptr].startsWith('{%')) {
        if (/<\/.*?>$/.test(lines[ptr])) {
          html.push(lines[ptr]);
          continue;
        }
        html.push(get('raw code', ['</', '{%']).join('\n'))
      } else if (lines[ptr].startsWith('\\[')) {
        const latex = lines[ptr].endsWith('\\]')
          ? lines[ptr].slice(2, -2)
          : get('math block', ['\\]']).slice(1, -1).join('\n');
        html.push(katex.renderToString(latex, { displayMode: true }));
      } else if (lines[ptr].startsWith('!')) {
        const filename = lines[ptr].slice(1).trim();
        if (!fs.existsSync(`images/${filename}`)) {
          throw new Error(`${filename} does not exist.`);
        }
        html.push(`
          <a class="img" href="/media/${filename}">
            <img
              loading="lazy"
              decoding="async"
              src="/media/${filename}"
              alt="${path.basename(filename).replace('-', ' ')}"
            />
          </a>
        `);
      } else if (lines[ptr].startsWith('#')) {
        const size = lines[ptr].match(/^#*/)[0].length;
        if (size > 5) {
          throw new Error('too big of a header.');
        }
        html.push(`<h${size}>${renderInline(lines[ptr].slice(size).trim())}</h${size}>`);
        ++ptr;
      } else if (lines[ptr].startsWith('```')) {
        let block = get('code block', ['```'])
        if (block.join('').includes('\t')) {
          throw new Error('code block contains tabs.');
        }
        const language = block[0].slice(3).trim();
        let code = block.slice(1, block.length - 1).join('\n');
        if (language != '') {
          code = hljs.highlight(code, { language }).value;
        } else {
          code = escapeHTML(code);
        }
        html.push(`<pre><code>${code}</code></pre>`);
      } else {
        let block = lines[ptr] + '\n';
        while (++ptr < lines.length && lines[ptr].trim()) {
          block += lines[ptr] + '\n';
        }
        block = block.trim();

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
    }
  } catch (e) {
    e.message = `line ${ptr}: ${e.message}`;
    throw e;
  }
  return html;
}

function postToHTML(txt) {
  const lines = txt.split('\n');
  const frontmatter = lines.shift().split('|');
  if (frontmatter.length != 3 && frontmatter.length != 4) {
    throw new Error('invalid frontmatter.');
  }
  let html = toHTML(lines.join('\n'));
  return [{
    title: frontmatter[0].trim(),
    desc: html.slice(0, frontmatter[1]).join(''),
    date: frontmatter[2].trim(),
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
      const out = absfp.replace(/^src/, 'build');
      try {
        fs.mkdirSync(
          path.dirname(out),
          { recursive: true }
        );
      } catch (_) { }
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
    }
  });
}

function renderPosts() {
  let metadata = [];
  fs.readdirSync('src/posts/').forEach(fp => {
    if (path.extname(fp) == '.md') {
      console.log(fp)
      let frontmatter, content;
      try {
        [frontmatter, content] = postToHTML(
          fs.readFileSync(`src/posts/${fp}`, 'utf8')
        );
      } catch (e) {
        console.error(`${fp}: ${e.message}`)
        process.exit(1);
      }
      frontmatter['slug'] = path.basename(fp);
      frontmatter['content'] = content;
      metadata.push(frontmatter);

      const outdir = `build/posts/${frontmatter['slug']}/`;
      if (!shouldUpdate(
        path.join('src/posts/', fp),
        path.join(outdir, 'index.html')
      )) {
        return;
      }

      try {
        fs.mkdirSync(outdir);
      } catch (_) { }

      fs.writeFile(
        path.join(outdir, 'index.html'),
        env.render(POST_LAYOUT_FILE, { post: frontmatter, layout: GLOBAL_LAYOUT_FILE }),
        err => {
          if (err) {
            console.error(err);
            process.exit(1);
          }
        }
      );
    }
  });
  return metadata;
}

let start = performance.now()
const frontmatters = renderPosts();
frontmatters.sort((a, b) => {
  return new Date(b['date']).getTime() - new Date(a['date']).getTime();
});
renderWebpages('src/', frontmatters);
let duration = performance.now() - start;
console.log(`finished in ${(duration / 1000).toFixed(2)} secs.`);
