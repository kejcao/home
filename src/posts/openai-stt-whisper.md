OpenAI Whisper: Speech To Text Using AI | 2 | 2023-10-22 | python,AI

I've been messing around with [Whisper](https://github.com/openai/whisper) these past few days. It's a machine learning model that OpenAI trained which automatically generates subtitles in multiple languages. In other words, it transcribes audio into text using some AI black magic. It's ironic that for an organization named "OpenAI," this is one of the few models—to my knowledge—that they've made open source.

In a Microsoft [paper](https://www.microsoft.com/en-us/research/wp-content/uploads/2017/06/paper-revised2.pdf) I found online, they basically state that a human transcriber can achieve 4–5% WER (word error rate). OpenAI Whisper can achieve 4.4% WER with the medium model. This means Whisper can transcribe English as well if not better than a human being, which is amazing. We're going to use the medium model for the rest of this article since the large one requires 2x CPU and more RAM but is only very marginally better at transcribing English.

I made it 2–4x faster by installing and using [Faster Whisper](https://github.com/guillaumekln/faster-whisper) instead of OpenAI's version. Although you can install both using PIP, my package manager prohibits me from doing that for some reason. So what I did was clone the repo, create a virtual environment, and install all the requirements.

```shell
$ git clone https://github.com/guillaumekln/faster-whisper
$ cd faster-whisper/
$ python3 -m venv .
$ . bin/activate
$ python3 -m pip install -r requirements.txt
```

I wrote a very simple command-line interface for it that takes a single argument referencing an audio or video file and outputs the SRT subtitles. Only notable thing about the script is that we are given a float as the timestamp, so we need a function that converts the float into the time format SRT uses.

```py
import sys

if len(sys.argv) != 2:
    print(f'usage: {sys.argv[0]} file')
    sys.exit(1)

from faster_whisper import WhisperModel
from datetime import datetime

segments, _ = (
    WhisperModel('medium', compute_type='float32')
        .transcribe(sys.argv[1]))

for i, segment in enumerate(segments):
    def fmt(t: float) -> str:
        return (datetime
            .utcfromtimestamp(t)
            .strftime('%H:%M:%S,%f')[:-3])

    print(f'''
{i+1}
{fmt(segment.start)} --> {fmt(segment.end)}
{segment.text.strip()}
    '''.lstrip(), flush=True)
```

It's around 2x faster than OpenAI's Whisper without any loss or difference in quality. 4–5x faster (depending on how much silence you have in the audio) if you enable `vad_filter` which works by only running Whisper on parts of the audio that have speech. Faster Whisper transcribes English faster than realtime on my AMD Ryzen 7 PRO 6850U (which almost reaches 1 TFLOP, for reference). For the 16-minute Oscar-Nominated short "[Affairs of the Art](https://www.youtube.com/watch?v=bAX9_rDvO_c)" it took about 12 minutes. You can download the full [subtitles](/affairs-of-the-art.srt) but the beginning looks like this (I erased the timestamps, they take up too much space):

````
I'm into art now. I'm drinking from the cup of creativity again. I'm back on track, hooked, besotted with drawing. It's all I want to do. I think I'm quite good at it, you know, in a russuesque sort of way. Ivers, my model, I work him to the bone. He's very tolerant, though. Last week when I asked him to be a nude, descending a stack, as he said. Who we referencing, bear? Duchamp or Boccioni? Art. I'm obsessed. I think I'm turning into my sister Beverly. She never liked drawing or playing with dolls like me. She liked insects, woodlice and beetles. She kept them all in a big fishbowl. She'd wait until they pegged out and she'd put them in coffins she'd made out of little...
````

One problem that annoys me but not enough for me to fix it is that the first timestamp always starts at 0:00, so the first subtitle is displayed minutes before any characters even begin speaking. Also, I don't think the model incorporates context, so it gets some words wrong that I don't. For example, the model mistakes "grand" with "grant" but I understand that she says "grand" in reference to her grandmother. If I went purely off sound, I would've been mistaken too.
