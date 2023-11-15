Decoding Caesar Cipher in Haskell | 3 | 2023-09-08 | haskell,encryption

Caesar cipher is a substitution cipher where each letter in a message is replaced with the letter shifted by a certain fixed amount along the alphabet, concealing the message so that no one else can read it except for those who have the shift. For example "Haskell" encoded using the Caesar cipher with a shift of 3 would become "Kdvnhoo." To reveal the message one only has to shift each letter of the encoded message backward by 3.

The cipher sucks though, in terms of security. There are only 25 keys since if we shifted a letter 26 times it would wrap around and become the original letter; if we shifted it 27 times it would be the same as shifting it once, and so on. We can brute force each of those 25 keys by shifting the message by each of those keys and combing through them to spot which one parses as valid English. We can semi-automate this process by letting a machine sort the 25 shifts according to how likely it's valid English.

If you can read this and thus speak English, you no doubt recognize that the letter Z occurs less often than other letters. We can compare how often certain letters appear in an encoded message with how often they appear in real English text. If the frequencies of the letters match quite closely with real English, then probably it is real English.

We can do this using something called the chi-squared test which measures how closely two frequency distributions match each other. (Note that the "X" on the left-hand side is actually the Greek letter Chi.)

\[
    \chi^2 = \sum \frac{(O_i - E_i)^2}{E_i}.
\]

$O$ stands for observed values and $E$ for expected ones, so for our purposes $O$ will be the frequencies of our text and $E$ the expected real English frequencies. You can see how the differences between frequencies are made positive and exaggerated by taking it to the power of two. It's easily implemented in Haskell.

```hs
chiSquared :: Floating a => [a] -> [a] -> a
chiSquared observed expected = sum $
  zipWith (\o e -> (o-e)**2 / e) observed expected
```

We also need a function to convert a string to a list of 26 numbers representing the frequencies of each letter in the alphabet and a list of real English frequencies to compare against. I nabbed them off of [Wikipedia](https://en.wikipedia.org/wiki/Letter_frequency).

```hs
freqs :: String -> [Int]
freqs msg = map (count $ map toLower msg) ['a'..'z']
  where count msg c = length $ filter (==c) msg

englishFreqs =
  [ 8.2, 1.5, 2.8, 4.3, 12.7, 2.2, 2.0, 6.1
  , 7.0, 0.15, 0.77, 4.0, 2.4, 6.7, 7.5, 1.9
  , 0.095, 6.0, 6.3, 9.1, 2.8, 0.98, 2.4, 0.15
  , 2.0, 0.074 ]
```

But notice how the English frequencies are floats representing percentages that add up to 100. We want our `freq` function to produce an array that adds up to 100 too. I think it's better to split this functionality off to another function though, where we just divide each frequency by the sum of all frequencies and then multiply by 100.

```hs
normalize :: [Int] -> [Float]
normalize freqs = [100 * fromIntegral f / fromIntegral (sum freqs) | f <- freqs]
```

To get all possible 25 shifts of a message plus the original message (aka the message with a shift of 0) we need a shift function to map a character to the next one in the alphabet if the character is a letter–but before that we pattern match for Z to wrap it around to A. Then we just iterate over the message 26 times.

```hs
shifts :: String -> [String]
shifts msg = take 26 $ iterate (map shift) msg
  where
    shift 'z' = 'a'
    shift 'Z' = 'A'
    shift c | isLetter c = succ c
            | otherwise  = c
```

Finally, we have all we need to decode a message. We define a `score` function that "scores" how closely two frequency distributions match each other using the chi-squared test, then zip together the scores of each shifted message, the shift we used, and the actual message.

```hs
decode :: String -> [(Float, Int, String)]
decode msg = sort $ zip3 (map score $ shifts msg) [26,25..] (shifts msg)
  where score msg = chiSquared (normalize $ freqs msg) englishFreqs
```

We pass the list of 3-tuples through a function to render them as strings. To account for the fact that the user input may have multiple lines and that this makes things look real ugly, we replace the newlines with "<CR>." We round the score, cut off the message if it exceeds 70 characters—and if we had to do that add some ellipsis to the end.

```hs
layout :: [(Float, Int, String)] -> String
layout = concatMap (\(score,shift,msg) ->
  let msg' = intercalate " <CR> " $ lines msg
  in printf "%5d %2d   %s%s\n"
    (round score :: Int) shift (take 70 msg')
    (if length msg' > 70 then "..." else "") :: String)
```

We conclude by adding a simple main function.

```hs
main = getContents' >>= \x -> putStr (layout $ decode x)
```

We can try it out and see that on a message with a shift of 7 our code ranks the decoded message on the very top. It's pretty impressive, we gave it just a short sentence. Frequency analysis is rad.

```
$ ./Main
Ohzrlss pz h mbu wyvnyhttpun shunbhnl.
  120  7   Haskell is a fun programming language.
  351 13   Bumeyff cm u zoh jlialuggcha fuhaouay.
  354  5   Jcumgnn ku c hwp rtqitcookpi ncpiwcig.
  579  1   Ngyqkrr oy g lat vxumxgssotm rgtmagmk.
...
```

You can make this better by not just analyzing the frequency of single letters but also look at the frequencies of bigrams too—which are all letters adjacent to each other, for example "ap," "pp," "pl," "le" are the four bigrams in "apple". Also trigrams and quadgrams,  from which I've heard you get diminishing returns.
