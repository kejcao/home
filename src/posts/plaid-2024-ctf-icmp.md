Plaid CTF 2024: An Approach to ICMP | 1 | 2024-04-14 | ctf,writeup,cv

"(Inter-Corporeality Messaging Protocol) We left an ouija board out as a joke, but then it started moving and it stopped being a joke." This was the description of a challenge in the 2024 Plaid CTF where we are given a 2 hour long [YouTube video](https://www.youtube.com/watch?v=FGRs-6mMFTU) featuring a ghost telekinetically controlling a planchette over a Ouiji board, communicating certain symbols to us by pausing over them.

In the Plaid CTF Discord, some thought the only option was to bruteforce it with manual human labour. Instead, the challenge can be though of as a computer vision problem. The observation I made is that the hole in the planchette has a high-contrast white outline. To detect the hole then, we can use the circle Hough Transform. We can increase the contrast and sharpen the image beforehand to make the hole easier to detect.

!opencv-annotated-ouiji-board.png

An accidental property of this approach I observed was that the circle Hough Transform only detects the hole in the planchette when it is paused, and not when it is in motion (because it becomes slightly blurred). Therefore, we can simply count the number of consecutive frames where we can detect a circle and where the planchette is therefore paused. If this pause duration exceeds a certain threshold, then the planchette has paused for a length of time and we can assume that the ghost is attempting to communicate a particular character.

I've uploaded a [YouTube video](https://www.youtube.com/watch?v=iW8Vxv-fLX4) showing the `video_output` of the script. The `m` dictionary annotates the position of every character on the Ouiji board—the positions were found manually. The approach of relying on whether the circle Hough Transform is successful or not at detection to determine whether the planchette is stationary seems iffy, and in fact isn't reliable. It's right 99% of the time.

```py
import cv2
import numpy as np
import math

m = {
    (369.0, 316.0): 'a',
    (415.5, 284.0): 'b',
    (465.0, 267.0): 'c',
    (508.0, 255.0): 'd',
    (552.5, 246.0): 'e',
    (592.5, 241.5): 'f',
    (640.5, 238.5): 'g',
    (684.5, 241.5): 'h',
    (726.0, 248.0): 'i',
    (760.5, 259.0): 'j',
    (801.0, 267.0): 'k',
    (847.5, 288.5): 'l',
    (893.5, 316.0): 'm',
    (372.0, 402.0): 'n',
    (419.5, 376.0): 'o',
    (451.5, 353.0): 'p',
    (502.0, 336.5): 'q',
    (539.5, 319.5): 'r',
    (585.5, 313.0): 's',
    (632.5, 313.0): 't',
    (680.0, 311.5): 'u',
    (727.5, 317.5): 'v',
    (777.5, 335.5): 'w',
    (822.5, 359.5): 'x',
    (862.5, 385.0): 'y',
    (901.5, 413.5): 'z',
    (447.0, 451.0): '1',
    (481.0, 449.0): '2',
    (524.0, 448.0): '3',
    (566.5, 452.5): '4',
    (613.5, 452.0): '5',
    (661.0, 452.0): '6',
    (704.5, 451.5): '7',
    (747.0, 453.0): '8',
    (786.5, 451.0): '9',
    (830.5, 449.5): '0',
    (575.0, 520.5): '(GOOD)',
    (729.5, 520.0): '(BYE)',
    (823.0, 180.5): '(NO)',
    (464.0, 171.5): '(YES)',
}
cap = cv2.VideoCapture('Inter-Corporeality Messaging Protocol [FGRs-6mMFTU].mkv')

output_video = cv2.VideoWriter(
    'out.mp4',
    cv2.VideoWriter_fourcc(*'mp4v'),
    cap.get(cv2.CAP_PROP_FPS),
    (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))),
)
text_ring = []
circle_streak = 0
while True:
    success, frame = cap.read()
    if not success:
        break

    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    frame = cv2.convertScaleAbs(frame, alpha=1.4)  # Increase the contrast of the image
    frame = cv2.addWeighted(
        frame, 2.4, cv2.GaussianBlur(frame, (0, 0), 2.0), -1.0, 0
    )  # Sharpen the image

    # Perform circle Hough Transform on cropped frame, where the planchette is
    (x, y, w, h) = (305, 117, 682, 463)
    circles = cv2.HoughCircles(
        frame[y : y + h, x : x + w],
        cv2.HOUGH_GRADIENT,
        1,
        20,
        param1=200,
        param2=30,
        minRadius=25,
        maxRadius=50,
    )

    frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)

    circle_exists = False
    if circles is not None:
        circles = np.uint16(np.around(circles))
        for circle in circles[0, :]:
            # Remember, we performed circle detection on cropped frame. (cx,cy) are coordinates normalized to entire frame.
            cx = x + circle[0]
            cy = y + circle[1]

            # There are 2 common mis-detections at specific coordinates, this code is to avoid them.
            if math.sqrt((cx - 363) ** 2 + (cy - 161) ** 2) < 15:
                continue
            if math.sqrt((cx - 906) ** 2 + (cy - 178) ** 2) < 15:
                continue

            # At this stage, the circle belongs to the planchette
            circle_exists = True
            if circle_streak == 6:
                # Not much to say, we find which letter the center of this circle is closest to
                best = (math.inf, None)
                for (cx_, cy_), letter in m.items():
                    distance = math.sqrt((cx - cx_) ** 2 + (cy - cy_) ** 2)
                    if distance < best[0]:
                        best = (distance, letter)
                print(best[1], end='', flush=True)

                # For the debug output video
                text_ring.append(best[1])
                if len(text_ring) > 3:
                    text_ring = text_ring[1:]

            # Draw the circle, for the debug output video
            cv2.circle(frame, (cx, cy), circle[2], (0, 255, 0), 2)

    # If we have detected the circle, then increase streak - if not, then reset the streak.
    if circle_exists:
        circle_streak += 1
    else:
        circle_streak = 0

    # Paint debug text and add frame to video
    cv2.putText(
        frame,
        f"({', '.join(text_ring)})",
        (0, 24),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (255, 0, 0),
        2,
        cv2.LINE_AA,
    )
    output_video.write(frame)

print()
output_video.release()
cap.release()
cv2.destroyAllWindows()
```

On my CPU the code took 42 minutes to complete so it runs at roughly ~3x the speed of the video input.

Here is the full message the Python script transcribed with the beginning segmented and the base64 output interpreted according to the ghost's instruction. Note that the base64 is a JPEG file, but it's corrupted because my transcription is inaccurate—and I didn't managed to get the flag 😔😔 After the CTF I did a diff of the official solution against mine, and it turns out that out of the 3861 characters my script got 30 wrong, so less than a 1% error rate but base64 is sensitive to errors like that. One of the solutions was to extract a background image then track the planchette that way, and I'm only a little upset that I missed that solution 🙃 To be fair with me, the first error was ~500 characters in, and my manual translations for the initial text matched the automated scripts results so I assumed it would be accurate all the way through.

````
hello is anyone listening i need to show you something important im going to send you a message in base64 im starting in uppercase and will use (YES) as capslock instead of slash i will use (NO) instead of plus i will use (GOOD) instead of equals i will use (BYE) are you ready starting in 321

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
````

I investigated another approach actually, which involved tracking the planchette using a CSRT tracker, but over the long-term the tracking quality severely degrades and the tracker gets caught/stuck on certain circular background symbols.
