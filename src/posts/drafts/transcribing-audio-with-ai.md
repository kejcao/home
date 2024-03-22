Transcribing Audio With AI | 1 | 2024-01-12 | tags

I sometimes encounter long form video or audio like a video by Horses on *[How to Perform an Exorcism](https://www.youtube.com/watch?v=WQLnIv3Y6Dc)* that my attention-span rotted brain doesn't have the patience to sit through. In cases like these, I download the video using a tool like `yt-dlp`.

```py
import argparse
from faster_whisper import WhisperModel
from datetime import datetime

parser = argparse.ArgumentParser()
parser.add_argument('audio', type=str, help='path to audio file')
parser.add_argument('-q', '--quiet', action='store_true', help='do not add timestamps')
parser.add_argument('-f', '--fast', action='store_true', help='use tiny.en model instead of medium')
args = parser.parse_args()

segments, _ = WhisperModel(
    'tiny.en' if args.fast else 'medium',
    compute_type='float32'
).transcribe(args.audio, language='en')

for i, segment in enumerate(segments):
    def fmt(t: float) -> str:
        return (datetime
            .utcfromtimestamp(t)
            .strftime('%H:%M:%S,%f')[:-3])

    if not args.quiet:
        print(f'''\
{i+1}
{fmt(segment.start)} --> {fmt(segment.end)}\
        ''')
    print(segment.text.strip())
```

I then pump the transcribed text into [](https://labs.perplexity.ai/)

````
The Catholic Church has officially published guidelines and procedures for diagnosing demonic possession and performing an exorcism. But this is just one piece of a much larger picture. For centuries, there has existed a mysterious esoteric side of the Christian faith. It does not prescribe to any denominations of Christianity. Instead, it demands that the individual surrender all ideas about what God is or what the universe could be. These preconceived notions are said to be just false idols. The truth is more profound and exponentially more intense. This is the practice of Christian mysticism. This approach to the religion has allegedly served as the gateway to phenomena both divine and satanic. The wounds of stigmata, divine visions, and prophecy, levitation, and divine ecstasy have all been reported by these followers. Later in this essay, I will discuss this practice and these phenomena in great detail. For now, I should start with what was promised. How to perform an exorcism. Before we get truly started, there is something I should say. I myself am not Christian, and this essay will not evangelize about the Christian faith. Whether my personal beliefs are not really relevant to the conversation at hand. So I will treat Christian mystical traditions and phenomena with a level of reverence. This is partially in an effort to be respectful. It is also to avoid fatiguing the viewer with the constant inclusion of personal, disclaiming language.

Diabolical intervention can be described as any intrusion on human life by a demon or the devil. A demon being a fallen angel was been cast out of heaven for helping Satan rebel against God. But a mystical reading of the Bible does result in some qualifications for the diabolical. The first and most important principle is that demons do exist and can meaningfully interface with human beings in ways both physical and spiritual. The mystics accept this as fact. However, the mystics say that human will can only be moved in two ways by God or by man's free will. So the most that demons can do is persuade. They cannot entirely take over a person's free will, but they can influence very strongly. To aid in this, demons can perform seemingly miraculous feats. These feats will arouse a man's admiration and interest to the extent that the individual will feel compelled to follow the demon. However, it should be stated that these feats are not true miracles. Although seemingly miraculous, only God can perform a true miracle as defined by the mystics.

There are a lot of other things demons simply cannot do. A demon cannot as stated produce any truly divine phenomena. A demon also cannot create any substance the power of creation belongs to God alone. A demon cannot raise the dead, though he may be able to produce the illusion of having done so. Only God can heal, so a demon can never truly cure wounds, fractures, or injuries. Demons cannot make true prophecies because the devil does not know what God may bring about. Nor does a demon have access to a human's intellect or will, so he can't truly know a person's secret. Demons are said to be remarkably intelligent, though, so they could predict people's behaviors quite astutely.

So limitations aside, what can a demon do? A demon can produce visions both corporeal and imaginative. A demon could falsify the state of religious ecstasy in an individual or even produce the light and heat that many mystics have claimed to experience through God. A demon could cause an illness and then cure it, virtually mimicking the power of healing. This includes producing the stigmata, which is something we will talk about later in this video. However, even more dangerous than these tricks and more relevant to the subject of exorcism, the mystics believe in demonic obsession and possession.

Most versions of Christianity believe in the temptation of the devil, that demons or Satan can tempt humans into sin. But the mystics specifically believe in two more severe alternatives, demonic obsession and demonic possession. Mystic texts do not reveal a hard line between temptation and obsession, but in general authentic obsession sees clear satanic activity on, but separate from the individual. The soul is aware of an external force trying to exert violence upon it, but the soul also maintains its own agency. Obsession can be internal or external. Internal obsession affects a person's interior faculties, most specifically the imagination. This can manifest as a fixed idea within the intellect or by vivid images and sounds within the mind. Internal obsession may impart on a person a set of duties or goals that they otherwise would find repugnant. The mystics say that the best antidote for interior obsession is prayer, self-destain, confidence in God, and the use of sacraments in the church.

External obsession presents more spectacularly, but in reality is less dangerous. In cases of external obsession, an individual sees devilish apparitions in a very real physical sense. These visions can be pleasant, should the devil transform himself into an angel to deceive the individual's soul, but some visions may be more straightforward. Satan may appear in horrifying forms to terrify the servants of God away from their practice. A person may hear screams and shouts of blasphemy or songs designed to arouse sensuality. In external possession, a person may perceive either pleasant odors or an unbearable stench wherever they go. The sense of taste can also be affected. The devil often mixes objects or insects into a person's food or causes meals to taste spoiled and bitter. Lastly, there is the sense of touch. An individual can feel things caused by the devil. These may be bruises, cuts, or blows. They could also be pleasant, sensuous, caresses, or warm embraces.

Both types of obsession are due to one of three causes. The first is God giving permission to the devil to affect a soul in order to test that individual's faith. The second is the pride of the devil. The mystics believe that sometimes the devil cannot bear the sight of a soul, trying to glorify God, and so he attacks. Thirdly, an obsession may be due to an individual themselves. Specifically, the natural predisposition of the weak. Someone who is inclined to melancholy, sadness, or anxiety is believed to be more susceptible to demonic obsession.

More dangerous than mere obsession though is possession, where obsession is a series of external attacks on a person. Possession is the full taking over of a victim's body by satanic forces. Mistics recognize that so-called possessions may often be caused by mental health crises and that true possessions are extraordinarily rare. But within mystical practice, there is no debate about the existence of diabolical possession. Various cases are described in the Gospels and the Gospels are the ultimate truth. Furthermore, within the church itself, there have been numerous cases of this possession. Indeed, the church has instituted official exorcism rituals, which we will discuss momentarily.

In a possession, the devil invades the body of a living person and moves his faculties and organs as if they were his own. The devil truly resides within the victim, physically, but not spiritually. Consider a man driving a car. Through physical means the man can steer break and accelerate, but the man is still, of course, a separate entity from the car itself. Such is demonic possession. Only God has the power to penetrate truly into a person's soul, so the soul of a possessed individual remains free. The primary purpose of a possession is to disturb the soul and draw it to sin in a rebellion against God.
````
