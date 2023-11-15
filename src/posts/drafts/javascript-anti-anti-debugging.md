JavaScript Anti-Anti-Debugging: Bypassing Anti-Inspect Element Code | 4 | 2023-10-30 | javascript,web

Words cannot express my disdain for JavaScript anti-debugging techniques—techniques that use JavaScript code to prevent the users of a website from opening inspect element.

I exaggerate, of course. Although these techniques can be annoying at times as we will observe later on some of the techniques make creative use of legitimate features to detect the presence of inspect element.

For those unaware, pressing `!Ctrl+Shift+I` or right clicking then clicking "Inspect" toggles a panel on the side of the website that contains a lot of useful tools. It grants one the ability to see the DOM and how the elements' layouts are computed, all the GET and POST requests the site is making, and a whole bunch of other awfully useful features. If you didn't know this you probably wouldn't understand the rest of this article.

One of the simplest techniques one can come up with is to prevent the user from right clicking and hijacking the `!Ctrl+Shift+I` key. This method is hopelessly ineffect:

1. `Ctrl+Shift+C` and other keyboard shortcuts can all be used to bring up inspect element.
2. One can press the verticaly-stacked triple dots on the search bar's rightmost position. A menu will popup. Hover over "More tools" and press "Developer Tools" to bring up inspect element.

Now I want you to bring up inspect element on this page. Go to the console tab and type in the word "`debugger`" and run it. Notice how it all suddenly jumped to the "Sources" tab and says something like "Debugger paused?" We can run the `debugger` statement in a infinite loop, so that if inspect element is open it will be rendered useless. To bypass this we can just disable breakpoints by either pressing `!Ctrl+F8` in the Sources tab or clicking the icon on the top-right—it's right beside the pause and step over buttons.

Notice how opening inspect element causes a unnaturally swift change in the window's width size? We can write JavaScript code to detect this. To bypass, 
