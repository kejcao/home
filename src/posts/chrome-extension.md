Writing a Chrome Extension to Count Open Tabs | 4 | 2023-06-04 | chrome,javascript

I was curious as to how many Google Chrome tabs I have open (I estimated at least 100) but I couldn't think of any way to have a precise count except to manually tally each tab—which with at least 100 tabs is going to be a very menial task, so I searched online for alternative solutions. I found a Stack Exchange [question](https://superuser.com/questions/967064/how-to-get-tab-count-in-chrome-desktop-without-app-extension) with many different answers but the only one that worked for me was the extension someone was promoting. I don't trust extensions (the only one I have is uBlock Origin), especially ones with low userbases. Beyond that I've never coded a web browser extension before so writing one that counts tabs seems like an easy first project to get into this area of development.

I wrote the extension in a night, extrapolating from Google Chrome's series of well-written introductory [articles](https://developer.chrome.com/docs/extensions/mv3/getstarted/) for people like me. My code is available on a [GitHub repo](https://github.com/kejcao/tabs). The extension shows the number of tabs you have open as text on a blue background below the icon. When you click on the icon it will show a popup with more information, including the number of windows, how many of which are incognito (this only works if you enable the extension on incognito windows) and the most commonly used sites you have open.

!tabs-chrome-extension.png

It isn't shown in the screenshot, but if you hover over the icon you should get a popup giving you a summary of how many tabs and windows are open.

## The Details

Every chrome extension needs to have a `manifest.json` file that describes what the extension is and should do. My extension is no exception:

```json
{
  "manifest_version": 3,
  "name": "Tabs",
  "description": "A small tool to count tabs and windows.",
  "author": "kejcao@proton.me",
  "version": "1.0",
  "icons": {
    "16": "tabs.png",
    "32": "tabs.png",
    "48": "tabs.png",
    "128": "tabs.png"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": "tabs.png"
  },
  "permissions": [
    "tabs"
  ],
  "background": {
    "service_worker": "background.js"
  }
}
```

I got the icon from some random stock photo site. Essentially all the code works by using the following two functions,

```js
chrome.tabs.query({}, tabs => { console.log(tabs); });
chrome.windows.getAll({}, wins => { console.log(wins); });
```

`tabs` is an array of tabs and `wins` is an array of windows. Each element in these arrays correspond to a tab or window and contain information about it. So, to get the number of tabs or windows we can simply get the length of the `tabs` or `wins` array in the callback. The first argument in those two functions is for filtering, which we don't do—after all we want to count all the tabs/windows.

Each element in the `wins` array contains the property `incognito`, a boolean value describing whether the window is incognito or not. So to get the number of incognito windows, we can simply do something like `wins.filter(w => w.incognito).length`.

To set the badge text (the little number on the bottom of the icon in a blue box) and the title (the text that pops up when you hover over the icon for a while) we can use the following functions,

```js
chrome.action.setBadgeText({ text: "10" });
chrome.action.setTitle({ title: "10 tabs" });
```

These functions are used in the `background.js` file, which I believe runs at the beginning of the extension. In the extension the `text` and `title` values are dynamic and depends on the result of `chrome.tabs.query` and `chrome.windows.getAll` so we need to run these functions every time a new tab or window appears or disappears, which ensures the numbers stay accurate. This is done by hooking event listeners, where the `update` function sets the badge text and title to the appropriate values.

```js
chrome.tabs.onCreated.addListener(update);
chrome.tabs.onRemoved.addListener(update);
chrome.windows.onCreated.addListener(update);
chrome.windows.onRemoved.addListener(update);
```

Each element in the array `tabs` contain additional properties such as `url` (note this only appears if we have `"permissions": ["tabs"]` in the manifest) so we can do something like this,

```js
let urls = {};
for (const t of tabs) {
  const host = new URL(t.url).hostname;
  if (!(host in urls)) {
    urls[host] = 0;
  }
  urls[host] += 1;
}
```

Where we make the dictionary `urls` where the keys are websites and the values are how many tabs are open to that website. We can sort this by number of tabs by first converting the dictionary to an array then sorting it,

```js
urls = Object.entries(urls).sort((lhs, rhs) => {
  return rhs[1] - lhs[1];
}).slice(0, 10);
```

Note that we take the top 10 results only, that's why we slice at the end. We can then iterate over this and print it or something.

I should mention that the layout for the popup window shown on the screenshot above is in the file `popup.html` which runs `popup.js` whom is responsible for fetching and filling in the dynamic information regarding tabs and windows.

Remember, all the code for the fully working extension is in my [GitHub repo](https://github.com/kejcao/tabs).
