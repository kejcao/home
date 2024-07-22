const DEBUG = true;

const http = require('http');
const fs = require('fs');
const path = require('path');
const ws = require('ws');
const mime = require('mime-types')
const build = require('./build.js');

build.build();

async function URLPathToPath(fp) {
  if (!fp) { fp = 'index.html'; }
  fp = 'pub/' + fp;
  if ((await fs.promises.lstat(fp)).isDirectory()) {
    fp += '/index.html';
  }
  return fp;
}

// This is a multiset storing the URLs the websocket clients are on. Basically,
// they are the webpages that the developer is currently viewing, that we need
// to re-render.
let watched_pages = {}

const server = http.createServer(async (req, res) => {
  try {
    const fp = await URLPathToPath(req.url.slice(1));
    const content = await fs.promises.readFile(fp);

    const mimetype = mime.lookup(fp);
    res.writeHead(200, headers = { 'Content-Type': mimetype });

    // Inject JS if is HTML, otherwise just serve normally.
    if (mimetype != 'text/html') {
      res.end(content);
    } else {
      const clientCode = () => { // Inject this JS code into the HTML page.
        const ws = new WebSocket('ws://' + location.host + '/ws');

        // When the websocket connection opens, register the URL into
        // watched_pages.
        ws.onopen = () => ws.send('A' + window.location.pathname);

        ws.onmessage = _ => location.reload(); // reload when commanded to by server

        // Right before the websocket connection closes, deregister the URL
        // from the watched_pages multiset.
        window.addEventListener("beforeunload", _ => { ws.send('C' + window.location.pathname) });
      };
      res.end(`<script>(${clientCode})()</script>` + content)
    }
  } catch (err) {
    res.writeHead(404);
    res.end(err.toString());
  }
});
server.listen(8008, 'localhost', () => { });

const wss = new ws.Server({ server, path: '/ws' });
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    data = data.toString();
    const path = data.slice(1);
    if (!(path in watched_pages)) {
      watched_pages[path] = 0;
    }

    if (data[0] == 'C') {
      watched_pages[path] -= 1;
    } else if (data[0] == 'A') {
      watched_pages[path] += 1;
    } else { throw new Error('fuck') }
  });
});

async function rebuild() {
  try {
    await build.build();
    wss.clients.forEach(async (client) => {
      if (client.readyState === ws.OPEN) {
        client.send('reload');
      }
      for (const [p, count] of Object.entries(watched_pages)) {
        if (count > 0) {
          try { // lazy fuck. Check if path exists. TODO
            await build.renderWebpage(path.join('src', p.slice(1), 'index.html'));
          } catch (e) {
          }
        }
      }
    });
    if (DEBUG) {
      console.log('watched_pages', watched_pages)
    }
  } catch (e) {
    console.log(e);
  }
}

// Use node v22.1.0, see https://github.com/nodejs/node/issues/52018
let mutex = false;
fs.watch('src/', { recursive: true }, async (ev, path) => {
  // If user saves files too quickly, two rebuilds might occur at the same
  // time. This might cause conflict, we don't want it so we have a "mutex."
  if (!mutex) {
    mutex = true
    await rebuild();
    mutex = false;
  }
});
