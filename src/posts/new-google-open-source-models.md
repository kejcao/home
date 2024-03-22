Google's New Open Source Models: Magika & Gemma | 1 | 2024-02-25 | AI,news

Google haven't had a spectacular history with AI recently. Whether it be [misleading](https://arstechnica.com/information-technology/2023/12/google-admits-it-fudged-a-gemini-ai-demo-video-which-critics-say-misled-viewers/) multimodal LLM benchmarks or woke AI [art generators](https://www.nytimes.com/2024/02/22/technology/google-gemini-german-uniforms.html), Google has been falling behind other companies like Microsoft and OpenAI in terms of development despite inventing the transformer architecture and making other important contributions to the field of machine learning. However, recently, Google released 2 interesting open source AI models.

- A 1MB deep learning model for fast and efficient file identification, named [Magika](https://opensource.googleblog.com/2024/02/magika-ai-powered-fast-and-efficient-file-type-identification.html?utm_source=substack&utm_medium=email), which beats hand-crafted heuristics and VSCode's Guesslang.
- [Gemma](https://blog.google/technology/developers/gemma-open-models/), a family of language models that continue Google's exhilaratingly creative naming scheme. Gemma comes in 2 and 7 billion parameters versions. Google claims that Gemma beats other language models in a similar weight class such as Mistral-7B in benchmarks.

4-bit quantized GGUF files for both the 2B and 7B variants of Gemma are available on Hugging Face, so you can run it with `llama.cpp` or on a frontend tool like Ollama. Currently, Perplexity Lab's [playground](https://labs.perplexity.ai/) also hosts Gemma-2B and 7B online for free. Alternatively, you can use `gemma.cpp`, Google's lightweight inference engine written for Gemma exclusively, inspired by `llama.cpp`. To use it, clone and build the project,

```shell
$ git clone https://github.com/google/gemma.cpp
$ cd build
$ cmake ..
$ make -j4 gemma
```

Then go on [Kaggle](https://www.kaggle.com/models/google/gemma) and download yourself some model weights. I recommend getting the 2B sfp-compressed instruct weights for your first attempt. Extract the archive the model weights come in and move the contents (a `.sbs` and `.spm` file) into the `build/` directory in the `gemma.cpp` repository. Now run the command,

```shell
$ ./gemma --tokenizer tokenizer.spm --model 2b-it --compressed_weights 2b-it-sfp.sbs
```

To hold a conversation with Gemma-2B. I find it quite incoherent in multi-turn conversation, and I believe that its benchmarks are worse than Microsoft's Phi-2. Also users' real world experience with it haven't been [stellar](https://www.reddit.com/r/LocalLLaMA/comments/1axxi5s/gemma_vs_phi2/). Overall, despite the benchmarks, Gemma doesn't seem to be a very good LLM—it doesn't help that it's crippled by all of its censoring, like Gemini is. Google's LLMs remind me of [goody-2](https://www.goody2.ai/), a satirical chatbot that mocks the LLM safety instituted by certain AI companies.

---

Magika is more exciting and holds greater real world utility in my opinion. Before Magika, I wasn't aware that deep learning was used in file identification. Apparently VSCode uses a tool called Guesslang, which likewise uses deep learning to identify the programming language of a piece of text. I can't wait for the paper their going to release later this year on the training details and Magika's performance on large datasets, since I'm really curious as to how it works.

Google uses Magika internally to improve malware detection by routing files to the appropriate specialized security scanners. Here are a few examples of Magika in action on local files I have lying around.

```shell
$ magika ruler.py
ruler.py: Python source (code)
$ magika - <ruler.py # Magika doesn't rely on file extension
-: Python source (code)
$ magika /usr/bin/ls
/usr/bin/ls: ELF executable (executable)
$ magika notes.md
notes.md: Markdown document (text)
```

Although Google has a tendency to heavily sensor their models and exaggerate benchmarks, they have developed impressive technologies like the Gemini Ultra with 10 million tokens of context length and AlphaGeometry, a system that can solve geometry problems at the Olympiad-level, among other things. I don't complain when a company releases open source models, regardless of quality, and I hope Google releases more.
