import createCanvas from '~/helpers/canvas/createCanvas'

function fermatPoint(a: number = 20, angle: number) {
    let radius = a * Math.pow(angle, 0.5)
    let x = Math.cos(angle) * radius
    let y = Math.sin(angle) * radius
    return { x, y }
}

function fermatSpiral(ctx: CanvasRenderingContext2D, a: number = 20, cycles: number = 10) {
    let res = 0.01
    let t = 0
    ctx.beginPath()
    for (t = Math.PI; t < cycles * Math.PI * 2; t += res) {
        let radius = a * Math.pow(t, 0.5)
        let x = Math.cos(t) * radius
        let y = Math.sin(t) * radius
        ctx.lineTo(x, y)
    }
    ctx.stroke()
}

export type ReflectOption = 'h-down' | 'h-up' | 'v-left' | 'v-right' | 'none'

export const drawings = {
    jagged: (ctx: CanvasRenderingContext2D, w: number, h: number, p1 = 0.8, p2 = 0.5) => {
        ctx.beginPath()
        ctx.moveTo(0, h * p1 * 0.5)
        ctx.lineTo(w * p2, h * p1)
        ctx.lineTo(w * p1, h * (1 - p1))
        ctx.lineTo(w * p2, h * (1 - p1))
        ctx.lineTo(w * p1 * 0.5, h * p2)
    },
    leaf: (
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        cx1 = 0.2,
        cx2 = 0.5,
        cy1 = 0.2,
        cy2 = 0.8
    ) => {
        ctx.beginPath()
        ctx.moveTo(w, 0)
        ctx.quadraticCurveTo(w * cx1, h * cy1, 0, h)
        ctx.quadraticCurveTo(w * cx2, h * cy2, w, 0)
    },
    crookedLine: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        ctx.beginPath()
        ctx.moveTo(w, h * 0.1)
        ctx.lineTo(0, h * 0.7)
        ctx.lineTo(w * 0.65, h * 0.8)
        ctx.moveTo(w * 0.5, h * 0.8)
    },
    plgram(ctx: CanvasRenderingContext2D, w: number, h: number) {
        ctx.beginPath()
        ctx.moveTo(w * 0.1, h * 0.9)
        ctx.lineTo(w * 0.4, h * 0.1)
        ctx.lineTo(w * 0.9, h * 0.1)
        ctx.lineTo(w * 0.6, h * 0.9)
        ctx.closePath()
    },
}

export class Tile {
    w: number
    h: number
    pr: number
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    currentScale = 1

    constructor(w: number, h: number, pr: number) {
        this.w = w
        this.h = h
        this.pr = pr
        let { ctx, canvas } = createCanvas(w, h, pr, false)
        this.canvas = canvas
        this.ctx = ctx
    }

    clear() {
        this.ctx.clearRect(0, 0, this.w, this.h)
    }

    imageFill(img: HTMLImageElement | HTMLCanvasElement) {
        this.ctx.drawImage(img, 0, 0, this.w, this.h)
    }

    stroke(width = 2, color = '#000') {
        this.ctx.strokeStyle = color
        this.ctx.lineWidth = width / this.currentScale
        this.ctx.stroke()
    }

    scale(scale: number) {
        this.currentScale *= scale
        this.ctx.scale(scale, scale)
    }

    center() {
        this.ctx.translate(this.w * 0.5, this.h * 0.5)
    }

    translate(x: number, y: number) {
        this.ctx.translate(this.w * x, this.h * y)
    }

    flipHorizontal() {
        this.ctx.translate(this.w, 0)
        this.ctx.scale(-1, 1)
    }

    flipVertical() {
        this.ctx.translate(0, this.h)
        this.ctx.scale(1, -1)
    }

    plgram() {
        drawings.plgram(this.ctx, this.w, this.h)
    }

    triangle(t: number = 0.4) {
        this.ctx.moveTo(1, this.h)
        this.ctx.lineTo(this.w, this.h)
        this.ctx.lineTo(this.w, this.h * t)
        this.ctx.closePath()
    }

    circle(radius: number = 0.3) {
        this.ctx.beginPath()
        this.ctx.arc(this.w * 0.5, this.h * 0.5, Math.min(this.w, this.h) * radius, 0, Math.PI * 2)
    }

    circles(count = 5, r1 = 0.2, r2 = 0.4) {
        this.ctx.beginPath()
        for (let i = 0; i < 5; i++) {
            let radius = r1 + ((r2 - r1) * i) / count
            radius *= Math.min(this.w, this.h)
            this.ctx.arc(this.w * 0.5, this.h * 0.5, radius, 0, Math.PI * 2)
        }
    }

