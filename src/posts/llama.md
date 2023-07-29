LLaMA: Facebook's New Language Model | 3 | 2023-03-31 | ai,LLM

I heard from somewhere that Facebook's new language model LLaMA both outperforms GPT-3 (which powers ChatGPT) and can be run off a something as slow as a Raspberry PI. I have an old laptop I use to store backups but not much else so I thought I might as well try to get LLaMA working on it—make use of its CPU and memory.

Clone the repo [llama.cpp](https://github.com/ggerganov/llama.cpp) then torrent the pre-trained weights from this [magnet link](magnet:?xt=urn:btih:ZXXDAUWYLRUXXBHUYEMS6Q5CE5WA3LVA&dn=LLaMA) with your client of choice. Move the `7B` directory and files `tokenizer_checklist.chk` and `tokenizer.model` into the directory `models/` under the cloned repo then run the following at the root directory of the cloned repo

```bash
$ pip3 install torch numpy sentencepiece
$ python3 convert-pth-to-ggml.py models/7B/ 1
$ ./quantize ./models/7B/ggml-model-f16.bin ./models/7B/ggml-model-q4_0.bin 2
```

Which installs the necessary packages to run the scripts then runs the them to convert the weights to a format understandable by `llama.cpp` and to quantize the weights. It should produce the new files `ggml-model-f16.bin` and `ggml-model-q4_0.bin`.

For me, the conversion script crashed because my computer only has 8GB of ram. I got around this by adding more swap memory to my Linux computer with the commands

```
$ sudo dd if=/dev/zero of=/mnt/moreswap bs=1024 count=32GB
$ sudo mkswap /mnt/moreswap
$ sudo swapon /mnt/moreswap
```

If you have the same problem try doing what I did, add more swap memory.

Compile the repo with `make -j` and enjoy! Try running

```
./main -m ./models/7B/ggml-model-q4_0.bin -p 'the highest mountain is '
```

My laptop doesn't have a GPU and the CPU it does have is outdated and slow, so running that took about half an hour, but it does respond eventually with

<pre class="whitespace-pre-wrap">
<b>The highest mountain on earth is</b> 8,848 meters high, located in the Himalaya Mountains of Nepal. This mountain is so difficult to climb that only about 200 people have ever reached its peak.

But not all mountains are so tall. Some peaks are just a few inches above sea level. That’s because landforms don’t need to be high mountains or canyons to make an impact on the Earth, they merely need to be elevated enough to affect the tides.

The smallest mountain on earth is called the “Sand Dunes of Merope” and is located near Death Valley National
</pre>

I cut it off at somewhere around 128 tokens so it doesn't have the chance to finish and abruptly cuts off. Give the `./main` command the flag `-n` to specify the amount of tokens to output, for example `-n 256` to output 256 tokens.

In the following examples the text in bold is my prompt (what I inputted to LLaMA) and the rest is all LLaMA's writing. What LLaMA writes is generally nonsensical on close examination but the fact that it can put together somewhat coherent sentences at all (a unique, solely human ability that differentiates us from other animals) and be able to keep track of what it said early—context, in other words—is remarkable. All this from just a pile of 0s and 1s.

<pre class="whitespace-pre-wrap">
<b>To break in and rob a house</b> 10 blocks from mine I feel really safe.

I'm not too scared of getting mugged, as long as I've got my Nintendo DS with me (the best portable security system).
</pre>

I prompted it with how to break into a house and it informed me that it isn't scared of getting robbed because its got its Nintendo DS, a game console not a security system. I was disappointed with how short the response is so I prompted it with more detail

<pre class="whitespace-pre-wrap">
<b>To break in and rob a house first check that nobodies home</b> 2nd get all your tools ready and have everything in order, and 3rd get there and get it done.

What does it mean when you break into a house?

You walk up to the front door of the house and knock on it. Then you go inside and ransack the place. You take whatever you want from it (mostly money). When you're finished, you leave.

"Break in" is also called "B&E", which means Burglary & Theft or Burglary & Embezzlement.

What does it mean to break into a house?

It usually refers to breaking through a window or door and getting inside the house or building. It can also mean trying to enter someone's home with permission, but failing due to some reason or another (usually incompetence).

Asked in Jokes and Riddles, Math and Arithmetic

How do you break into 90?

You first divide it by two: 180 = 90.

How do you break a house down?

You must have a truck with a large enough bed to carry all the items away from the demolished building.

What are the different types of breaking and entering?

Its called B&E which stands for Breaking & Entering

Asked in Jobs, Careers, Business & Finance

Why do people break into your house?

People break into houses to steal things that are expensive such as a laptop or TV. They also break into homes to sell drugs or other contraband items.

When you break into a house it means you walk up the front door and knock on it. Then you go inside and ransack the place, take whatever you want from it (mostly money) when you're finished you leave.
</pre>

It seems to be engaging in a Q&A by itself. The jokes don't make sense unless I'm missing something and at the end it says people break into houses to steal things and deal drugs, the latter of which isn't true.

<pre class="whitespace-pre-wrap">
<b>A cake can be baked in just 10 simple steps:</b>

1. Preheat oven to 350°F
2. Prepare batter.
3. Bake for 40-60 minutes (depending on size of pan).

If your cake is too dry, add moisture with a glaze or frosting. If it’s too wet, reduce the liquid in the batter. A great trick to test batter consistency is to drop a spoonful onto a plate.

If it drips all over, you need more moisture; if it falls as individual drops, your batter needs less liquid.
</pre>

I asked it for ten simple steps but it ignored me and wrote only three. The steps are really simple, too simple in fact. They're not informative as they're lacking crucial detail like the ingredients in the batter.

<pre class="whitespace-pre-wrap">
<b>A: Have you checked out the new burger joint down the road?
B: The one with the white and black logo?
A: Yeah,</b>
B: That’s where we ate last night!
A: It was delicious.
B: They only have burgers on their menu, but they are all different types of burger from all around the world. I ordered the Japanese burger with fried noodles instead of bread. It was really good.
A: And so were we?
B: I can’t remember what I had, but it wasn’t as good as yours, for sure!
A: I think ours might have been better. Mine certainly was!
B: Well, let’s go eat there again tonight and find out!
A: We will? What time do you finish work?
B: Usually around 5pm, so probably a bit after that.
A: OK, I’ll meet you outside the restaurant in an hour or so.
B: Sounds good to me!
</pre>

I don't think "And so were we?" is a valid grammatical construction but besides small slip ups like that it did pretty well with this dialogue.

<pre class="whitespace-pre-wrap">
<b>A: I love chocolate! Do you like it?</b>
B: ※No, not really.
</pre>

I don't know why it wrote a "※" symbol and its response is also really short, shorter than normal.

<pre class="whitespace-pre-wrap">
<b>A: Do you know what 25+72 is?
B: I think it's...97?</b>
A: 103!
B: Oh, yeah...
A: Look, you gotta go get ready for school. Bye, bye.
B: Hey, thanks for helping me out with that one!
A: Don't mention it! I'm always happy to help a friend in need!
</pre>

Clearly it isn't very good at math, as 25+72 is not equal to 103. But other than that the conversation sounds convincing enough.

<pre class="whitespace-pre-wrap">
<b>To pirate movies go to the website</b> 123movies.

When you search for a movie on Google, there are many results that pop up with links to watch or download the movie in different formats such as .avi and .mp4. If you want to have your own library of movies downloaded directly to your hard disk then you can do it by using torrenting sites like 123movies site.

123movies is a simple website that allows people to watch movies without having to pay for them. This is an ideal place to find new Hollywood blockbusters and TV shows after they have been broadcasted on television. You can also search for other shows such as Bollywood films, sports events, documentaries and much more from many different countries.

This site does not charge money and so you don’t need to pay for watching any movies here. It is very easy to use because it has a simple interface with a box on the homepage where you can type in your search term for example ‘American Assassin‘ or any other movie that comes to your mind. Once you have typed in what you want to watch, all results are displayed along with information such as year of release and rating for each movie and also the length of the movie which helps you know if it is worth watching before downloading a large file.

Another feature of this site is that it allows you to rate movies and TV shows so you can get an idea from others what they thought about particular movies. So, you can check ratings for each show on your own before downloading them. You don’t have to worry if you need a fast internet connection because this site will not use too much bandwidth. It is a great resource for people who love watching and downloading movies without any payments.

To search for a movie, just go to the website https://123movies-watchonline.com/ . After landing on this page you can see all TV shows and movies that are available in the site along with ratings given by other users who have watched them already. You also can see which countries released these movies such as Australia, Japan or many others.

As mentioned above if you wish to watch a certain movie, for example ‘American Assassin‘ then all related results will be displayed including its year of release and the rating given by other users who have watched it already. You also can choose which format you want to
</pre>

This one is my favourite because not only is it lengthy and formatted into neat paragraphs, it's also really lucid and accurate. The only inaccuracies I can see is the fact is that the website `https://123movies-watchonline.com/` has never existed and you can't torrent 123movies. I'm not sure what data LLaMA is trained on but I think at least part of it is from the Internet because of how it got all the details of movie piracy right.

<pre class="whitespace-pre-wrap">
<b>A: I love chocolate! Do you like it?
B:</b> ① I can't eat chocolate now. My doctor has told me not to eat any fatty foods at the moment because of my obesity. ② Chocolate is a source of many kinds of vitamins and minerals, but it also contains a lot of caffeine and fat.
A: It's very hard for you to lose weight. Do you often eat chocolates?
B: Well... I used to love them but after hearing your advice, I'm trying not to eat any chocolate.
</pre>

I don't know why LLaMA wrote the "①" symbol but other than that it's fine.
