import createCanvas from '~/helpers/canvas/createCanvas'
import { Sizes } from '~/helpers/sizes'
import '~/style.css'
import { f1 } from '../friezes'
import GUI from 'lil-gui'
import { drawings, overlapDrawing } from '../tiles'
import { random, shuffle } from '~/helpers/utils'

// let palette = ['#f9c80e', '#f86624', '#ea3546', '#662e9b', '#43bccd']
// let palette = ['#bba0ca', '#fff8e8', '#fcd581', '#d52941', '#990d35']
let palettes = [
    {
        bg: '#def6ca',
        // fg: ['#a22c29', '#ddbdd5', '#390040', '#417b5a', '#dc9596'],
        fg: ['#417b5a', '#390040', '#ddbdd5', '#a22c29'],
    },

    {
        bg: '#ddbdd5',
        fg: ['#a22c29', '#390040', '#417b5a'],
        // fg: ['#def6ca', '#a22c29', '#ddbdd5', '#390040', '#417b5a'],
    },
    {
        bg: '#390040',
        fg: ['#ddbdd5', '#417b5a', '#def6ca'],
    },
]

const params = {
    rowHeight: 90,
}

const sizes = new Sizes()
let { ctx } = createCanvas(sizes.width, sizes.height)

abstract class F1Drawing {
    tileWidth: number = 120
    tileHeight: number = 90
    translateOverlap: number = 1
    sizes: Sizes
    palette: string[]
    abstract tile(ctx: CanvasRenderingContext2D): void

    constructor(sizes: Sizes, palette: string[] = ['#000', '#fff']) {
        this.sizes = sizes
        this.palette = palette
    }

    draw(ctx: CanvasRenderingContext2D) {
        f1(
            ctx,
            {
                translate: this.tileWidth * (1 / this.translateOverlap),
                width: this.sizes.width,
            },
            () => this.tile(ctx)
        )
    }

    writeInfo = (ctx: CanvasRenderingContext2D) => {
        let keys = Object.keys(this) as (keyof typeof this)[]

        let str = ''
        ctx.save()
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.fillRect(0, 0, 150, this.tileHeight)
        ctx.fillStyle = '#000'
        let lines: string[] = []

        keys.forEach((key) => {
            if (key === 'palette' || key === 'sizes' || key === 'tileWidth' || key === 'tileHeight')
                return
            let val = this[key]
            if (typeof val === 'number') {
                lines.push(`${String(key)}: ${val.toFixed(2)}\n`)
            }
        })

        lines.forEach((line, i) => {
            ctx.fillText(line, 10, 20 + 12 * i)
        })

        ctx.restore()
    }
}

class F1Drawing1 extends F1Drawing {
    reflect: boolean
    constructor(...args: ConstructorParameters<typeof F1Drawing>) {
        super(...args)

        this.translateOverlap = 2
        this.reflect = random() > 0.5
    }

    tile = (ctx: CanvasRenderingContext2D) => {
        let { tileWidth: w, tileHeight: h } = this
        ctx.save()

        ctx.beginPath()
        ctx.rect(0, 0, w, h)
        ctx.clip()

        if (this.reflect) {
            ctx.translate(w, 0)
            ctx.scale(-1, 1)
        }

        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        ctx.strokeStyle = this.palette[0]
        ctx.lineWidth = w * 0.2
        ctx.beginPath()
        ctx.moveTo(w * 0.15, 0)
        ctx.lineTo(w * 0.15, h)
        ctx.stroke()

        ctx.strokeStyle = this.palette[1]
        let lw = 3
        ctx.lineWidth = lw
        ctx.beginPath()
        ctx.moveTo(w * 0.9, h * 0.6)
        ctx.lineTo(w * 0.1, h * 0.1)
        ctx.lineTo(w * 0.1, h * 0.9)
        ctx.lineTo(w * 0.4, h * 0.6)
        ctx.stroke()

        ctx.restore()
    }
}

class F1Drawing2 extends F1Drawing {
    leafWid: number
    leafHt: number
    cx: number
    cy: number
    reflect: boolean

    constructor(...args: ConstructorParameters<typeof F1Drawing>) {
        super(...args)

        this.translateOverlap = random(1, 1.5)
        this.leafWid = 0.9
        this.leafHt = 0.7
        this.cx = random(-0.2, 0.3)
        this.cy = random(-0.5, 0.5)
        this.reflect = random() > 0.5
    }

    tile = (ctx: CanvasRenderingContext2D) => {
        let { tileWidth: w, tileHeight: h } = this
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, w, h)
        ctx.clip()

        if (this.reflect) {
            ctx.translate(w, 0)
            ctx.scale(-1, 1)
        }

        let lw = 2
        ctx.lineWidth = lw
        ctx.strokeStyle = this.palette[0]

        ctx.save()
        ctx.translate((w - w * this.leafWid) / 2, (h - h * this.leafHt) / 2)

        let w2 = this.leafWid * w
        let h2 = this.leafHt * h
        ctx.beginPath()
        ctx.moveTo(0, h2)
        ctx.quadraticCurveTo(w2 * this.cx, h2 * this.cy, w2, 0)
        ctx.quadraticCurveTo(w2 * (1 - this.cx), h2 * (1 - this.cy), 0, h2)
        ctx.stroke()

