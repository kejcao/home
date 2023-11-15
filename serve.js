const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const ws = require('ws');
const chokidar = require('chokidar');
const build = require('./build.js');
const mime = require('mime-types')

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
    console.log(fp)

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
let con;
new ws.Server({ server, path: '/ws' })
  .on('connection', ws => { con = ws; });

chokidar.watch('../src', {})
  .on('change', async _ => {
      await build.build();
      console.log('reloaded')
      if (con) {
        con.send('reload');
      }
  });