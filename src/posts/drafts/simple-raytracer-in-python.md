A Simple & Basic Raytracer in Python | 3 | 2023-09-23 | raytracing,python,algorithms

A raytracer casts light rays for each pixel from a camera and determines whether or not this ray hits an object. By doing this, it can project 3D scenes onto a 2D screen. This is not how video games and other real-time applications render 3D objects—they use a techinque called rasterization—but it is how software like Blender (using the rendering engine Cycles) and Autodesk Arnold render their scenes.

We'll be writing one today in Python using only NumPy and PIL. It is going to be a painfully slow raytracer (we can get 500x faster rendering if one wrote it in C++) but writing it in Python makes the code take up less space. To get us started, we define a `Camera` class that takes the position it's located (called an origin), the direction it's facing, the "canvas" (i.e. the output image) dimensions, and the viewport dimensions. It has only one public function `render` which takes a list of objects and light sources and renders an image by writing it to a PNG file.

Conceptually, the camera represents a infinitesimally small point from which the rays will be generated, and a `vw` by `vh` plane in front of this point which is the "viewport."

```py
import itertools
from dataclasses import dataclass
import numpy as np
from PIL import Image

BGCOLOR = (0, 0, 0)
OUTPUT_FILE = 'out.png'

@dataclass
class Camera:
    origin: np.ndarray
    direction: np.ndarray
    cw: int; ch: int
    vw: int; vh: int

    def __post_init__(self):
        x, y, z = self.direction

        from math import cos, sin
        self.direction = np.array([
            [cos(y)*cos(z), sin(x)*sin(y)*cos(z) - cos(x)*sin(z), cos(x)*sin(y)*cos(z) + sin(x)*sin(z)],
            [cos(y)*sin(z), sin(x)*sin(y)*sin(z) + cos(x)*cos(z), cos(x)*sin(y)*sin(z) - sin(x)*cos(z)],
            [      -sin(y),                        sin(x)*cos(y),                        cos(x)*cos(y)],
        ])

    def render(self, objects, lights):
        img = Image.new('RGB', (self.cw, self.ch))
        pixels = [[BGCOLOR]*self.cw for _ in range(self.ch)]
        for y in range(self.ch):
            for x in range(self.cw):
                pass # pixels[y][x] = something
        img.putdata(list(itertools.chain(*pixels)))
        img.save(OUTPUT_FILE)

Camera(
    np.array([0,0,0]),
    np.array([0,0,0]),
    256, 256, 1, 1
).render([], [])
```

Note that we represent the pixels as a 2 dimensional array of NumPy arrays with length 3 to represent RGB colors, but `img.putdata` requires a flat list of tuples so we flatten the list with `itertools.chain` then map the NumPy arrays into tuples. We get a map object which we convert to a list. `cw` and `ch` are integer variables that represent the "canvas" (i.e. the output image) dimensions and `vw` and `vh` represent the viewport width and height.

Let's add our first object—a humble sphere. For every sphere in the scene we want to test if this sphere is intersected by a ray and if it is, to determine the position of the intersection. You can skip the mathematical derivation if you want, but I suggest following along if you can to better understand how the code works.

A ray can be described as an origin offseted by a timestep multiplied by a direction. If a point $(x,y,z)$ is to be on a sphere centered on the origin, then $\sqrt{x^2+y^2+z^2} = r$ i.e. the distance between every point and the origin (the center of the sphere) must be equal to the radius. These facts can be expressed mathematically as,

\[
    r(t) = \mathbf{o} + t\mathbf{d} \\
    x^2 + y^2 + z^2 - r^2 = 0.
\]

For any sphere we want to solve for $t$, to get the intersection point. We can substitute the ray's coordinates into the sphere's then expand and simplify into

\[
    (\mathbf{o}_x + t\mathbf{d}_x)^2 + (\mathbf{o}_y + t\mathbf{d}_y)^2 + (\mathbf{o}_z + t\mathbf{d}_z)^2 - r^2 = 0 \\
    (\mathbf{d}\cdot\mathbf{d})t^2 + (2\mathbf{o}\cdot\mathbf{d})t + (\mathbf{o}\cdot\mathbf{o}) - r^2 = 0.
\]