        ctx.fillStyle = this.palette[0]
        ctx.beginPath()
        ctx.moveTo(w2 * 0.1, h2 * 0.9)
        ctx.quadraticCurveTo(w2 * (this.cx + 0.1), h2 * (this.cy + 0.1), w2 * 0.9, h2 * 0.1)
        ctx.quadraticCurveTo(w2 * (1 - this.cx - 0.1), h2 * (1 - this.cy - 0.1), w2 * 0.1, h2 * 0.9)
        ctx.lineWidth = 5
        ctx.fill()
        ctx.restore()

        ctx.restore()
    }
}

class F1Drawing3 extends F1Drawing {
    triDiff: number
    slope: number
    x1: number
    y1: number
    x2: number

    constructor(...args: ConstructorParameters<typeof F1Drawing>) {
        super(...args)

        this.translateOverlap = random(1, 4)

        // this.triDiff = random(0.05, 0.3)
        this.triDiff = 0.1
        this.x1 = 0.1
        this.y1 = 0.9
        this.x2 = random(0.7, 0.95)
        // this.slope = random([-3, -2, 1])
        this.slope = random([-3, -4, 3, 9, 10, 8, 7])
    }

    tile = (ctx: CanvasRenderingContext2D) => {
        let { tileWidth: w, tileHeight: h } = this
        ctx.save()

        let diff = this.triDiff
        ctx.lineWidth = 2
        ctx.strokeStyle = this.palette[0]
        ctx.fillStyle = this.palette[1]

        for (let i = 0; i < 2; i++) {
            let p1x = this.x1 + diff * 2 * (1 - i)
            let p1y = this.y1 - diff * (1 - i)
            let p2y = this.x1 + diff * (1 - i)
            let yInt = -this.slope * p1x + p1y
            let p2x = (p2y - yInt) / this.slope

            ctx.beginPath()
            ctx.moveTo(w * p1x, h * p1y)
            ctx.lineTo(w * p2x, h * p2y)
            ctx.lineTo(w * this.x2, h * p2y)
            ctx.closePath()
            if (i === 0) {
                ctx.fill()
            } else {
                ctx.stroke()
            }
        }

        ctx.restore()
    }
}

class F1Drawing4 extends F1Drawing {
    reflect: boolean
    thickLineSwap: boolean
    thickLineBend: number

    constructor(...args: ConstructorParameters<typeof F1Drawing>) {
        super(...args)

        // this.translateOverlap = random([1, 1.5, 2])
        this.translateOverlap = 2
        this.reflect = false
        this.thickLineSwap = random() > 0.5
        this.thickLineBend = random(0.3, 0.48)
    }

    tile = (ctx: CanvasRenderingContext2D) => {
        let { tileWidth: w, tileHeight: h } = this
        ctx.save()

        ctx.beginPath()
        ctx.rect(0, 0, w, h)
        // ctx.clip()

        if (this.reflect) {
            ctx.translate(w, 0)
            ctx.scale(-1, 1)
        }

        ctx.lineCap = 'square'
        ctx.lineJoin = 'miter'
        ctx.strokeStyle = this.palette[0]
        ctx.lineWidth = w * 0.1
        ctx.beginPath()
        if (this.thickLineSwap) {
            ctx.moveTo(w * 0.4, h * -0.2)
            ctx.lineTo(w * (0.5 - this.thickLineBend), h * 0.4)
            ctx.lineTo(w * 0.5, h * 1.2)
        } else {
            ctx.moveTo(w * 0.2, h * -0.2)
            ctx.lineTo(w * this.thickLineBend, h * 0.4)
            ctx.lineTo(w * 0.1, h * 1.2)
        }
        ctx.stroke()

        ctx.strokeStyle = this.palette[1]
        let lw = 3
        ctx.lineWidth = lw

        ctx.beginPath()
        ctx.moveTo(w * 0.1, h * 0.7)
        ctx.lineTo(w * 0.4, h * 0.1)
        ctx.lineTo(w * 0.9, h * 0.4)
        ctx.lineTo(w * 0.9, h * 0.9)
        ctx.closePath()
        ctx.stroke()

        ctx.restore()
    }
}

const getDrawing = (sizes: Sizes, palette: string[]) => {
    let randomVal = random([1, 2, 3, 4]) as 1 | 2 | 3 | 4
    if (randomVal === 1) {
        return new F1Drawing1(sizes, palette)
    } else if (randomVal === 2) {
        return new F1Drawing2(sizes, palette)
    } else if (randomVal === 3) {
        return new F1Drawing3(sizes, palette)
    } else {
        return new F1Drawing4(sizes, palette)
    }
}

const draw = () => {
    // ctx.fillStyle = '#fff'
    // ctx.fillRect(0, 0, sizes.width, sizes.height)

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    let spacingMin = 20

    let count = Math.floor(sizes.height / (params.rowHeight + spacingMin))

    let spacing = (sizes.height - count * params.rowHeight) / count
    for (let i = 0; i < count; i++) {
        let palette = random(palettes)

        let fg = shuffle([...palette.fg])
        let drawing = getDrawing(sizes, fg)

        ctx.save()
        ctx.translate(0, params.rowHeight * i + spacing * i + spacing * 0.5)
        ctx.fillStyle = palette.bg
        ctx.beginPath()
        ctx.rect(0, 0, sizes.width, drawing.tileHeight)
        ctx.clip()
        ctx.fill()

        drawing.draw(ctx)

        ctx.restore()
    }
}

// ctx.drawImage(drawing, 200, 400, params.tileWidth, params.tileHeight)
// ctx.lineWidth = 15
// ctx.strokeStyle = '#ababab'
// ctx.strokeRect(200, 400, 300, 300)
draw()
