import { type ColorRGB } from '~/helpers/color-utils'
import { type NextCb } from './utils'
import { PixelBlur, PixelSmudge } from './pixels'

export type PixelWalkerOpts = {
    x: number
    y: number
    width: number
    height: number
    pixelDensity?: number
    nextCb?: NextCb
}

export abstract class PixelWalker {
    x: number
    y: number
    width: number
    height: number
    _next: NextCb
    currentColor: ColorRGB = { r: 255, g: 255, b: 255 }
    pixelDensity: number
    done = false
    promise: Promise<void>
    resolve: () => void

    constructor(opts: PixelWalkerOpts) {
        this.x = opts.x
        this.y = opts.y
        this.width = opts.width
        this.height = opts.height
        this.pixelDensity = opts.pixelDensity ?? 1
        this._next = opts.nextCb ?? ((x, y) => [x, y + 1])

        let savedResolve: () => void
        this.promise = new Promise<void>((resolve) => (savedResolve = resolve))
        this.resolve = savedResolve!
    }

    abstract updateColor(imageData: ImageData, x: number, y: number): ColorRGB

    next = () => {
        let [x, y] = this._next(this.x, this.y)
        if (x >= this.width || y >= this.height || x < 0 || y < 0) {
            this.done = true
            this.resolve()
            return
        }
        this.x = x
        this.y = y
    }

    isOutOfBounds = (x: number, y: number) => x >= this.width || y >= this.height || x < 0 || y < 0

    step = (imageData: ImageData) => {
        if (this.done) return
        let ix = this.x
        let iy = this.y
        let i = (ix + iy * imageData.width) * 4
        this.currentColor = this.updateColor(imageData, ix, iy)

        imageData.data[i] = this.currentColor.r
        imageData.data[i + 1] = this.currentColor.g
        imageData.data[i + 2] = this.currentColor.b
        imageData.data[i + 3] = 255
        this.next()
    }
}

export type PixelsOpts = {
    direction?: 'up' | 'down' | 'left' | 'right'
    width: number
    height: number
    pixelDensity?: number
    stepRate?: number
}

export abstract class Pixels<T extends 'blur' | 'smudge'> {
    direction: 'up' | 'down' | 'left' | 'right'
    width: number
    height: number
    pixelDensity: number
    offscreenCanvas: HTMLCanvasElement
    offscreenCtx: CanvasRenderingContext2D
    promises: Promise<void>[] = []
    done = false
    stepRate: number
    type: T
    lastDelta = 0
    pixels: (T extends 'blur' ? PixelBlur : PixelSmudge)[] = []

    constructor({
        direction = 'right',
        width,
        height,
        stepRate = 200,
        pixelDensity = 1,
        type = 'blur' as T,
    }: PixelsOpts & { type: T }) {
        this.direction = direction
        this.width = width
        this.height = height
        this.pixelDensity = pixelDensity
        this.stepRate = stepRate
        this.type = type

        this.offscreenCanvas = document.createElement('canvas')
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!
        this.offscreenCanvas.width = this.width * this.pixelDensity
        this.offscreenCanvas.height = this.height * this.pixelDensity
    }

    abstract createPixel(x: number, y: number): T extends 'blur' ? PixelBlur : PixelSmudge

    get vertical() {
        return this.direction === 'up' || this.direction === 'down'
    }

    init = () => {
        this.pixels = []
        this.promises = []
        this.done = false

        let count = this.vertical ? this.width : this.height
        count *= this.pixelDensity
        let startSide = this.direction === 'down' || this.direction === 'right' ? 0 : count - 1

        for (let i = 0; i < count; i++) {
            let [x, y] = this.vertical ? [i, startSide] : [startSide, i]
            let pix = this.createPixel(x, y)
            this.pixels.push(pix)
            this.promises.push(pix.promise)
        }

        Promise.all(this.promises).then(() => (this.done = true))
    }

    update = (ctx: CanvasRenderingContext2D, delta: number) => {
        if (this.done) return

        let d = this.lastDelta + delta
        let stepsNeeded = Math.round(d * (this.stepRate / 1000))

        let steps = 0
        while (steps < stepsNeeded) {
            this.offscreenCtx.drawImage(
                ctx.canvas,
                0,
                0,
                this.width * this.pixelDensity,
                this.height * this.pixelDensity
            )
            let imageData = this.offscreenCtx.getImageData(
                0,
                0,
                this.offscreenCanvas.width,
                this.offscreenCanvas.height
            )
            this.pixels.forEach((pixel) => {
                for (let i = 0; i < this.pixelDensity; i++) pixel.step(imageData)
            })
            ctx.putImageData(imageData, 0, 0)
            steps++
        }
    }
}
