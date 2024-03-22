Fast & Lightweight Millisecond-level Face Detector in Python | 1 | 2024-01-02 | python,AI,CV

I thought I'll share some simple Python code to detect faces that makes use of [YuNet: A Tiny Millisecond-level Face Detector](https://link.springer.com/article/10.1007/s11633-023-1423-y). I adapted the code from [here](https://gist.github.com/UnaNancyOwen/3f06d4a0d04f3a75cc62563aafbac332) and snatched the model file `yunet.onnx` from [here](https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet)—I couldn't get the int8 quant to perform perform consistently, so I would just go for the already very light base model.

```py
import numpy as np
import cv2

detector = cv2.FaceDetectorYN_create('yunet.onnx', '', (0,0))
capture = cv2.VideoCapture(0)

SCALE = 1

while True:
    _, img = capture.read()
    h, w, channels = img.shape
    assert(channels == 3)
    w //= SCALE 
    h //= SCALE 

    detector.setInputSize((w,h))
    _, faces = detector.detect(cv2.resize(img, (w,h)))
    if faces is None:
        faces = []

    for face in faces:
        face = [int(i)*SCALE for i in face]
        color = (0, 0, 255)

        box = face[:4]
        cv2.rectangle(img, box, color, 2, cv2.LINE_AA)

        landmarks = face[4:len(face)-1]
        landmarks = np.array_split(landmarks, len(landmarks) / 2)
        for landmark in landmarks:
            cv2.circle(img, landmark, 5, color, -1, cv2.LINE_AA)

    cv2.imshow('', img)

    key = cv2.waitKey(10)
    if key == ord('q'):
        break

cv2.destroyAllWindows()
```

I added the `SCALE` constant that can scale down the webcam image before feeding it into YuNet to process. When set to 4 it results in an 86% reduction in CPU usage—on my machine that means the code uses only around 0.3% of my total CPU. I could see myself in the future incorporating this code into some project that involves detecting a users face.
