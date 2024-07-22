Losslessly Compressing 25000 Images | 1 | 2024-06-26 | compression,python

On May 20, Microsoft [announced](https://blogs.microsoft.com/blog/2024/05/20/introducing-copilot-pcs/) their Copilot+ PCs. The main selling point of these devices are its AI features. These include near real-time local image generation, Live Captions with translation, and Recall. Recall periodically takes a screenshot of the PC and allows users to search through these to "easily find and remember what you have seen in your PC." After harsh backlash and exposed security flaws targeting Recall, Microsoft vastly [scaled back](https://www.wired.com/story/microsoft-recall-off-default-security-concerns/) its ambitions with this project.

Anyway, I was surprised when Microsoft announced this Recall hoopla in the first place, because *I have been doing exactly the same thing* for half a year. I take the screenshots so I can reflect back at how I interacted with my computer in the past—the habits I had and the media I consumed. Instead, Microsoft advertises Recall as a feature to solve one of the most frustrating problems they claim users encounter, of "finding something we know we have seen before [on our computers]." I use this Bash script:

```bash
#!/bin/bash

sleep 5

while :; do
    maim /home/kjc/screenshots/$(date -Is).png
    sleep $((1*60))
done
```

I used to set a longer interval between screenshots, but have been gradually scaling the sleep time down from an hour to now just a minute. Storage is just too damn cheap these days, even pessimistic estimates of 1440 screenshots taken everyday, each weighing a megabyte, would fill a 2 TB drive only after 4 years and those drives go for peanuts on Amazon. 1 TB costs a dollar a month in S3 Glacier Deep Archive.

But I did notice a curious pattern in the screenshots. There were many consecutive runs of *very* similar images. I don't suspend my computer when the laptop lid is closed (because network issues) so the Bash script continues to run 24/7 even if my laptop is "closed." I also keep my laptop lid open to listen to music, while engaging in some other activity in meat space. This redundancy of storing nearly identical images while my computer is idle upsets me deeply—that I'm wasting so many bits storing the exact same thing over and over again.

The slight differences between similar images are accounted for by the continuously changing values in my taskbar, which displays fluctuating CPU usage, for instance. Therefore, I wrote a simple Python script to losslessly compress these runs of similar images. The script loops through each image in the current directory and considers the difference between the current one and the previous, and, if the difference between them is small enough, it stores the delta of the current image against the previous instead of the original image data. I store the deltas as JPEG XL since the file format has a smaller overhead than PNG and provides a reliable way to differentiate between actual image data and deltas. 

```py
from datetime import datetime
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from jxlpy import JXLImagePlugin
from PIL import Image
from tqdm import tqdm

# See: https://stackoverflow.com/questions/57354700/starmap-combined-with-tqdm
import istarmap_patch

files = list(Path('./').glob('*.png'))
cache = {f: datetime.fromisoformat(f.stem) for f in files}
imgs = sorted(files, key=lambda p: cache[p])


def compress(a, b):
    reference = np.array(Image.open(a))
    img = np.array(Image.open(b))

    if reference.shape == img.shape:
        delta = abs((img - reference) % 256).astype(np.uint8)
        if np.count_nonzero(delta) < 100_000:
            Image.fromarray(delta).save(b.stem + '.jxl', lossless=True, effort=1)
            return b
    return None


for fp in tqdm(
    Pool().istarmap(compress, zip(imgs, imgs[1:])),
    total=len(imgs) - 1
):
    if fp is not None:
        fp.unlink()
```

This script is fast enough for my usage. It compresses 50 images per second and finishes 25000 in 8 minutes. I did some testing with an alternative implementation in C++ and libpng, but I think the performance improvements would have been minor. Loading PNG images into an unsigned char pointer is 2x faster in C++ and we wouldn't need to compute the modulo when computing the delta because the overflow with unsigned char would wrap. But modern Python probably isn't too slow for your purpose, especially if the majority of operations are performed by libraries like `numpy` or `jxlpy`—they offload the computation to highly-optimized libraries like OpenBLAS or libjxl which themselves use a more efficient language such as C, Fortran, or ASM.

I haven't put much thought to decompression, but recovering the original image data is 10x slower primarily because there is no easy way to take advantage of parallelism. Each delta requires the previous one to be decoded. However, one nice advantage is that a whole run of deltas can be decompressed independently. Also, for data analysis like OCR, the deltas won't necessarily matter in calculations and thus you can just ignore them.

```py
from datetime import datetime
from pathlib import Path

import numpy as np
from jxlpy import JXLImagePlugin
from PIL import Image
from tqdm import tqdm

files = [*Path('./').glob('*.png'), *Path('./').glob('*.jxl')]
cache = {f: datetime.fromisoformat(f.stem) for f in files}
imgs = sorted(files, key=lambda p: cache[p])


for i in tqdm(range(len(imgs) - 1)):
    if imgs[i].suffix == '.png' and imgs[i + 1].suffix == '.jxl':
        reference = np.array(Image.open(imgs[i]))
        img = np.array(Image.open(imgs[i + 1]))
        data = Image.fromarray(((img + reference) % 256).astype(np.uint8))
        data.save(imgs[i + 1].stem + '.png')
        imgs[i + 1].unlink()
        imgs[i + 1] = Path(imgs[i + 1].stem + '.png')
```

I tested numerous permutations of this idea of delta coding images and ironically ended up settling with the simplest. I took lossy compression for a spin once, and it managed to compress 6x because JPEG XL compression is downright magical. But then I sat down, slapped myself in the face, and seriously balanced the storage savings lossy compression afforded with the facts that hard drive space is just so incredibly cheap these days and the added complexity (and thus the opportunities for error and data loss) the lossy compression code brought.

The problem with lossy compression together with delta coding is that its not a drop-in and replace kind of deal. You have to ensure not to lossy compress the reference image at the beginning of each run of deltas because in decompression the delta doesn't play nice with lossy images—this requirement also makes the code less amendable to parallelization. JPEG XL lossy compression also in and of itself takes a significant amount of processor time.

I'm not excessively worried about the security of this mechanism. My probably flawed thinking goes like this: I store past images in encrypted 7z archives and my recent screenshots probably don't have any sensitive content. Infostealers would most likely focus on exfiltrating my credentials than the 10 gigabyte screenshots folder. If an attacker does gain access to my computer, I'm screwed anyway—this mentality is probably wrong and dangerous, but you only live life once and I don't want to spend it securing my PC.
