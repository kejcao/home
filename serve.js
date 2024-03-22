const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const ws = require('ws');
const chokidar = require('chokidar');
const mime = require('mime-types')
const watch = require('node-watch');

// load mimetypes
// mimetypes = {}
// fs.readFile('/etc/mime.types')
//   .then(contents => {
//     for (const l of contents.toString().split('\n')) {
//       if (l[0] == '#' || !l.trim()) {
//         continue;
//       }
//       let [type, ...exts] = l.split(/\s+/);
//       for (const ext of exts) {
//         mimetypes['.' + ext] = type;
//       }
//     }
//   })
//   .catch(err => {
//     console.error(err);
//     process.exit(1);
//   });

// switch to alternative buffer and clear screen
/* process.stdout.write('\x1b[?1049h\x1bc'); */

/* process.on('beforeExit', code => { */
/*   console.log('\x1b[?1049l'); */
/* }); */

// start HTTP server
process.chdir('build');

const server = http.createServer(async (req, res) => {
  try {
    let fp = req.url.slice(1);
    if (!fp) { fp = 'index.html'; }
    if ((await fs.lstat(fp)).isDirectory()) {
      fp += '/index.html';
    }

    const mimetype = mime.lookup(fp);
    res.writeHead(200, headers = { 'Content-Type': mimetype });

    // inject javascript to interact with websocket server
    let contents = (
      mimetype == 'text/html'
        ? `<script>
new WebSocket('ws://' + location.host + '/ws')
  .onmessage = _ => location.reload();
        </script>` : ''
      ) + await fs.readFile(fp);

    res.end(contents);
  } catch (err) {
    res.writeHead(404);
    res.end(err.toString());
  }
});
server.listen(8000, 'localhost', () => { });

// start websocket server
const wss = new ws.Server({ server, path: '/ws' });

const build = require('./build.js');

watch('../src', { recursive: true }, async (e, file) => {
  console.log(e, file)
  try {
    if (await build.build()) {
      wss.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
          client.send('reload');
        }
      });
    }
  } catch (e) {
    console.log(e);
  }
});

