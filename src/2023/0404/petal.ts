import { random } from '~/helpers/utils'

interface MinMax {
    min: number
    max: number
}
interface PetalOpts {
    x: number
    y: number
    endX?: MinMax | number
    endY?: MinMax
    cpX?: MinMax
    cpAmpX?: number
    cpAmpY?: number
    rotation?: number
    cp1Mult?: { x: number; y: number }
    cp2Mult?: { x: number; y: number }
    lineSpace?: number
    throttleFps?: boolean
}

export class Petal {
    x: number
    y: number
    start: { x: number; y: number } = { x: 0, y: 0 }
    end: { x: number; y: number }
    cp1: { x: number; y: number }
    cp2: { x: number; y: number }
    cpAmpX: number
    cpAmpY: number
    rotation: number
    tAdd: number
    cp1Mult: { x: number; y: number }
    cp2Mult: { x: number; y: number }
    lineSpace: number
    #count = 0
    #fps = 60
    #timeStep = 1000 / this.#fps
    #lastTime = 0
    throttleFps: boolean

    constructor({
        x,
        y,
        endX = { min: -100, max: 100 },
        endY = { min: 300, max: 500 },
        cpX = { min: 50, max: 100 },
        cpAmpX = 50,
        cpAmpY = 100,
        rotation = 0,
        cp1Mult = { x: 1.5, y: 0.8 },
        cp2Mult = { x: 2.5, y: 1 },
        lineSpace = 1,
        throttleFps = true,
    }: PetalOpts) {
        this.throttleFps = throttleFps
        this.lineSpace = lineSpace
        this.x = x
        this.y = y
        this.cpAmpX = cpAmpX
        this.cpAmpY = cpAmpY
        this.rotation = rotation
        this.tAdd = random(0, Math.PI)
        this.end = {
            x: typeof endX === 'number' ? random(-endX, endX) : random(endX.min, endX.max),
            y: random(-endY.min, -endY.max),
        }

        let cpxl = random(-cpX.min, -cpX.max)
        let cpyb = random(this.end.y * 0.1, this.end.y * 0.4)
        let cpyt = random(this.end.y * 0.6, this.end.y * 0.9)
        let cpxr = random(cpX.min, cpX.max)

        this.cp1Mult = cp1Mult
        this.cp2Mult = cp2Mult

        if (Math.random() < 0.5) {
            this.cp1 = { x: cpxl, y: cpyb }
            this.cp2 = { x: cpxr, y: cpyt }
        } else {
            this.cp1 = { x: cpxr, y: cpyb }
            this.cp2 = { x: cpxl, y: cpyt }
        }
    }

    draw = (t: number, ctx: CanvasRenderingContext2D) => {
        if (!this.throttleFps) {
            this.#draw(ctx)
            return
        }
        const delta = t - this.#lastTime
        if (delta < this.#timeStep) return

        this.#lastTime = t - (delta % this.#timeStep)
        this.#draw(ctx)
    }

    #draw = (ctx: CanvasRenderingContext2D) => {
        let t = (this.#count / 100) * this.lineSpace

        let cp1 = {
            x: this.cp1.x + this.cpAmpX * Math.sin(t * this.cp1Mult.x + Math.PI),
            y: this.cp1.y + Math.sin(t * this.cp1Mult.y) * this.cpAmpY,
        }
        let cp2 = {
            x: this.cp2.x + this.cpAmpX * Math.sin(t * this.cp2Mult.x),
            y: this.cp2.y + Math.sin(t * this.cp2Mult.y) * this.cpAmpY,
        }

        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)

        ctx.beginPath()
        ctx.moveTo(this.start.x, this.start.y)
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, this.end.x, this.end.y)
        ctx.stroke()

        ctx.restore()
        this.#count++
    }
}
