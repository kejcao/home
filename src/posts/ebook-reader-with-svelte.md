Writing an eBook Reader with Svelte | 1 | 2023-11-15 | web,svelte,html,css

I wrote an online eBook reader with Svelte. I deployed it with Vercel and you can try it out yourself on [ebookreader-nine.vercel.app](https://ebookreader-nine.vercel.app/). Try it with a copy of *Pride & Prejudice* or supply your own ePub file. Once in the eBook reader, press `!t` to toggle the table of contents panel. On the bottom right is your percentage progress through the book. On the bottom left is your progress through the chapter.

I used the epub.js library to parse ePub files and localForage to store it. Writing this project has forced me to learn quite a few exciting things about Svelte and I suppose modern web development in general. Writing projects is an excellent way of learning anything new, as you naturally discover how features can be used versus learning those features without any practical motivation. Svelte is awesome and it makes me want to ditch the couple homegrown Node.js files I use to statically render this website. Let me a list a few things I've learned:

- `on:` directives can be used on elements like `<svelte:window />` and `<svelte:document />` as opposed to manually adding and removing event listeners on mount.
- A recursive component can be written to render a recursive data structure (like a table of contents, with headings that expand into more subheadings) into a flat list.
- The special label `$:` can be used to run JavaScript when variables change. I used it to disable scroll on the body element if the table of contents panel is open.
- By default CSS selectors in style tags don't "leak" in that they don't affect elements outside the component they exist in. You can however change this behaviour by wrapping the selector in `:global()`.

The epub.js library is finicky to work with (mostly because of lack of documentation, I had to consult source code) and hasn't been updated since sometime in May 2023, despite having ~400 GitHub issues. Let me express my grievances by describing a problem I faced early on. In my eBook reader you can click on one of the chapter headings in the table of contents to jump to that chapter. This should be easy to get working, in fact it's just this bit of code where the jump happens with a single call to `rendition.display()`.

```html
<div {href}
    on:click|preventDefault={() => {
        rendition.display(href);
        dispatch('close');
    }}
>
    <a id="chap-{id}">{label.trim()}</a>
</div>
```

And it works to an extent. It doesn't exactly land on the chapter, rather it lands somewhere near it, like on the start of the previous one. I thought it was a bug in the library, so I forked then `npm link`'d it and made incremental adjustments, all to no avail. In the end, I determined the problem to be in a function that prepends chapters. It was abruptly changing the scroll position, causing the viewer to go somewhere else. I Googled solutions to prevent a prepended DOM element from affecting the scroll position and eventually read a [Stack Overflow answer](https://stackoverflow.com/questions/48387255/add-remove-elements-to-either-side-of-dom-without-affecting-scroll-position) that suggested I add a bit of CSS.

```css
:global(.epub-container *) {
    overflow-anchor: none !important;
}
```

And this somehow makes everything work. Debugging that problem was a frustrating couple hours. I like developing applications in Svelte—granted it's the only web framework I know (maybe I should learn another?) but it has been a mostly enjoyable experience that is way superior to if I wrote everything in plain HTML and CSS.

I'm no UI designer and haven't the motivation to make it more intuitive or mobile friendly. Occasionally the viewer flickers and other bugs abound, but unfortunately I can't do much to fix most of those without delving into the internals of the epub.js library which I have no interest in doing whatsoever. It has been a really pleasant and didactic experience working with Svelte. I'll probably use it again in a future project, maybe on a website to automatically crack substitution ciphers?
