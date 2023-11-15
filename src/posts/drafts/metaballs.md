Metaballs | 3 | 2023-11-30 | js,html,interactive

<div class="flex items-center justify-center">
    <canvas id="canvas" width="320" height="320"></canvas>
</div>
<div class="flex items-center justify-center pt-4">
    <input type="color" class="mx-4" value="#ff0000" id="color-picker">
    <input type="checkbox" class="mx-4 w-8" id="mode">
    <input type="range" class="mx-4" min="5" max="200" id="speed">
</div>

<script>
    const WIDTH = 64;
    const HEIGHT = 64;
    const SIZE = 5;

    class Circle {
        constructor(x, y, r) {
            this.x = x; this.y = y;
            this.vx = Math.random() * 2 - 1;
            this.vy = Math.random() * 2 - 1;
            this.r = r;
        }

        update(dt) {
            dt /= 30;
            this.x += this.vx * dt * (speed.value / 100);
            this.y += this.vy * dt * (speed.value / 100);
            if (this.y - this.r < 0
             || this.y + this.r > HEIGHT) {

                this.vy = -this.vy;
                this.y += this.vy*2;
            }
            if (this.x - this.r < 0
             || this.x + this.r > WIDTH) {

                this.vx = -this.vx;
                this.x += this.vx*2;
            }
        }

        move(x, y) {
            this.x = x;
            this.y = y;
            this.x = Math.min(Math.max(this.x, 0), WIDTH);
            this.y = Math.min(Math.max(this.y, 0), HEIGHT);
        }

        value(x, y) {
            return this.r**2 / ((x - this.x)**2 + (y - this.y)**2);
        }
    }

    let circles = [];
    for (let i = 0; i < 5; ++i) {
        circles.push(new Circle(
            SIZE*1.5 + Math.random() * ( WIDTH - SIZE*3),
            SIZE*1.5 + Math.random() * (HEIGHT - SIZE*3),
            SIZE/2 + Math.random() * SIZE
        ));
    }

    let running = true;
    let selected = [];
    const canvas = document.getElementById('canvas')
    const colorPicker = document.getElementById('color-picker');
    const mode = document.getElementById('mode');
    const speed = document.getElementById('speed');
    const ctx = canvas.getContext('2d');

    // refresh screen when new settings are chosen.
    colorPicker.addEventListener('input', () => draw());
    mode.addEventListener('input', () => draw());

    function collide(e) {
        let objs = [];
        for (const c of circles) {
            if (Math.hypot(
                e.offsetX/SIZE - c.x,
                e.offsetY/SIZE - c.y
            ) < c.r * 1.2) {

                objs.push(c);
            }
        }
        return objs;
    }

    canvas.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('mousedown', e => {
        switch (e.button) {
        case 0: // left click
            // if they haven't selected any circles, aka they've clicked the background,
            // then we should pause everything.
            if (!(selected = collide(e)).length) {
                running = !running;
                if (running) {
                    lastTime = undefined;
                    window.requestAnimationFrame(mainloop);
                }
            }
            break;
        case 2: // right click
            let objs;
            if (!(objs = collide(e)).length) {
                circles.push(new Circle(
                    e.offsetX / SIZE,
                    e.offsetY / SIZE, 
                    SIZE/2 + Math.random() * SIZE
                ));
                draw();
            } else {
                circles = circles.filter(x => objs.every(o => x !== o));
                draw();
            }
            break;
        }
    });
    canvas.addEventListener('mouseup', e => { selected = []; });

    canvas.addEventListener('mousemove', e => {
        if (selected) {
            for (let s of selected) {
                s.move(e.offsetX / SIZE, e.offsetY / SIZE);
            }
            draw();
        }
    });

    function draw() {
        for (let y = 0; y < HEIGHT; ++y) {
            for (let x = 0; x < WIDTH; ++x) {
                if (mode.checked) {
                } else {
                    ctx.fillStyle = circles.reduce((n, c) =>
                        n + c.value(x, y), 0) > 1 ? colorPicker.value : 'black';
                }
                ctx.fillRect(x*SIZE, y*SIZE, SIZE, SIZE);
            }
        }
    }

    let lastTime;
    function mainloop(now) {
        if (!running) { return; }

        for (const c of circles) {
            c.update(lastTime ? now - lastTime : 0);
        }
        draw();
        lastTime = now;
        window.requestAnimationFrame(mainloop);
    }
    window.requestAnimationFrame(mainloop);
</script>