This result looks suspiciously like a quadractic equation, which we can solve for using its eponymous formula!

\[
    t = \frac{-(2\mathbf{o}\cdot\mathbf{d}) \pm \sqrt{(2\mathbf{o}\cdot\mathbf{d})^2 - 4(\mathbf{d}\cdot\mathbf{d})(\mathbf{o}\cdot\mathbf{o}-r^2)}}{2\mathbf{d}\cdot\mathbf{d}}
\]

If the determinant (the math under the square root sign) is less than 0, it means there is no solution—no real one anyway—and our ray didn't intersect the sphere. In code, we can implement it like this.

```py
@dataclass
class Sphere:
    center: np.ndarray
    radius: float

    def intersect(self, origin, direction):
        origin = origin - self.center
        a = direction.dot(direction)
        b = 2 * direction.dot(origin)
        c = origin.dot(origin) - self.radius**2
        discriminant = b**2 - 4*a*c
        if discriminant < 0:
            return (math.inf, None)
        t = (-b - math.sqrt(discriminant)) / (2*a)
        intersection = origin + direction*t
        return (t, intersection - self.center)
```

Note that we're returning a tuple containing both the intersection and something else. That something else is the surface normal, a line perpendicular to the surface. We can calculate this line by simply stretching a line from the sphere's center to the point of intersection, which in practice is just subtracting two vectors.

To render any spheres, in the `Camera` class add a function `castray` that takes a list of objects and the origin and direction of a ray to cast. It will return a tuple containing the intersection point and the surface normal, or just infinity if the ray doesn't intersect anything.

```py
def castray(self, objects, origin, direction):
    closest = (math.inf, None)
    for obj in objects:
        t, normal = obj.intersect(origin, direction)
        if t >= 0 and t < closest[0]:
            closest = (t, normal)
    return closest
```

In our previous `render` function replace the comment with actual logic to intersect the objects.

```py
def render(self, objects, lights):
    img = Image.new('RGB', (self.cw, self.ch))
    pixels = [[BGCOLOR]*self.cw for _ in range(self.ch)]
    for y in range(self.ch):
        for x in range(self.cw):
            t, normal = self.castray(
                objects, self.origin,
                np.array([
                    (x - self.cw//2) * self.vw/self.cw,
                    (y - self.ch//2) * self.vh/self.ch,
                    1 / (2*math.tan(math.radians(FOV/2)) / self.vw)
                ]) @ self.direction
            )
            if t != math.inf:
                pixels[y][x] = (255, 255, 255)
    img.putdata(list(itertools.chain(*pixels)))
    img.save(OUTPUT_FILE)
```

Remember to set a global variable `FOV = 60`.  We pass in the objects and the origin of our camera, which is straightforward. The last argument is harder to understand. The problem is we want to convert a pixel to a position in our viewport. We do this by first "aligning" our pixel coordinates so that instead of the coordinate $(0,0)$ being located at the top-left of our screen, it's at the middle. We multiply this by the viewport dimensions divided by the canvas dimensions, which can be thought of as multiplying by viewport units per canvas units. We're translating from canvas units to viewport units, basically. Then we multiply this by our direction/rotation matrix; this is how we "rotate" the camera.

The bigger the Z coordinate the bigger the FOV. [Wikipedia](https://en.wikipedia.org/wiki/Field_of_view#Photography) shows a formula for calculating FOV that can be applied to our situation. The focal length is the distance from the origin to the viewport plane, while the sensor size is the width of the viewport plane–if we were to use the diagonal or the height it would be diagonal or vertical FOV instead of the horizontal FOV we're aiming to calculate. We can solve for the focal length; note that the FOV is in radians.

\[
    \text{FOV} = 2 \times \arctan \left(\frac{\text{sensor width}}{2 \times \text{focal length}}\right) \\
    \text{focal length} = \frac{1}{2\times\tan(\text{FOV} \div 2) \div \text{sensor width}}
\]

So if we want 

\[
    I = I_a + \sum_{j=0}^{n} k_d(\hat{L_j}\cdot\hat{N}) + k_s(\hat{\textbf{r}}\cdot\hat{\textbf{s}})^{\alpha}
\]
