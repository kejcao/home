Scraping Graphic Novels/Comics with Selenium | 4 | 2023-07-12 | python,selenium,scraping,piracy,ebook

## Background Information

File formats like CBR and CBZ are used to store comic books which are represented as a sequential series of images. CBR stores these images in a RAR archive while CBZ stores them in a ZIP archive. Torrenting is basically a way of sharing files, where these files are often copyrighted material such as movies or TV shows. DC++ is a popular client for a P2P file-sharing protocol like BitTorrent called Direct Connect—basically it's like torrenting. Selenium is a library with bindings for Python that allows someone to code a robot to automatically interact with a web browser—like a magic spell a necromancer can use to animate undead metal to use a web browser.

## Scraping Comics

[readcomiconline.li](https://readcomiconline.li/) and websites like it are the 123movies (a popular website for watching free movies) of the graphic novel/comic book world. Someone could obtain movies by torrenting them, often of higher resolution and quality, but 123movies makes it less of a hassle and presents the movies in an easily accessible environment. Likewise, someone could probably obtain comics from DC++ but readcomiconline makes it trivially easy. I like to have a local copy of the books I read, however, and using DC++ is too complicated and difficult for me. It is much easier for me to scrape the website [readcomiconline.li](https://readcomiconline.li/) automatically using Selenium, then download and combine the images I get into a CBZ file (like a webrip if you know what that is but for comics instead of movies).

Initially, during the experimental stages, I scraped too fast on my native IP and got flagged as a bot. I had to solve a captcha. Because of this I routed over Tor though this is probably unnecessary, since adding a random wait between 4–6 seconds before flipping to the next page—emulating a human pace—seems to evade the bot detection. The website doesn't use Cloudflare or have any anti-debugging mechanisms as far as I can see, which is strange for such a seedy website like it. In the script below we select the highest quality, then wait for the image to appear. When it does we print its URL.

```py
import random
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.wait import WebDriverWait

options = Options()
options.set_preference('network.proxy.type', 1)
options.set_preference('network.proxy.socks', '127.0.0.1')
options.set_preference('network.proxy.socks_port', 9050)
options.set_preference('network.proxy.socks_remote_dns', False)
driver = webdriver.Firefox(options=options)
for i in range(1, 27):
    driver.get(f'https://readcomiconline.li/Comic/Feathers/Issue-6?id=16783#{i}')
    driver.refresh()
    Select(driver.find_element(By.XPATH, '//select[@id="selectQuality"]')).select_by_value('hq')
    print(WebDriverWait(driver, 20).until(lambda x: x.find_element(By.XPATH, '//img[@id="imgCurrent"]')).get_attribute('src'))
    time.sleep(random.randint(4, 6))
driver.close()
```

The result of running the script:

```
$ python3 main.py
https://2.bp.blogspot.com/-BiiuRqwgQmA/VqsaB1XzloI/AAAAAAAAOLY/CZWUFEjgRWw/s0-Ic42/RCO001.jpg
https://2.bp.blogspot.com/-qRAtmOj0e44/VqsaBxoPcII/AAAAAAAAOLY/G0xdsRVd7Ow/s0-Ic42/RCO002.jpg
https://2.bp.blogspot.com/-80-UnC80N5Y/VqsaBomvU1I/AAAAAAAAOLY/Yaaz51gefqU/s0-Ic42/RCO003.jpg
https://2.bp.blogspot.com/-1N65ov4sDkk/VqsaCCGEj9I/AAAAAAAAOLY/KZP8o-wx1eU/s0-Ic42/RCO004.jpg
https://2.bp.blogspot.com/-qLxEm4s3dOE/VqsaCeLTiXI/AAAAAAAAOLg/IjPVXL34I5A/s0-Ic42/RCO005.jpg
https://2.bp.blogspot.com/-hFvdwcZ8yX0/VqsaCmXqdVI/AAAAAAAAOLk/rnIqDT2WBes/s0-Ic42/RCO006.jpg
https://2.bp.blogspot.com/-VJuVtvICb4M/VqsaCwWe-lI/AAAAAAAAOLY/fr6q6dprArc/s0-Ic42/RCO007.jpg
https://2.bp.blogspot.com/-rm5X215zFHw/VqsaDkY2AzI/AAAAAAAAOLo/3JidNIEsi7o/s0-Ic42/RCO008.jpg
https://2.bp.blogspot.com/-2I9aAuoqg08/VqsaD1yCX9I/AAAAAAAAOLs/PVFxodhskBI/s0-Ic42/RCO009.jpg
https://2.bp.blogspot.com/-VNzCBC6RMXM/VqsaD4ik9bI/AAAAAAAAOLY/i55LPhCBzWs/s0-Ic42/RCO010.jpg
https://2.bp.blogspot.com/-E2n6qKbwNsQ/VqsaEekMNjI/AAAAAAAAOLY/r9lYgORKddU/s0-Ic42/RCO011.jpg
https://2.bp.blogspot.com/-bK1qhbW3NVY/VqsaEb63YYI/AAAAAAAAOLw/FTE_3zM6hsQ/s0-Ic42/RCO012.jpg
https://2.bp.blogspot.com/-43VCL1Nh4eM/VqsaEpR9_xI/AAAAAAAAOLY/r7VaBl5rcjA/s0-Ic42/RCO013.jpg
https://2.bp.blogspot.com/-G07kewtMkdU/VqsaEwaB0YI/AAAAAAAAOLY/uNvGc_WFMNA/s0-Ic42/RCO014.jpg
https://2.bp.blogspot.com/-o5OypV13FUY/VqsaFiUmNmI/AAAAAAAAOLY/bLlUqbXoO4c/s0-Ic42/RCO015.jpg
https://2.bp.blogspot.com/-ifbvCic-aac/VqsaFv2AqdI/AAAAAAAAOLY/QIt1jI_xm-Q/s0-Ic42/RCO016.jpg
https://2.bp.blogspot.com/-rBviI-6V4kc/VqsaF4POASI/AAAAAAAAOLY/e_0AbeUI6mQ/s0-Ic42/RCO017.jpg
https://2.bp.blogspot.com/-zM_QbXQvp9M/VqsaGJ_JkuI/AAAAAAAAOLY/9W7Rfgm8aSY/s0-Ic42/RCO018.jpg
https://2.bp.blogspot.com/-7t8HPNNb4Xg/VqsaGDkZrPI/AAAAAAAAOLY/g3ejRNOn-rM/s0-Ic42/RCO019.jpg
https://2.bp.blogspot.com/-0_DpSf8ySXo/VqsaGQvYotI/AAAAAAAAOLY/KyOU7SQ8jUU/s0-Ic42/RCO020.jpg
https://2.bp.blogspot.com/-L6Bh8HEMbI0/VqsaGiXjoBI/AAAAAAAAOLY/pSPJ3aQrFVs/s0-Ic42/RCO021.jpg
https://2.bp.blogspot.com/-I7QfRIGRWto/VqsaG272xkI/AAAAAAAAOLY/6Su4aIItDnM/s0-Ic42/RCO022.jpg
https://2.bp.blogspot.com/-72KamUlBnYU/VqsaG1bNXZI/AAAAAAAAOLY/SRhWxQvmqFU/s0-Ic42/RCO023.jpg
https://2.bp.blogspot.com/-hpjXVKbAjws/VqsaHFjWAAI/AAAAAAAAOLY/61nGP5A9060/s0-Ic42/RCO024.jpg
https://2.bp.blogspot.com/-hjrizcqaiZw/VqsaHXZfAYI/AAAAAAAAOLY/FHPV3S5aIcU/s0-Ic42/RCO025.jpg
https://2.bp.blogspot.com/-OhCan9gVFhg/VqsaHh2pYFI/AAAAAAAAOLY/tYdiflfvgkE/s0-Ic42/RCO026.jpg
```

I then copy those URLs into a Bash script to download all of the images:

```bash
#!/bin/bash

i=132
while read l; do
  wget -O "$(printf %03d $i).jpeg" "$l"
  i=$((i+1))
done <<UNICORN
https://2.bp.blogspot.com/-BiiuRqwgQmA/VqsaB1XzloI/AAAAAAAAOLY/CZWUFEjgRWw/s0-Ic42/RCO001.jpg
https://2.bp.blogspot.com/-qRAtmOj0e44/VqsaBxoPcII/AAAAAAAAOLY/G0xdsRVd7Ow/s0-Ic42/RCO002.jpg
https://2.bp.blogspot.com/-80-UnC80N5Y/VqsaBomvU1I/AAAAAAAAOLY/Yaaz51gefqU/s0-Ic42/RCO003.jpg
https://2.bp.blogspot.com/-1N65ov4sDkk/VqsaCCGEj9I/AAAAAAAAOLY/KZP8o-wx1eU/s0-Ic42/RCO004.jpg
https://2.bp.blogspot.com/-qLxEm4s3dOE/VqsaCeLTiXI/AAAAAAAAOLg/IjPVXL34I5A/s0-Ic42/RCO005.jpg
https://2.bp.blogspot.com/-hFvdwcZ8yX0/VqsaCmXqdVI/AAAAAAAAOLk/rnIqDT2WBes/s0-Ic42/RCO006.jpg
https://2.bp.blogspot.com/-VJuVtvICb4M/VqsaCwWe-lI/AAAAAAAAOLY/fr6q6dprArc/s0-Ic42/RCO007.jpg
https://2.bp.blogspot.com/-rm5X215zFHw/VqsaDkY2AzI/AAAAAAAAOLo/3JidNIEsi7o/s0-Ic42/RCO008.jpg
https://2.bp.blogspot.com/-2I9aAuoqg08/VqsaD1yCX9I/AAAAAAAAOLs/PVFxodhskBI/s0-Ic42/RCO009.jpg
https://2.bp.blogspot.com/-VNzCBC6RMXM/VqsaD4ik9bI/AAAAAAAAOLY/i55LPhCBzWs/s0-Ic42/RCO010.jpg
https://2.bp.blogspot.com/-E2n6qKbwNsQ/VqsaEekMNjI/AAAAAAAAOLY/r9lYgORKddU/s0-Ic42/RCO011.jpg
https://2.bp.blogspot.com/-bK1qhbW3NVY/VqsaEb63YYI/AAAAAAAAOLw/FTE_3zM6hsQ/s0-Ic42/RCO012.jpg
https://2.bp.blogspot.com/-43VCL1Nh4eM/VqsaEpR9_xI/AAAAAAAAOLY/r7VaBl5rcjA/s0-Ic42/RCO013.jpg
https://2.bp.blogspot.com/-G07kewtMkdU/VqsaEwaB0YI/AAAAAAAAOLY/uNvGc_WFMNA/s0-Ic42/RCO014.jpg
https://2.bp.blogspot.com/-o5OypV13FUY/VqsaFiUmNmI/AAAAAAAAOLY/bLlUqbXoO4c/s0-Ic42/RCO015.jpg
https://2.bp.blogspot.com/-ifbvCic-aac/VqsaFv2AqdI/AAAAAAAAOLY/QIt1jI_xm-Q/s0-Ic42/RCO016.jpg
https://2.bp.blogspot.com/-rBviI-6V4kc/VqsaF4POASI/AAAAAAAAOLY/e_0AbeUI6mQ/s0-Ic42/RCO017.jpg
https://2.bp.blogspot.com/-zM_QbXQvp9M/VqsaGJ_JkuI/AAAAAAAAOLY/9W7Rfgm8aSY/s0-Ic42/RCO018.jpg
https://2.bp.blogspot.com/-7t8HPNNb4Xg/VqsaGDkZrPI/AAAAAAAAOLY/g3ejRNOn-rM/s0-Ic42/RCO019.jpg
https://2.bp.blogspot.com/-0_DpSf8ySXo/VqsaGQvYotI/AAAAAAAAOLY/KyOU7SQ8jUU/s0-Ic42/RCO020.jpg
https://2.bp.blogspot.com/-L6Bh8HEMbI0/VqsaGiXjoBI/AAAAAAAAOLY/pSPJ3aQrFVs/s0-Ic42/RCO021.jpg
https://2.bp.blogspot.com/-I7QfRIGRWto/VqsaG272xkI/AAAAAAAAOLY/6Su4aIItDnM/s0-Ic42/RCO022.jpg
https://2.bp.blogspot.com/-72KamUlBnYU/VqsaG1bNXZI/AAAAAAAAOLY/SRhWxQvmqFU/s0-Ic42/RCO023.jpg
https://2.bp.blogspot.com/-hpjXVKbAjws/VqsaHFjWAAI/AAAAAAAAOLY/61nGP5A9060/s0-Ic42/RCO024.jpg
https://2.bp.blogspot.com/-hjrizcqaiZw/VqsaHXZfAYI/AAAAAAAAOLY/FHPV3S5aIcU/s0-Ic42/RCO025.jpg
https://2.bp.blogspot.com/-OhCan9gVFhg/VqsaHh2pYFI/AAAAAAAAOLY/tYdiflfvgkE/s0-Ic42/RCO026.jpg
UNICORN
```

I repeat this process for each comic issue, to get a directory that is filled with images that have padded, numbered, and ordered filenames.

```
$ ls
000.jpeg  023.jpeg  046.jpeg  069.jpeg  092.jpeg  115.jpeg  138.jpeg
001.jpeg  024.jpeg  047.jpeg  070.jpeg  093.jpeg  116.jpeg  139.jpeg
002.jpeg  025.jpeg  048.jpeg  071.jpeg  094.jpeg  117.jpeg  140.jpeg
003.jpeg  026.jpeg  049.jpeg  072.jpeg  095.jpeg  118.jpeg  141.jpeg
004.jpeg  027.jpeg  050.jpeg  073.jpeg  096.jpeg  119.jpeg  142.jpeg
005.jpeg  028.jpeg  051.jpeg  074.jpeg  097.jpeg  120.jpeg  143.jpeg
006.jpeg  029.jpeg  052.jpeg  075.jpeg  098.jpeg  121.jpeg  144.jpeg
007.jpeg  030.jpeg  053.jpeg  076.jpeg  099.jpeg  122.jpeg  145.jpeg
008.jpeg  031.jpeg  054.jpeg  077.jpeg  100.jpeg  123.jpeg  146.jpeg
009.jpeg  032.jpeg  055.jpeg  078.jpeg  101.jpeg  124.jpeg  147.jpeg
010.jpeg  033.jpeg  056.jpeg  079.jpeg  102.jpeg  125.jpeg  148.jpeg
011.jpeg  034.jpeg  057.jpeg  080.jpeg  103.jpeg  126.jpeg  149.jpeg
012.jpeg  035.jpeg  058.jpeg  081.jpeg  104.jpeg  127.jpeg  150.jpeg
013.jpeg  036.jpeg  059.jpeg  082.jpeg  105.jpeg  128.jpeg  151.jpeg
014.jpeg  037.jpeg  060.jpeg  083.jpeg  106.jpeg  129.jpeg  152.jpeg
015.jpeg  038.jpeg  061.jpeg  084.jpeg  107.jpeg  130.jpeg  153.jpeg
016.jpeg  039.jpeg  062.jpeg  085.jpeg  108.jpeg  131.jpeg  154.jpeg
017.jpeg  040.jpeg  063.jpeg  086.jpeg  109.jpeg  132.jpeg  155.jpeg
018.jpeg  041.jpeg  064.jpeg  087.jpeg  110.jpeg  133.jpeg  156.jpeg
019.jpeg  042.jpeg  065.jpeg  088.jpeg  111.jpeg  134.jpeg  157.jpeg
020.jpeg  043.jpeg  066.jpeg  089.jpeg  112.jpeg  135.jpeg  down.sh
021.jpeg  044.jpeg  067.jpeg  090.jpeg  113.jpeg  136.jpeg
022.jpeg  045.jpeg  068.jpeg  091.jpeg  114.jpeg  137.jpeg
```

I then zip these images into a CBZ file,

```
$ zip feathers.cbz *.jpeg
  adding: 000.jpeg (deflated 6%)
  adding: 001.jpeg (deflated 8%)
  adding: 002.jpeg (deflated 5%)
  adding: 003.jpeg (deflated 7%)
  adding: 004.jpeg (deflated 7%)
  adding: 005.jpeg (deflated 6%)
...
```

From which I can view the file with any eBook reader.

```
$ zathura feathers.cbz
```
