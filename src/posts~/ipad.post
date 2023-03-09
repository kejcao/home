title: Having Fun with an iPad
 desc: Poking and peeking into the internals of an iPad Mini 2.
 date: 2022-12-04

I have an iPad Mini 2 that I use to read eBooks. I transfer the books to and from my iPad using the technique I outlined on one of my recent posts: I create a temporary HTTP server on my desktop that broadcasts a `index.html` file with a list of hyperlinks, then I click on one of them from the iPad to download the book. It took me a ludicrous amount of time to find out that you could mount the iPad just like any other USB. The Arch Linux Wiki has a guide­as it does for everything­on iOS. I followed the Wiki's instructions:

1. I installed `libimobiledevice` and `usbmuxd`, both of which I apparently already had.
2. I ran `idevicepair pair`. The command exited, printing something like "please trust the device," then a little bubbly box pops up on the center of my iPad, asking me whether it should trust the device. I clicked "trust." I ran the pairing command again. It doesn't print out an error, which I assumed meant the pairing went well.
3. I mounted it, with `ifuse ~/ipad`. It worked!

I `cd`'d into the directory and there these subdirectories stood,

```bash
$ ls
Books  DCIM  Downloads  iTunes_Control  PhotoData  Photos  Radio
```

Inside the directory `DCIM` was the subdirectory `100APPLE` and inside that directory were all of my photos and videos, in JPG and MOV format. Inside the directory `Books` was a subdirectory `Purchases` which contained all the books I had on my iPad. This is all merry and exciting but I wanted to use my iPad, in addition as a ebook reader, also as a MP3 player. I wanted to listen to audiobooks or music outside while sunbathing, but I can't well tug my heavy PC out everytime I did this. There wasn't an obvious folder to store audio, but I heard that I could jailbreak my device to store audio into Apple Music or something similar.

Jailbreaking was surprisingly easy, I downloaded Phoenix from [jailbreaks.app/legacy.html](https://jailbreaks.app/legacy.html) since my iPad is a Mini 2­it runs iOS 9.3.5. I clicked buttons, followed instructions, waited on progress bars, then on my homescreen appeared a shiney new app called Cydia. I searched online for a method of importing music, and a reddit post led me to a jailbreak tweak called mImport. I install that using Cydia, but it didn't work out. There *was* a new button in the Apple Music app, that allowed me to choose a audio file from my iPad's filesystem, but whenever I tried to select a audio file it crashed.

Jailbreaking the device allowed me to mount with `ifuse ~/ipad --root`, which gave me access to the *entire* iPad filesystem, not just a portion of it. I had a fun few minutes exploring the structure and layout of my iPad, but this didn't lead to any insights on how I could listen to audio on the iPad.

I did find a tweak that does work though, an Ad blocker by the same author as mImport, so being able to watch YouTube without an Ad every few minutes is great. But I couldn't use mImport. Then I came up with an idea: Why not put the audio onto any video, then put the video onto the iPad?

I ran `ffmpeg -i audiobook.mp3 -f lavfi -i color=c=0xff00ff:s=640x480:r=30 -shortest out.mov` to convert an audiobook I had to a video with a 640 by 480 pure fuchsia background. I tried just copying that video into the `DCIM` folder of my iPad, where all the videos and photos were stored, but that didn't work out. The Photo program of the iPad didn't pick up the video. So, I fiddled around a bit, and found where the photo and video metadata was stored­in a SQLite database in the `PhotoData` subdirectory.

1. I copied the video with `cp ~/out.mov ~/ipad/DCIM/100APPLE/IMG_0033.MOV`.
2. I run `sqlitebrowser ~/ipad/PhotoData/Photos.sqlite`, by choice of tool to edit and browse a SQLite database.
3. There were a lot of tables, looking around I found `ZGENERICASSET` that seemed most relevant to what I was doing. The table had a row for each video/photo and a lot of other information associated with that video/photo. I duplicated the row of a pre-existing video, then change only the columns regarding width, height, and filename.
4. Then I save and exit out of `sqlitebrowser` and run `fusermount -u ~/ipad` to unmount the iPad before unplugging the wire connecting it to my desktop.
5. I check, and lo and behold the video with its audio is present in my photo app, and works!

By the way, I ran `select * from ZGENERICASSET order by Z_PK desc limit 1;` from the sqlite CLI to get the last row of the table, which looks like this:

```
51|23|4|0|0||||||0|0|1|0|0|1920|0|0|1|102|1|3|24|0|0|0|0|1080|51|||9||20480||689797057.443527|||||689797023|2.23333333333333||689797023|689797023.461807|||||||DCIM/100APPLE|IMG_0031.MOV||com.apple.quicktime-movie|CD4267DD-764C-4FF9-A400-4D05A02C29ED||||
```

That's it for this post, I'm planning to change the structure of my website by using React and Next.js or something similar, so this post may not be as polished as the other ones.
