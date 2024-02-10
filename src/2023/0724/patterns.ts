const corners = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
]

export class Rect {
    static fillCenter(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        ctx.fillRect(x - w / 2, y - h / 2, w, h)
    }

    static strokeCenter(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        ctx.strokeRect(x - w / 2, y - h / 2, w, h)
    }
}

export class Quilt {
    static rectCorners(
        ctx: CanvasRenderingContext2D,
        step: number,
        size = 0.06,
        center = 0.25,
        fill = true
    ) {
        corners.forEach(([x, y]) => {
            ctx.save()
            ctx.translate(step * center * x, step * center * y)
            fill
                ? Rect.fillCenter(ctx, 0, 0, step * size, step * size)
                : Rect.strokeCenter(ctx, 0, 0, step * size, step * size)
            ctx.restore()
        })
    }

    static linesCorners(
        ctx: CanvasRenderingContext2D,
        step: number,
        start = 0.1,
        end = 0.25
    ) {
        corners.forEach(([x, y]) => {
            ctx.beginPath()
            ctx.moveTo(step * start * x, step * start * y)
            ctx.lineTo(step * end * x, step * end * y)
            ctx.stroke()
        })
    }
}

export class QuiltPattern {
    m: number
    step: number

    constructor(
        public width: number,
        public height: number,
        public palette: string[],
        public count: number = 4
    ) {
        this.m = Math.min(width, height) * 0.7
        this.step = this.m / this.count
    }

    setup(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = '#171717'
        ctx.fillRect(0, 0, this.width, this.height)

        ctx.translate(this.width / 2, this.height / 2)
        ctx.rotate(Math.PI * 0.25)
        ctx.translate(-this.m / 2, -this.m / 2)
    }

    draw(ctx: CanvasRenderingContext2D, cb: (step: number) => void) {
        let paletteIndex = 0
        let paletteLen = this.palette.length

        for (let x = 0; x < this.m; x += this.step) {
            for (let y = 0; y < this.m; y += this.step) {
                let color = this.palette[paletteIndex++ % paletteLen]
                ctx.save()
                ctx.translate(x + this.step / 2, y + this.step / 2)
                ctx.fillStyle = color
                ctx.strokeStyle = color
                cb(this.step)
                ctx.restore()
            }
        }
    }
}
