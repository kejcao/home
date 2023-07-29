Using DOL-systems to Generate Fractals | 4 | 2023-08-01 | python,algorithms

```py
import turtle

code = 'f-f-f-f'
for i in range(2):
    code = code.translate({
        ord('f'): 'f+ff-ff-f-f+f+ff-f-f+f+ff+ff-f'
    })

turtle.speed('fastest')
for c in code:
    match c:
        case '-': turtle.left(90)
        case '+': turtle.right(90)
        case _: turtle.forward(2)
turtle.done()
```

can be used to generate quadratic Koch islands. The following DOL-system can be used to generate dragon curves
