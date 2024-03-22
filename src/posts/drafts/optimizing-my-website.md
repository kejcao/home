An Arithmetic Game in Haskell | 1 | 2023-12-21 | hs

In an effort to improve my lackluster mental math skills I've wrote some Haskell code (and as an opportunity to improve my Haskell skills)

Let us first define a function that displays a question/query then checks whether the user input is equal to the answer to that question.

```hs
check :: String -> String -> IO ()
check query ans = do
    putStr query
    hFlush stdout

    l <- getLine
    if l == ans
        then return ()
        else check query ans
```

Now let's make a function that leverages `check` and prompts the user with addition question

```hs
addition = do
    a <- randomRIO (1000 :: Integer, 9999)
    b <- randomRIO (1000 :: Integer, 9999)

    check (show a ++ " + " ++ show b ++ " = ") (show $ a + b)
```
