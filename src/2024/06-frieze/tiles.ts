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
        this.ctx.moveTo(this.w * 0.1, this.h * 0.9)
        this.ctx.lineTo(this.w * 0.4, this.h * 0.1)
        this.ctx.lineTo(this.w * 0.9, this.h * 0.1)
        this.ctx.lineTo(this.w * 0.6, this.h * 0.9)
        this.ctx.closePath()
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
        this.ctx.beginPath()
        this.ctx.arc(this.w * 0.5, this.h * 0.5, r, 0, Math.PI * 0.5)
        this.stroke(2, `hsla(0, 100%, 60%, 1)`)
        this.ctx.beginPath()
        this.ctx.arc(this.w * 0.5, this.h * 0.5, r, Math.PI * 0.5, Math.PI)
        this.stroke(2, `hsla(120, 80%, 48%, 1)`)
        this.ctx.beginPath()
        this.ctx.arc(this.w * 0.5, this.h * 0.5, r, Math.PI, Math.PI * 1.5)
        this.stroke(2, `hsla(174, 100%, 60%, 1)`)
        this.ctx.beginPath()
        this.ctx.arc(this.w * 0.5, this.h * 0.5, r, Math.PI * 1.5, Math.PI * 2)
        this.stroke(2, `hsla(256, 70%, 50%, 1)`)
    }

    fermat(a: number = 15, cycles: number = 3) {
        fermatSpiral(this.ctx, a, cycles)
    }

    crookedLine() {
        this.ctx.beginPath()
        this.ctx.moveTo(this.w, this.h * 0.1)
        this.ctx.lineTo(0, this.h * 0.7)
        this.ctx.lineTo(this.w * 0.65, this.h * 0.8)
        this.ctx.moveTo(this.w * 0.5, this.h * 0.8)
    }

    leaf(cx1 = 0.2, cx2 = 0.5, cy1 = 0.2, cy2 = 0.8) {
        this.ctx.beginPath()
        this.ctx.moveTo(this.w, 0)
        this.ctx.quadraticCurveTo(this.w * cx1, this.h * cy1, 0, this.h)
        this.ctx.quadraticCurveTo(this.w * cx2, this.h * cy2, this.w, 0)
    }

    jagged(p1 = 0.8, p2 = 0.5) {
        this.ctx.beginPath()

        this.ctx.moveTo(0, this.h * p1 * 0.5)
        this.ctx.lineTo(this.w * p2, this.h * p1)
        this.ctx.lineTo(this.w * p1, this.h * (1 - p1))
        this.ctx.lineTo(this.w * p2, this.h * (1 - p1))
        this.ctx.lineTo(this.w * p1 * 0.5, this.h * p2)
    }

    tileToCorners(
        tile: Tile,
        { reflect = 'none' as 'h-down' | 'h-up' | 'v-left' | 'v-right' | 'none' } = {}
    ) {
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

// type TileSymmetryOpts = {
//     w: number
//     h: number
//     reflectHorizontal?: boolean
//     reflectVertical?: boolean
// }
// export const makeSymmetryTile = (
//     tile: HTMLCanvasElement,
//     { w, h, reflectHorizontal = false, reflectVertical = false }: TileSymmetryOpts
// ) => {
//     let { ctx, canvas } = createCanvas(w, h, true, false)
//     let tileWidth = tile.width
//     let tileHeight = tile.height

//     ctx.save()

//     ctx.drawImage(tile, 0, 0, tileWidth / 2, tileHeight / 2, 0, 0, w, h)
//     ctx.drawImage(tile, tileWidth / 2, 0, tileWidth / 2, tileHeight / 2, 0, 0, w, h)
//     if (reflectHorizontal) {
//         ctx.translate(0, h)
//         ctx.scale(1, -1)
//     }
//     ctx.drawImage(tile, tileWidth / 2, tileHeight / 2, tileWidth / 2, tileHeight / 2, 0, 0, w, h)
//     ctx.drawImage(tile, 0, tileHeight / 2, tileWidth / 2, tileHeight / 2, 0, 0, w, h)
//     ctx.restore()

//     return canvas
// }
