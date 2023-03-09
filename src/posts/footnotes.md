title: Fixing A Don Quixote EPUB Book's Footnotes
 desc: Repairing a Don Quixote (Grossman's translation) EPUB book's footnotes by using another copy of the same book.
 date: 2022-10-07

I wanted to read Don Quixote, specifically the Grossman translation, but I couldn't find any high-quality eBook copies. The majority of the copies I previewed had their footnotes jumbled up, but I really wanted the translator's commentary. After searching more, I found a copy with proper footnotes, but the formatting was abysmal—the text was unreadably minuscule in some places, and the table of contents contained a total of seven nonsensical entries. I took it upon myself to somehow extract the proper footnotes from this and overlay them on a copy with better formatting.

EPUB is a very common file format for eBooks. EPUB files are really just packed websites; EPUB files are ZIP archives, and so unzipping them with `unzip ebook.epub -d ebook/` would reveal HTML and CSS files, much like a website. However, a EPUB file has three additional, special files: the `toc.ncx` documentating the table of contents; a file ending in `.opf` listing all the files and what order to display them in; and the `mimetype` file containing `application/epub+zip` which states that this is, in fact, an EPUB file.

To repack an EPUB file, you can't just zip it back up again. You need to first zip the `mimetype` file without compression and without file attributes. `mimetype` must be there so as to immediately announce the file as an EPUB. Only then can you add the rest of your files to the zip archive. To do all that, you run `zip -Xr "../ebook.epub" mimetype $(ls | sed '/^mimetype$/d')` in the directory you unzipped your EPUB to. The `-X` flag ensures ZIP doesn't store any attributes, and `-r` means to zip recursively. We copy `mimetype` first, then everything else.

Now, every EPUB copy of Don Quixote looks to be converted from the original MOBI (yet another eBook file format) because a lot of classes and ids in the HTML have "calibre" contained in them, and Calibre is a common tool used for conversion between eBook formats. Also, I checked, the MOBI copy has the same footnotes problem as the EPUB copies, and besides, I can't get the MOBI copies to display on an old iPad of mine which I use as a makeshift eReader. I didn't try fixing the footnotes for the MOBI file because MOBI files aren't as easy to manipulate as EPUB files are.

I unzipped two EPUB copies of Don Quixote, one with good formatting into the folder `don-quixote-good` and the copy with the appropriate footnotes into `don-quixote`.

`don-quixote` has a subdirectory `content/` and in this subdirectory are hundreds of HTML files named `Don_Quixote_split_xxx.html` where `xxx` is a number. Two of those HTML files are behemoth volumes; a few are the epigraph, prologue, and introductions. The rest are all individual footnotes.

Also, I encountered this curious HTML code when browsing the two big volumes.

```html
<blockquote class="calibre_class_19">
  <blockquote>
    <blockquote>
      <blockquote>
        <blockquote>
          <blockquote>
            <blockquote class="calibre_class_20">my trappings are my weapons,</blockquote>
          </blockquote>
        </blockquote>
      </blockquote>
    </blockquote>
  </blockquote>
</blockquote>
```

Every single line of every poem is entombed in this pyramid of unnecessary `<blockquote>` HTML tags. I suspect it's an artifact of the translation from MOBI to EPUB.

`don-quixote-good` has many reasonably named and organized HTML files at the top level directory. There is the `translatornote.html` file, the `praise.html` file, the `introduction.html` file, and the volumes are split up into chapters named in the pattern `vol1_chap_xx.html`, where `vol1` may be `vol2` and `xx` is the chapter number.

When I was exploring the two eBooks, I found the source of the problem: The superscript `<a>` tags which would bring me to a footnote whenever clicked, were linking to the wrong footnotes. So severe was the degree they were scrambled that they were overlapping each other—multiple `<a>` tags were linking to the same footnotes. I couldn't find any pattern to the madness; they appeared to be randomly muddled, so the only way I saw forward was to rip out the footnotes from the copy with the good formatting, replacing them then re-linking the `<a>` tags to these footnotes. The following is the script I wrote to perform this footnote transplant.

```py
from bs4 import BeautifulSoup

def read_footnote(path: str) -> str:
    """
    Get just the footnote, without HTML, from the copy with bad
    formatting.
    """
    footnote = ''
    with open(path) as fp:
        bs = BeautifulSoup(fp.read(), 'html.parser')
        for text in bs.find_all('span', class_='calibre_class_5'):
            if (text.span is not None and
                'italic' in text.span['class']):

                footnote += f'<i>{text.text.strip()}</i> '
            else:
                footnote += text.text.strip() + ' '
    if footnote.split(' ')[0][-1] != '.':
        footnote = footnote.replace(' ', '. ', 1)
    return footnote.strip()

def read_footnotes(paths: list[str]) -> list[str]:
    """
    Go through the paths in order and get all the footnote files
    they link to. Get the footnote with the HTML, just as a
    string, and add that to the list.
    """
    footnotes = []
    for path in paths:
        with open(path) as fp:
            bs = BeautifulSoup(fp.read(), 'html.parser')
            for block in bs.find_all(('p', 'blockquote')):
                for footnote in block.find_all('a', recursive=False):
                    if 'calibre_class_5' in footnote.span['class']:
                        href_without_id = footnote['href'].split('#')[0]
                        footnotes.append(read_footnote(
                            f'don-quixote/content/{href_without_id}'))
    return footnotes

def write_footnote(footnote: str, path: str):
    """
    Ornament the footnote with HTML, then write it to the path.
    """
    with open(path, 'w') as fp:
        fp.write(f'''
<?xml version='1.0' encoding='utf-8'?>
<html xmlns="http://www.w3.org/1999/xhtml">
 <body class="text">
  <p class="footnote" id="{path.split("/")[-1].removesuffix(".html")}">
   <span class="footnotePara">{footnote}</span>
  </p>
 </body>
</html>
        '''.strip())

def write_footnotes(footnotes: list[str], paths: list[str]):
    """
    Go through the paths in order and find the footnotes. Every
    footnote found will be replaced sequentially by a footnote in
    the footnotes list.
    """
    i = 0
    for path in paths:
        with open(path) as fp:
            bs = BeautifulSoup(fp.read(), 'html.parser')
            for block in bs.find_all(('p', 'blockquote', 'h2')):
                for footnote in block.find_all('sup', recursive=True):
                    assert (int(footnotes[i].split('.')[0]) ==
                            int(footnote.span.a.text))

                    footnote.span.a["href"] = f'footnote{i:03}.html'
                    write_footnote(footnotes[i],
                       f'don-quixote-good/{footnote.span.a["href"]}')
                    i += 1

        with open(path, 'w') as fp:
            fp.write(str(bs))

    assert len(footnotes) == i
    print(i)

def link_footnotes(src: list[str], dest: list[str]):
    write_footnotes(read_footnotes(src), dest)

link_footnotes([
    'don-quixote/content/Don_Quixote_split_5.html',  # prologue
    'don-quixote/content/Don_Quixote_split_6.html',  # epigraph
    'don-quixote/content/Don_Quixote_split_7.html',  # volume 1
    'don-quixote/content/Don_Quixote_split_9.html',  # header to volume 2
    'don-quixote/content/Don_Quixote_split_10.html', # prologue
    'don-quixote/content/Don_Quixote_split_11.html', # volume 2
], [
    'don-quixote-good/Prologue.html',
    'don-quixote-good/epigraph.html',
    *[f'don-quixote-good/vol1_chap_{i:02}.html' for i in range(1, 53)],
    'don-quixote-good/VOLUME_2.html',
    'don-quixote-good/vol2_prologue.html',
    *[f'don-quixote-good/vol2_chap_{i:02}.html' for i in range(1, 75)],
])
```

The `assert`s are there to ensure that the footnotes are synced up. After running the script, I repacked the `don-quixote-good` directory and now I have a proper, pristine copy of Don Quixote to enjoy!

Also, a trick: To transfer eBooks between the iPad I use for reading and my computer, I have an `index.html` file in my home folder. I wrote a bash script to append a link to the `index.html` file whenever ran.

```bash
#!/bin/bash

set -e

cd ~
fp=$(fzf)
hf=$(echo $fp | he)
echo "<!-- $fp --><a href='$hf'>$hf</a><br>" >> index.html
```

It goes into my home folder, then envokes `fzf` which prompts me to select a eBook from somewhere. The filename needs to be escaped so it's piped into the `he` command, which converts every character into a HTML entity. A HTML entity looks something like "`&#60`" which represents the "&amp;lt;" character.

The `he` command is actually a C program I wrote.

```c
#include <stdio.h>
#include <wchar.h>
#include <locale.h>

int main(void) {
	setlocale(LC_ALL, "");
	wint_t wch;
	while((wch=fgetwc(stdin)) != WEOF) {
		printf("&#%d;", wch);
	}
	puts("");
}
```

Then compiled with `gcc main.c -O3 -o he` and turned into a globally executable program by creating a hard link to `/usr/bin/` with `sudo ln he /usr/bin/he`. Finally, the script, using the information, prints out a comment with the original, unescaped filename (so I can manually delete eBooks from the list when I'm done downloading them) then the download link.

Once I've added eBooks, I run `python3 -m http.server` on my computer then `ip a` to find my computer's IP address. I enter this IP address into the searchbar of the Safari browser on my iPad and just click on the links that popup to download them onto the iPad.
