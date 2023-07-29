Viewing CSV Files | 3 | 2023-07-05 | linux

A CSV file is a file representing a table or 2D array by storing each row in its own line and separating columns with commas. For the rest of this post, I will consider a file that contains a table stored in columns separated by any delimiter, not just a comma, as a CSV file.

I sometimes need to take a peek at a large or wide CSV file—but when I try, it is very unclear what each row's columns correspond to. For example, the following CSV file from a 2019 Facebook data leak is a pile of indistinguishable gibberish. You can't tell what's what, there's no padding.

```
Phone Number::First Name:Last Name:Gender:Residence:Birth Place:Marital Status:Occupation:Join Date:::Email
12042029560:100028502372576:Barb:Hitching:female:Winnipeg, Manitoba:Winnipeg, Manitoba::Self-Employed:9/3/2018 12:00:00 AM::
12042029642:100023805675861:Sheldon:Fink:male:::::4/3/2019 12:00:00 AM::
12042050007:629430006:Cynthia:Brown:female:Winnipeg, Manitoba::::6/7/2018 12:00:00 AM::
12042050072:706920609:Mitchell:James:male:::::7/10/2017 12:00:00 AM::08/24
12042050077:100027346872216:Dirk:Sjoberg:male:::::1/1/0001 12:00:00 AM::
12042050085:100026825255757:Zahra:Moh:female:::::12/19/2018 12:00:00 AM::
12042050087:542043613:Brent:Lott:male:Beauséjour, Manitoba:Beauséjour, Manitoba::Self-Employed:11/4/2018 12:00:00 AM::
12042050092:100000711126229:Herb:Waldner Jr:male:Beauséjour, Manitoba:Beauséjour, Manitoba:::8/17/2015 12:00:00 AM::
12042050105:100034889205619:Sherrie Lynn:Wassing:female:::::3/20/2019 12:00:00 AM::
```

An easy way to remedy this problem (based off of a [Stack Overflow](https://stackoverflow.com/questions/1875305/view-tabular-file-such-as-csv-from-command-line) answer) is to pipe the contents of the file into the `column` command and specify the flags

- `-t` to format it into a table.
- `-s` to specify the delimiter.

Then pipe that through the pager `less` with the flags

- `-N` to display line numbers.
- `-S` to chop rather than wrap the lines.

For your convenience, you can put the following function into your `.bashrc`,

```
csvless() {
  [ $# == 1 ]                     \
    && column -ts "$1" | less -NS \
    || echo 'usage: csvless SEPERATOR' && return 1
}
```

Such that running the command `head -10 facebook-data.txt | csvless` yields the results the following image shows.

!example-of-csvless.png

For a remainder of `less` commands, use the arrow keys to move up and down by one line and to the left and right by half a screenful. Use Ctrl+B and Ctrl+F to move up and down by a half of a screenful. Q to exit. "/" (forward slash) to search for a particular word/phrase.
