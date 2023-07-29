Curl: Tips & Tricks | 5 | 2023-06-23 | linux

I've been using the command line tools `curl` and `wget` for a while now. I've picked up a few tricks. Most of them will be on `curl`, since I use that the most.

I often forget the more esoteric HTTP status codes. For a quick and cute reminder, one can enter something like "[http.cat/403](https://http.cat/403)" into the browser search bar and you get a cute cat describing that status code.

## The Basics

We can use `wget` like we would `curl` by using the `-O` flag which specifies a file to output to, where a lone hyphen stands for stdout. `-q` suppresses the output of progress bars and other unnecessary information.

```
$ wget -qO - example.org
<!doctype html>
<html>
<head>
    <title>Example Domain</title>

    <meta charset="utf-8" />
    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type="text/css">
    body {
...
```

With `curl` we can print just the status code of a website by using `-s` to get rid of the progress bar, silencing the response body by redirecting it to `/dev/null` with the `-o` flag, and specifying that we want only the HTTP code with `-w`. A new line is added at the end, though this is optional. This command is useful for say a script. Add in `-L` to automatically redirect.

```
$ curl -so /dev/null -w '%{http_code}\n' example.org
200
$ curl -so /dev/null -w '%{http_code}\n' asitethatdoesnotexist.org
000
$ curl -so /dev/null -w '%{http_code}\n' google.com
301
$ curl -Lso /dev/null -w '%{http_code}\n' google.com
200
```

`-v` stands for verbose and can be used to print additional informaton in `curl`. Below, we also ignore the response body and set an artifical user-agent with the `-A` flag.

```
$ curl -svA jUnk/404.0 -o /dev/null example.org
*   Trying [2606:2800:220:1:248:1893:25c8:1946]:80...
* Connected to example.org (2606:2800:220:1:248:1893:25c8:1946) port 80 (#0)
> GET / HTTP/1.1
> Host: example.org
> User-Agent: jUnk/404.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Age: 415408
< Cache-Control: max-age=604800
< Content-Type: text/html; charset=UTF-8
< Date: Tue, 20 Jun 2023 23:48:32 GMT
< Etag: "3147526947+gzip+ident"
< Expires: Tue, 27 Jun 2023 23:48:32 GMT
< Last-Modified: Thu, 17 Oct 2019 07:18:26 GMT
< Server: ECS (dcb/7F3C)
< Vary: Accept-Encoding
< X-Cache: HIT
< Content-Length: 1256
<
{ [1256 bytes data]
* Connection #0 to host example.org left intact
```

We can do a similar thing in `wget` but we can use the `-d` flag (which stands for debug) to print additional information. `-U` is used in `wget` to specify a user-agent instead of the `-A` used in `curl`.

```
$ wget -dU jUnk/404.0 example.org
Setting --user-agent (useragent) to jUnk/404.0
DEBUG output created by Wget 1.21.4 on linux-gnu.

Reading HSTS entries from /home/kjc/.wget-hsts
URI encoding = ‘UTF-8’
Converted file name 'index.html' (UTF-8) -> 'index.html' (UTF-8)
--2023-06-20 19:54:57--  http://example.org/
Resolving example.org (example.org)... 2606:2800:220:1:248:1893:25c8:1946, 93.184.216.34
Caching example.org => 2606:2800:220:1:248:1893:25c8:1946 93.184.216.34
Connecting to example.org (example.org)|2606:2800:220:1:248:1893:25c8:1946|:80... connected.
Created socket 3.
Releasing 0x000055ef7cb21200 (new refcount 1).

---request begin---
GET / HTTP/1.1
Host: example.org
User-Agent: jUnk/404.0
Accept: */*
Accept-Encoding: identity
Connection: Keep-Alive

---request end---
HTTP request sent, awaiting response...
---response begin---
HTTP/1.1 200 OK
Age: 327496
Cache-Control: max-age=604800
Content-Type: text/html; charset=UTF-8
Date: Tue, 20 Jun 2023 23:54:57 GMT
Etag: "3147526947+ident"
Expires: Tue, 27 Jun 2023 23:54:57 GMT
Last-Modified: Thu, 17 Oct 2019 07:18:26 GMT
Server: ECS (dcb/7EA2)
Vary: Accept-Encoding
X-Cache: HIT
Content-Length: 1256

---response end---
200 OK
Registered socket 3 for persistent reuse.
URI content encoding = ‘UTF-8’
Length: 1256 (1.2K) [text/html]
Saving to: ‘index.html.2’

index.html.2         100%[===================>]   1.23K  --.-KB/s    in 0s

2023-06-20 19:54:57 (76.3 MB/s) - ‘index.html.2’ saved [1256/1256]
```

