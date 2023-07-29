On Anonymous File & Text Uploading | 3 | 2023-07-02

Often it is convenient to be able to upload text (like code) or files (pictures or PDFs) onto a website and access them over the Internet on another device. Pastebin is often used for the purpose of pasting text, though I find it easier to use a little know service called [ix](ix.io). Essentially you can upload text by feeding it into a `curl` command.

```
$ cat <<UNICORN | curl -F 'f:1=<-' -F 'read:1=1' ix.io
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent
ultricies eu magna nec convallis. Donec nunc ante, posuere at sem
nec, ornare ultrices velit. Sed tempus elementum venenatis. Nulla
quam mi, volutpat id auctor sollicitudin, rhoncus non arcu. Orci
varius natoque penatibus et magnis dis parturient montes, nascetur
ridiculus mus. Aenean sapien odio, volutpat non blandit placerat,
egestas non tellus. Integer at purus vitae velit dictum
sollicitudin. Cras feugiat at urna nec tincidunt. Pellentesque
ipsum mauris, fringilla sit amet urna eget, finibus ultrices quam.
Praesent volutpat tempor nisl ac venenatis. In eget lacus sem.
Praesent feugiat iaculis quam ut imperdiet. Quisque vehicula urna
pulvinar diam feugiat, scelerisque porttitor nisi imperdiet.
UNICORN
http://ix.io/4zJu
```
```
cat <<UNICORN | curl -F "file=@-" https://api.anonfiles.com/upload
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent
ultricies eu magna nec convallis. Donec nunc ante, posuere at sem
nec, ornare ultrices velit. Sed tempus elementum venenatis. Nulla
quam mi, volutpat id auctor sollicitudin, rhoncus non arcu. Orci
varius natoque penatibus et magnis dis parturient montes, nascetur
ridiculus mus. Aenean sapien odio, volutpat non blandit placerat,
egestas non tellus. Integer at purus vitae velit dictum
sollicitudin. Cras feugiat at urna nec tincidunt. Pellentesque
ipsum mauris, fringilla sit amet urna eget, finibus ultrices quam.
Praesent volutpat tempor nisl ac venenatis. In eget lacus sem.
Praesent feugiat iaculis quam ut imperdiet. Quisque vehicula urna
pulvinar diam feugiat, scelerisque porttitor nisi imperdiet.
UNICORN
{
	"data": {
		"file": {
			"url": {
				"full": "https:\/\/anonfiles.com\/93B4k709zc\/_",
				"short": "https:\/\/anonfiles.com\/93B4k709zc"
			},
			"metadata": {
				"id": "93B4k709zc",
				"name": "-",
				"size": {
					"bytes": 772,
					"readable": "772 B"
				}
			}
		}
	},
	"status": true
}
```

You can put the following function into your `.bashrc`:

```bash
ix() {
	s=$(</dev/stdin)
	echo "$s" | torsocks curl -F 'f:1=<-' -F 'read:1=1' ix.io
}
```

To upload anonymous files [anonfiles](https://anonfiles.com/) is a great service. Since it is so easy to upload files—you don't need an account or anything—it's often used by malicious actors to share database leaks and other info. I used it to print a 70 MB PDF I had on a laptop but had to transfer to another computer with the proper drivers to print. Of course, the two computers are separated by the distance of a couple rooms, so I could've just used a USB to transfer it, but it's much more convenient to use anonfiles.