    debugCirc(radius = 0.2) {
        let r = Math.min(this.w, this.h) * radius
        let r2 = r * 1.4
        this.ctx.beginPath()
        this.ctx.arc(this.w * 0.5, this.h * 0.5, r2, 0, Math.PI * 0.5)
        this.stroke(r, `hsla(0, 100%, 60%, 0.5)`)
        this.ctx.beginPath()
        this.ctx.arc(this.w * 0.5, this.h * 0.5, r, Math.PI * 0.5, Math.PI)
        this.stroke(2, `hsla(120, 80%, 48%, 1)`)
        this.ctx.beginPath()
        this.ctx.arc(this.w * 0.5, this.h * 0.5, r2, Math.PI, Math.PI * 1.5)
        this.stroke(r, `hsla(174, 100%, 60%, 0.5)`)
        this.ctx.beginPath()
        this.ctx.arc(this.w * 0.5, this.h * 0.5, r, Math.PI * 1.5, Math.PI * 2)
        this.stroke(2, `hsla(256, 70%, 50%, 1)`)
        this.ctx.beginPath()
        this.ctx.arc(this.w, this.h * 0.5, r, 0, Math.PI * 2)
        this.stroke(2, `hsla(27, 100%, 50%, 1)`)
    }

    fermat(a: number = 15, cycles: number = 3) {
        fermatSpiral(this.ctx, a, cycles)
    }

    crookedLine() {
        drawings.crookedLine(this.ctx, this.w, this.h)
    }

    leaf(cx1 = 0.2, cx2 = 0.5, cy1 = 0.2, cy2 = 0.8) {
        drawings.leaf(this.ctx, this.w, this.h, cx1, cx2, cy1, cy2)
    }

    jagged(p1 = 0.8, p2 = 0.5) {
        drawings.jagged(this.ctx, this.w, this.h, p1, p2)
    }

    // takes another tile and splits it into four corners, then draws them all on top of each other
    tileToCorners(tile: Tile, { reflect = 'none' }: { reflect?: ReflectOption } = {}) {
        let { w, h } = this
        let sw = tile.canvas.width / 2
        let sh = tile.canvas.height / 2

        const topLeft = () => this.ctx.drawImage(tile.canvas, 0, 0, sw, sh, 0, 0, w, h)
        const topRight = () => this.ctx.drawImage(tile.canvas, sw, 0, sw, sh, 0, 0, w, h)
        const bottomRight = () => this.ctx.drawImage(tile.canvas, sw, sh, sw, sh, 0, 0, w, h)
        const bottomLeft = () => this.ctx.drawImage(tile.canvas, 0, sh, sw, sh, 0, 0, w, h)

        if (reflect === 'h-down') {
            this.ctx.save()
            topLeft()
            topRight()
            this.ctx.translate(0, h)
            this.ctx.scale(1, -1)
            bottomLeft()
            bottomRight()
            this.ctx.restore()
        } else if (reflect === 'h-up') {
            this.ctx.save()
            bottomLeft()
            bottomRight()
            this.ctx.translate(0, h)
            this.ctx.scale(1, -1)
            topLeft()
            topRight()
            this.ctx.restore()
        } else if (reflect === 'v-left') {
            this.ctx.save()
            topRight()
            bottomRight()
            this.ctx.translate(w, 0)
            this.ctx.scale(-1, 1)
            topLeft()
            bottomLeft()
            this.ctx.restore()
        } else if (reflect === 'v-right') {
            this.ctx.save()
            topLeft()
            bottomLeft()
            this.ctx.translate(w, 0)
            this.ctx.scale(-1, 1)
            topRight()
            bottomRight()
            this.ctx.restore()
        } else {
            topLeft()
            topRight()
            bottomRight()
            bottomLeft()
        }

        this.ctx.restore()
    }
}

// I've noticed that some of the coolest frieze patterns are made by having sort of a larger shape that is visible extending across several tiles,
// but is repeated on all tiles in such a way to make the actual tile smaller than the full image ... if that makes sense
// so I am playing with taking a tile, then chopping it up into pieces, and then drawing all those pieces on top of each other
// also interesting to reflect the pieces in various ways