`-m` stands for "mirror" and is used to mirror a webpage onto your local machine in `wget`. It turns on recursion (with infinite depth) and time-stamping among some other stuff. A few more flags like `-k` converts links so your browser can browse the local copy, `-E` is used to automatically add appropriate file extensions, and `--random-wait` waits between 0.5 to 1.5 seconds between each request—this is to prevent the site from flagging and banning us.

```
$ time wget -mkE --random-wait www.genome.gov
--2023-06-20 20:24:03--  http://www.genome.gov/
Resolving www.genome.gov (www.genome.gov)... 52.45.214.169
Connecting to www.genome.gov (www.genome.gov)|52.45.214.169|:80... connected.
HTTP request sent, awaiting response... 301 Moved Permanently
Location: https://www.genome.gov/ [following]
--2023-06-20 20:24:03--  https://www.genome.gov/
Loaded CA certificate '/etc/ssl/certs/ca-certificates.crt'
Connecting to www.genome.gov (www.genome.gov)|52.45.214.169|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 105451 (103K) [text/html]
Saving to: ‘www.genome.gov/index.html’

...

Converted links in 2739 files in 3.3 seconds.

real    41m51.185s
user    0m36.615s
sys     0m48.847s
```

Note the above technique of saving websites doesn't work very well on really dynamic sites, sites that rely on primarily JavaScript to render everything.

## Tor

Tor anonymizes web browsing by onion routing over volunteer relays and grants access to .onion sites that are usually inaccessible. If you have enabled Tor, it listens on port 9050.

```
$ sudo ss -tlpn | grep tor
LISTEN 0      4096       127.0.0.1:9050       0.0.0.0:*    users:(("tor",pid=429,fd=6))
```

Which means we can simply tell `curl` to use that as a proxy.

```
$ curl -sLx socks5h://localhost:9050 check.torproject.org | grep Congrat
      Congratulations. This browser is configured to use Tor.
      Congratulations. This browser is configured to use Tor.
$ curl -sLx socks5h://localhost:9050 www.nytimesn7cgmftshazwhfgzm37qxb44r64ytbb2dj3x62d2lljsciiyd.onion | head -5
<!DOCTYPE html>
<html lang="en" class=" nytapp-vi-homepage"  xmlns:og="http://opengraphprotocol.org/schema/">
  <head>
    <meta charset="utf-8" />
    <title data-rh="true">The New York Times - Breaking News, US News, World News and Videos</title>
```

A simpler (and probably more robust) way that also works with most other Internet accessing applications that don't have an option to set a proxy would be `torsocks`. It hijacks library functions such as `connect()` or `gethostbyname()`—which programs usually use to do network stuff—via the environment variable `LD_PRELOAD`.

```
$ torsocks curl eth0.me
135.148.149.71
$ curl -sL check.torproject.org/exit-addresses | grep 135.148.149.71
ExitAddress 135.148.149.71 2023-06-20 20:03:16
```

Using `torsock` we can save a .onion page.

```
$ torsocks wget -mkE --random-wait www.nytimesn7cgmftshazwhfgzm37qxb44r64ytbb2dj3x62d2lljsciiyd.onion
...
```
