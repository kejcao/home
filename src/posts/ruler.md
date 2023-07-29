A Digital Ruler in Python | 3 | 2023-05-02 | python,GUI

I occasionally need to measure something in the corporeal world but never seem to have a ruler handy, so I wrote a bit of Python code that uses the `turtle` graphics module to draw a to-life scale digital ruler. The `turtle` module is a wrapper around a Tkinter canvas and is meant for introducing kids to programming so it isn't powerful, but for the simple use case of drawing a ruler `turtle` can handle it. It's been a while since I've used the module so the code isn't very clean.

!digital-ruler.png

The code shown below should draw the above image of a standard yellow ruler onto an unresizable pop up window.
 
```py
#!/usr/bin/python3

from turtle import *
from tkinter import *

PPM = 4.857685009487666
PPI = PPM * 25.4

WIDTH = PPM * 303
HEIGHT = 100
START_OFFSET = PPM

root = Tk()
root.title('turtle ruler')
root.resizable(False, False)
canvas = Canvas(root, width=WIDTH, height=HEIGHT)
canvas.pack()
screen = TurtleScreen(canvas)
turtle = RawTurtle(screen)

screen.bgcolor('#f1aa00')
screen.tracer(0, 0)
screen.setworldcoordinates(0, 0, WIDTH, HEIGHT)

turtle.forward(START_OFFSET)
for i in range(int(WIDTH / PPM)):
    turtle.left(90)

    travel = 12
    if i % 10 == 0:
        travel = 24
    elif i % 5 == 0:
        travel = 18
    turtle.forward(travel)
    if i % 10 == 0:
        turtle.write(i//10, align='center')
    turtle.back(travel)

    turtle.right(90)
    turtle.forward(PPM)

turtle.penup()
turtle.goto(0, HEIGHT+1)
turtle.pendown()

turtle.forward(START_OFFSET)
for i in range(int(WIDTH / (PPI/6))+1):
    turtle.right(90)

    travel = 12
    if i % 6 == 0:
        travel = 24
    elif i % 3 == 0:
        travel = 18
    turtle.forward(travel)
    if i % 6 == 0:
        turtle.penup()
        turtle.forward(16)
        turtle.pendown()
        turtle.write(i//6, align='center')
        turtle.penup()
        turtle.backward(16)
        turtle.pendown()
    turtle.back(travel)

    turtle.left(90)
    turtle.forward(PPI/6)

turtle.penup()
turtle.home()
canvas.bind('<Button-1>', lambda event: root.destroy(), None)
canvas.tk.mainloop()
```

To draw accurate measurements the code needs to know either the PPM (Pixels Per Millimeter) or PPI (Pixels Per Inch). I figured out the PPM on my Linux PC by evoking `xrandr`:

```
$ xrandr
Screen 0: minimum 320 x 200, current 2560 x 1440, maximum 16384 x 16384
HDMI-1 connected primary 2560x1440+0+0 (normal left inverted right x axis y axis) 527mm x 296mm
   2560x1440     59.95*+
   1920x1440     60.00
   1920x1200     59.95
   1920x1080     60.00    50.00    59.94
   1920x1080i    60.00    50.00    59.94
   1680x1050     59.88
   1400x1050     59.95
   1280x1024     75.02    60.02
   1440x900      59.90
   1152x864      75.00
   1280x720      60.00    50.00    59.94
   1440x576      50.00
   1024x768      75.03    70.07    60.00
   832x624       74.55
   800x600       72.19    75.00    60.32    56.25
   720x576       50.00
   720x576i      50.00
   720x480       60.00    59.94
   720x480i      60.00    59.94
   640x480       75.00    72.81    66.67    60.00    59.94
   720x400       70.08
DP-1 disconnected (normal left inverted right x axis y axis)
```

And you can see that at the very top it says that my monitor is 2560px across and 527mm across, so with some basic math $2560\text{px}/527\text{mm} \approx 4.857\,\text{PPM}$. To get the PPI the code just does a simple conversion from millimeter to inch.

As I stated above, it's been a while since I've used `turtle` so some of the code is probably redundant and can be achieved in an easier way. I have to use `RawTurtle` and create my own window because I need the screen to be unresizable and while we could try to make use of `turtle`'s internal functions and hack together something like

```py
from turtle import *

turtle = Turtle()
screen = Screen()

screen.getcanvas()._root().resizable(False, False)

screen.exitonclick()
```

There are several problems with this approach and besides I don't want the border `turtle` always draws on initialization. It's much easier to make our own Tkinter window and canvas and pass it to `turtle`.

BTW `turtle`'s source code is just 4000 lines and very easy to read. Many times during the short development of the ruler code, I consulted the source code.
