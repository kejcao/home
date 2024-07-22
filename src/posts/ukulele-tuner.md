A Ukulele Tuner in React | 1 | 2024-07-15 | react,web

I really like [GuitarTuna](https://yousician.com/guitartuna), an online tuner for musical instruments with a fun and intuitive user interface. For some reason they only allow you to tune a guitar and not a ukulele, perhaps to encourage you to install the mobile app?

I have a ukulele and I want to tune it sometimes. So, I wrote my own React web app that replicates GuitarTuna's functionality. Check out the [Vercel deployment](https://ukulele-tuner.vercel.app/) or the [GitHub](https://github.com/kejcao/ukulele-tuner) repo.

I analyzed the network traffic and code from GuitarTuna and surmised that it performs FFT with WebAssembly, converting time domain data from the microphone into frequency bins. It uses these bins to detect the pitch of a string played. My process is very similar, with the minor difference being that I utilize the AnalyserNode provided by the browser from the Web Audio API for FFT. I select the maximum available FFT size of 32768.

Assuming a sampling rate of 44100 hertz, this allows for about a 1.35 hertz frequency resolution. Each frequency bin is evenly spaced and represents the intensity of a frequency interval. For example, the first bin represents the intensity of the frequencies between 0 and 1.35 hertz, the second bin represents the intensity of the frequencies between 1.35 and 2.7 hertz, etc.

Once we have the frequency data from FFT, we can restrict our consideration solely to the bins with frequencies that correspond between the lowest and highest notes a ukulele can play, the C4 and A4 strings respectively. Finding the frequency bin between this range that possesses the highest intensity corresponds to the frequency of the note currently being played. For example, with a FFT size of 32768 we get 16384 bins (because anything above the Nyquist frequency is symmetrical, no information is gained from the bins above half the FFT size) so, if bin 194 has the greatest intensity, then 194 multiplied by 1.35 is about 261 hertz, the frequency for the C4 note.

I coded a minimalistic interface to allow the user to easily tune their ukulele. I mimicked GuitarTuna's vertically-scrolling black background with a subtle white grid by employing three linear gradients in CSS. The circle in the middle that indicates how far the pitch is off by is a single div, whose horizontal position is manipulated in JavaScript through the margin left property. I play a nice sound effect when the string played is within 3 hertz of the frequency of the note, and mark that note with a green color to show that it has been tuned correctly.

This was quite an enjoyable and short web project. Took two evenings.
