DD: MitmProxy setup | 1 | 2024-07-19 | tags

We need to let chromium trust mitmproxy's certificate, so

````shell
$ certutil -d "sql:$HOME/.pki/nssdb" -A -i ~/.mitmproxy/mitmproxy-ca-cert.pem -n "mitmproxy" -t C,,
````

And now we can write a short Bash script to launch a fresh chromium browser which mitmproxy can intercept, without capturing the traffic from other instances of the browser we might have open. We tell chromium to use a fresh user data directory, so the browser instance will have no extensions or settings that may interfere with our analysis.

```bash
#!/bin/bash

d=$(mktemp -d)
chromium --proxy-server=localhost:8080 --user-data-dir="$d" >/dev/null 2>&1 &

mitmproxy
```