type ReflectOptionCorners = {
    tl?: 'x' | 'y' | 'xy'
    tr?: 'x' | 'y' | 'xy'
    br?: 'x' | 'y' | 'xy'
    bl?: 'x' | 'y' | 'xy'
}
export const overlapDrawing = {
    fourCornersCb: (
        ctx: CanvasRenderingContext2D,
        {
            w,
            h,
            scale = true,
            reflect = {},
        }: { w: number; h: number; scale?: boolean; reflect?: ReflectOptionCorners },
        cb: () => void
    ) => {
        ctx.save()
        if (scale) {
            ctx.scale(2, 2)
        }

        // top left
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, w / 2, h / 2)
        ctx.clip()
        if (reflect.tl === 'x' || reflect.tl === 'xy') {
            ctx.translate(w / 2, 0)
            ctx.scale(-1, 1)
        }
        if (reflect.tl === 'y' || reflect.tl === 'xy') {
            ctx.translate(0, h / 2)
            ctx.scale(1, -1)
        }
        cb()
        ctx.restore()

        // bottom left
        ctx.save()
        ctx.translate(0, -h / 2)
        ctx.beginPath()
        ctx.rect(0, h / 2, w / 2, h / 2)
        ctx.clip()
        if (reflect.bl === 'x' || reflect.bl === 'xy') {
            ctx.translate(w / 2, 0)
            ctx.scale(-1, 1)
        }
        if (reflect.bl === 'y' || reflect.bl === 'xy') {
            ctx.translate(0, h * 1.5)
            ctx.scale(1, -1)
        }
        cb()
        ctx.restore()

        // top right
        ctx.save()
        ctx.translate(-w / 2, 0)
        ctx.beginPath()
        ctx.rect(w / 2, 0, w / 2, h / 2)
        ctx.clip()
        if (reflect.tr === 'x' || reflect.tr === 'xy') {
            ctx.translate(w * 1.5, 0)
            ctx.scale(-1, 1)
        }
        if (reflect.tr === 'y' || reflect.tr === 'xy') {
            ctx.translate(0, h / 2)
            ctx.scale(1, -1)
        }
        cb()
        ctx.restore()

        // bottom right
        ctx.save()
        ctx.translate(-w / 2, -h / 2)
        ctx.beginPath()
        ctx.rect(w / 2, h / 2, w / 2, h / 2)
        ctx.clip()
        if (reflect.br === 'x' || reflect.br === 'xy') {
            ctx.translate(w * 1.5, 0)
            ctx.scale(-1, 1)
        }
        if (reflect.br === 'y' || reflect.br === 'xy') {
            ctx.translate(0, h * 1.5)
            ctx.scale(1, -1)
        }
        cb()
        ctx.restore()

        ctx.restore()
    },
    fourCorners: (canvas: HTMLCanvasElement) => {
        let sw = canvas.width / 2
        let sh = canvas.height / 2

        let newCanvas = document.createElement('canvas')
        newCanvas.width = sw
        newCanvas.height = sh
        let newCtx = newCanvas.getContext('2d')!
        // newCtx.scale(1 / scale, 1 / scale)

        newCtx.drawImage(canvas, 0, 0, sw, sh, 0, 0, sw, sh) // top left
        newCtx.drawImage(canvas, sw, 0, sw, sh, 0, 0, sw, sh) // top right
        newCtx.drawImage(canvas, sw, sh, sw, sh, 0, 0, sw, sh) // bottom right
        newCtx.drawImage(canvas, 0, sw, sh, sw, 0, 0, sw, sh) // bottom left

        return newCanvas
    },
    horizontal: (canvas: HTMLCanvasElement) => {
        let sw = canvas.width / 2
        let sh = canvas.height

        let newCanvas = document.createElement('canvas')
        newCanvas.width = sw
        newCanvas.height = sh
        let newCtx = newCanvas.getContext('2d')!

        newCtx.drawImage(canvas, 0, 0, sw, sh, 0, 0, sw, sh) // left
        newCtx.drawImage(canvas, sw, 0, sw, sh, 0, 0, sw, sh) // right

        return newCanvas
    },

    horizontalCb: (
        ctx: CanvasRenderingContext2D,
        {
            w,
            h,
            scale = false,
            divide = 2,
        }: { w: number; h: number; scale?: boolean; divide?: number },
        cb: () => void
    ) => {
        ctx.save()
        if (scale) {
            ctx.scale(divide, divide)
        }

        let innerw = w / divide
        for (let i = 0; i < divide; i++) {
            ctx.save()
            ctx.translate(i * -innerw, 0)
            ctx.rect(innerw * i, 0, innerw, h)
            ctx.clip()
            cb()
            ctx.restore()
        }

        // ctx.save()
        // ctx.translate(-w / 2, 0)
        // ctx.rect(w / 2, 0, w / 2, h)
        // ctx.clip()
        // cb()
        // ctx.restore()

        ctx.restore()
    },
    verticalCb: (
        ctx: CanvasRenderingContext2D,
        { w, h, scale = true }: { w: number; h: number; scale?: boolean },
        cb: () => void
    ) => {
        ctx.save()
        if (scale) {
            ctx.scale(2, 2)
        }

        ctx.save()
        ctx.rect(0, 0, w, h / 2)
        ctx.clip()
        cb()
        ctx.restore()

        ctx.save()
        ctx.translate(0, -h / 2)
        ctx.rect(0, h / 2, w, h / 2)
        ctx.clip()
        cb()
        ctx.restore()

        ctx.restore()
    },
}
