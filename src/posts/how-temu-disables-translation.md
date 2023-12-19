How Temu Disables Google Translate | 1 | 2023-12-18 | web,html,hack

My mum loves browsing the Chinese e-commerce store Temu but a big gripe she has is that Google translate doesn't work on the website. I was quite baffled at this issue and thought it might've been a bug in Google translate or something. But then I skimmed an entry on the [HTMHell](https://www.htmhell.dev/adventcalendar/2023/4/) advent calender and it mentions how the `translate` attribute can be "used to indicate whether an element should be translated or not." My synapses fired and I wondered if this was the reason Google translate refuses to translate Temu. I viewed the source code of the website and grepped for all instance of the phrase "translate" and lo and behold, among the irrelevant CSS properties, we find a single line of JavaScript code that disables translation for all elements.

```js
document.documentElement.translate = false;
```

A solution/workaround is trivial. For example, a simple Tampermonkey script can be used to counteract the code. Also, the Microsoft Outlook email interface suffers from the same problem because the document `html` tag has the `translate=no` attribute—which can be overwrote with the same workaround.

````js
// ==UserScript==
// @name         Enable Translation
// @namespace    http://tampermonkey.net/
// @version      2023-12-18
// @description  enable Google translate on Temu & Outlook
// @author       Kevin Cao
// @match        https://www.temu.com/*
// @match        https://outlook.live.com/mail/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=temu.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    document.documentElement.translate = true;
})();
````
