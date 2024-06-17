const http = require('http');
const fs = require('fs');
const path = require('path');
const ws = require('ws');
const mime = require('mime-types')
const { execSync } = require('child_process');

let build = require('./build.js');
build.build();

async function URLPathToPath(fp) {
  if (!fp) { fp = 'index.html'; }
  fp = 'pub/' + fp;

  if ((await fs.promises.lstat(fp)).isDirectory()) {
    fp += '/index.html';
  }

  return fp;
}

const server = http.createServer(async (req, res) => {
  try {
    const fp = await URLPathToPath(req.url.slice(1));

    const mimetype = mime.lookup(fp);
    res.writeHead(200, headers = { 'Content-Type': mimetype });

    const content = await fs.promises.readFile(fp);
    if (mimetype != 'text/html') {
      res.end(await fs.promises.readFile(fp));
    } else {    // Inject javascript!
      const srcpath = path.join('src/', fp.slice(6));
      if (fs.existsSync(srcpath)) {
        // console.log('SRC', srcpath);
        // build.renderWebpage(srcpath);
      }

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
      // console.log(client.url)
      // console.log(new URL().pathname.slice(1));
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
// fs.watch('build.js', async (ev, path) => {
//   build = require('./build.js');
//   console.log('reloading build file')
// });
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
