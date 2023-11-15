Stylizing Keyboard Shortcuts on My Website | 3 | 2023-09-25 | ssg,web,html,js,meta

I was browsing Mozilla's fantastic [list of all HTML elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element) when I stumbled upon the `<kbd>` tag which I'd never heard of before. It's used to denote actual keyboard presses, presumably so the website can style them uniquely. I wanted to incorporate this tag into my SSG by stylizing keyboard shortcuts (as like little cute buttons) instead of printing them in just a monospace font.

To render my blog posts (including the one you're reading right now) I use a messy 400-line JavaScript file that—among its other responsibilities—converts my own Markdown-like markup language into HTML. The section responsible for applying a monospace font to text wrapped in backticks is tucked away in a `switch` statement.

```js
case '`':
  html += `<code>${escapeHTML(readUntil('`'))}</code>`;
  break;
```

I rewrote it such that if the starting backtick starts with an exclamation mark, then we interpret the following text as a keyboard shortcut. We split by the plus sign, and for each of these components we wrap them in a `<kbd>` tag; then we wrap the overall resulting string in a `<kbd>` tag.

```js
case '`':
  const data = readUntil('`');

  if (data.startsWith('!')) {
    html += `<kbd>${
      data.slice(1).split('+')
        .map(x => `<kbd>${x}</kbd>`).join('+')
    }</kbd>`;
    break;
  }

  html += `<code>${escapeHTML(data)}</code>`;
  break;
```

For example, if I wrote "`\`!Ctrl+K\``" it would be converted into:

```html
<kbd><kbd>Ctrl</kbd>+<kbd>K</kbd></kbd>
```

I then copied some CSS styling for the keyboard shortcuts from the [Mozilla article](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd) I was talking about into my own global CSS file. It produces a dainty little rounded gray box with a drop shadow: `!Ctrl+Z` and `!Ctrl+Shift+2`.

```css
kbd > kbd {
  background-color: #eee;
  border-radius: 3px;
  border: 1px solid #b4b4b4;
  box-shadow:
    0 1px 1px rgba(0, 0, 0, 0.2),
    0 2px 0 0 rgba(255, 255, 255, 0.7) inset;
  color: #333;
  display: inline-block;
  font-size: 0.85em;
  font-weight: 700;
  line-height: 1;
  padding: 2px 4px;
  white-space: nowrap;
}
```

I think it turned out really cute (`!C` `!U` `!T` `!E`) and I should add more features like this to my SSG to give my blog posts a little more pizzazz. Maybe I'll talk more about the internal details of SSG's operation.
