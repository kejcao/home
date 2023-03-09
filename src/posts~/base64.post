title: Base64: Encoding Binary Data
 desc: Encoding WebP images and creating Data URLs with my own implementation of Base64 in C.
 date: 2022-06-09

Base64 is a binary-to-text encoding scheme that transforms 8-bit binary data, in chunks of 3, into 6-bit ASCII characters. This is useful for the transfer of data in environments that are restricted to ASCII, or to avoid accidentally triggering control characters. It is used to create Data URLs, which allow the embedding of media—such as images—or other binary assets into textual HTML, XML, and CSS files; Earlier forms of SMTP only supported 7-bit ASCII, and Base64 was used to transfer attachments.

Data encoded with Base64 experience around a 33 percent increase in size, about 2 percent more if line breaks occur every 76 characters, as enforced by MIME.

If the data being encoded does not fit neatly into chunks of 3, equal signs are commonly used to pad the output. The 64 characters used for Base64 are, in order from 0–63: A–Z, a–z, 0–9, then two symbols that vary. RFC 4648 specifies those two symbols as the plus sign, then the forward slash.

Here is my implementation of Base64 in C:

```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

const int WRAP_AT = 76;
const char *B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

void encode_block(char buf[3], char out[4]) {
	out[0] = B64_CHARS[buf[0] >> 2 & 0x3f];
	out[1] = B64_CHARS[(buf[0] & 0x03) << 4 | buf[1] >> 4 & 0x0f];
	out[2] = B64_CHARS[(buf[1] & 0x0f) << 2 | buf[2] >> 6 & 0x03];
	out[3] = B64_CHARS[buf[2] & 0x3f];
}

void putchar_wrap(char c, int *read) {
	if(*read >= WRAP_AT) {
		putchar('\n');
		*read = 0;
	}
	putchar(c);
	++*read;
}

void encode_to_stdout(FILE *fp) {
	int read = 0;
	char buf[3], out[4];

	while(1) {
		/* read */
		for(int i=0; i<3; ++i) {
			int c;
			if((c=fgetc(fp)) == EOF) {
				if(ferror(fp)) {
					perror("fgetc");
					exit(EXIT_FAILURE);
				}

				/* last few bits: encode, pad, and finish. */
				if(i != 0) {
					memset(buf+i, 0, 3-i);
					encode_block(buf, out);

					for(int j=0; j<4; ++j) {
						putchar_wrap(j < i+1 ? out[j] : '=', &read);
					}
				}
				putchar('\n');
				goto finish;
			}
			buf[i] = c;
		}

		/* encode */
		encode_block(buf, out);
		for(int i=0; i<4; ++i) {
			putchar_wrap(out[i], &read);
		}
	}
finish:
}

int main(int argc, char **argv) {
	if(argc == 1) {
		if(!freopen(NULL, "rb", stdin)) {
			perror("freopen");
			exit(EXIT_FAILURE);
		}
		encode_to_stdout(stdin);
	}

	for(int i=1; i<argc; ++i) {
		FILE *fp = fopen(argv[i], "rb");
		if(!fp) {
			perror("fopen");
			exit(EXIT_FAILURE);
		}
		encode_to_stdout(fp);
		fclose(fp);
	}
}
```

The script will encode any input fed to it from stdin. Any command line arguments will be read from and encoded. The script uses RFC 4648's Base64 alphabet, and produces line breaks every 76 characters.

For example, here's the output of my program's encoding of a compressed, 256x256 WebP logo of my website:

```
$ ./a.out favicon.webp 
UklGRpgKAABXRUJQVlA4WAoAAAASAAAA/wAA/wAAQU5JTQYAAAD/////AABBTk1GbAoAAAQAABYA
AOwAAKIAAAAAAAJBTFBI1QkAAAGwh23bObnZM7O2N2w33SK2bRu1tXVj2zanKWJMUkZHGzv7pdqN
WcRZWzPzfEh/7/M+7/v7zX/fERETAE84VU4AiQFONbeA7uujynVlBKOaJf+fRey4r06lKfHwxFfj
YmT4jnAc/MvD7M5hx1DtPTKy4bOjHSeymWT97JyT1CoCWPondkpauv+GS1rxBeecpFbhYLbxrd+a
vTOlkCz31+0zXm8eCwoG1uo30nHwbw/Fle/mvdO2HJh6B7KnQfGqmQQOsIC6ir6K4rt8vRa/gyh+
JgS8ljUofjEavJbhKH4nAbyWbi6xnHqg1cjyiYmJ0VFR1qBGNgqXdAYd+jzR5cPFey6lF+A/e9Kv
nNr9xYSXW1QwsdjrKOx5FZQP6Dj9QC7KzDq86LXavmYUeArFh4LiUW/uykeWRcmrkxoGmIttI4rP
A6V9ev9QgqxLf/tiRJ+qfmYxAcW32lUKH3ML1Sy7tucZMxjgFjsUAOrGTslAhRubQIN8FE6NBGXL
LcpHpavpr8ItFL5ZHlS1v5aOilfUXlAyCqdXBVUbnkXasutHtzlWrXY4tnx37MJ9SWG6s21D4cIW
oGjIchcS5nz7YaNAMB5cu9/UH7Op3HbdzUJhVz9QtNp5FC/d2dcfiO3NZpwnyQHNPe8R8rwNir6Q
h8L5Cx8DuY3Wlojd1lyLYhSeCGoGrEBh9xcVQX7CHqFLeqvyAIUdoGbYYRS+3AJY2k6KJGstLBWF
d/mqEZ2MwquDgOlCkQM6s/+AwmdCQMnyqSha+BqwfUnkW50tQeGrcaBkwjUUzWoNfKuJrNfYWyh8
...
```

The ellipsis above isn't output from my program, but just to signify three more pages worth of gibberish. That gibberish can be appended to a Data URL. Data URL's begin with `data:`, then a MIME type indicating the type of data, then an optional `;base64` to hint that the data is in Base64, and is concluded by a comma and the data.

For example, this is the Data URL of my logo: [data:image/webp;base64,UklGRpgKAABXRUJQVlA4WAoAA...](data:image/webp;base64,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).

It's in WebP format, so it has a mime type of `image/webp`. The data is the output of my program, minus the newlines, so the optional Base64 token is there.

Try clicking on the link, in most browsers you should see my logo, a big K followed by a small C. Originally I encoded the SVG version of my logo, constructed it into a data URL, and used that as a demonstration, but it turns out Mozilla Firefox (and Chrome also, I think) prevents the opening of any Data URL with mime type `image/svg+xml` because of [security issues](https://blog.mozilla.org/security/2017/11/27/blocking-top-level-navigations-data-urls-firefox-59/).
