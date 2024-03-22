A Node.js Script to Transfer Files Between Devices | 1 | 2024-03-03 | web,js

I use an iPad Mini 2 to read my eBooks. To transfer them onto the device from my laptop, I run a short Node.js script I wrote. I use it by navigating onto the webpage hosted at my private IP on port 8000 with the iPad's Safari browser, then clicking the links to download the files.

```js
import { encode } from 'html-entities';
import { createServer } from 'http';
import { lstat, readFile } from 'fs/promises';
import * as mime from 'mime-types';

const homepage = process.argv
    .slice(2)
    .map(x => `<a href="/${encodeURIComponent(x)}">${encode(x)}</a>`)
    .join('<br><br>\n');

const server = createServer(async (req, res) => {
    try {
        if (req.url == '/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(homepage);
        } else {
            const fp = decodeURIComponent(req.url.slice(1))
            if (!(await lstat(fp)).isFile()) {
                throw new Error(`${fs} not a file!`);
            }
            res.writeHead(200, { 'Content-Type': mime.lookup(fp) });
            res.end(await readFile(fp));
        }
    } catch (err) {
        res.writeHead(404);
        res.end(err.toString());
    }
});
server.listen(8000, '0.0.0.0', () => { });
```

JavaScript ain't so bad a language; very expressive and fun to work in when hacking together scripts like this. It would've been harder to implement this in Python then in Node.js, partly because Node.js is a language built specifically for web applications.

To preview and author my Markdown posts—like the one your reading right now—on my personal website, I have Node.js code that spins up a HTTP server much like in the code snippet above. However, it also runs a websocket server in the background. I inject a bit of JavaScript which waits for commands from the websocket server into each HTML page the HTTP one serves, so I can automatically refresh the page when changes are made to any post (which I store as Markdown files and render statically). It's basically poor man's live reloading.
