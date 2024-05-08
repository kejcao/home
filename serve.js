const http = require('http');
const fs = require('fs');
const path = require('path');
const ws = require('ws');
const mime = require('mime-types')
const build = require('./build.js');
const { execSync } = require('child_process');

const server = http.createServer(async (req, res) => {
  try {
    let fp = req.url.slice(1);  // Get rid of leading "/"
    if (!fp) { fp = 'index.html'; }
    fp = 'build/' + fp;
    // console.log(fp)

    if ((await fs.promises.lstat(fp)).isDirectory()) {
      fp += '/index.html';
    }
    const mimetype = mime.lookup(fp);
    res.writeHead(200, headers = { 'Content-Type': mimetype });

    // Inject javascript to interact with websocket server
    const content = await fs.promises.readFile(fp);
    if (mimetype != 'text/html') {
      res.end(await fs.promises.readFile(fp));
    } else {
      res.end(
        `<script>
new WebSocket('ws://' + location.host + '/ws')
  .onmessage = _ => location.reload();
        </script>` + content
      )
    }
  } catch (err) {
    res.writeHead(404);
    res.end(err.toString());
  }
});
server.listen(8008, 'localhost', () => { });

const wss = new ws.Server({ server, path: '/ws' });

async function rebuild() {
  try {
    await build.build();
    wss.clients.forEach(client => {
      if (client.readyState === ws.OPEN) {
        client.send('reload');
      }
    });
  } catch (e) {
    console.log(e);
  }
}

// Use node v22.1.0, see https://github.com/nodejs/node/issues/52018
let mutex = false;
fs.watch('src/', { recursive: true }, async (ev, path) => {
  if (path == 'input.css') {
    execSync('../css.sh');
  }
  if (!mutex) {
    mutex = true
    await rebuild();
    mutex = false;
  }
});
