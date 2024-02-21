import { lerp } from '~/helpers/utils'
import { rgbToHsl, type ColorHSL, type ColorRGB, hslToRgb } from '~/helpers/color-utils'

const lerpRgb = (color1: ColorRGB, color2: ColorRGB, amt: number) => {
    return {
        r: lerp(color1.r, color2.r, amt),
        g: lerp(color1.g, color2.g, amt),
        b: lerp(color1.b, color2.b, amt),
    } as ColorRGB
}

const isNotWhite = ({ r, g, b }: ColorRGB) => r < 255 || g < 255 || b < 255

type NextCb = (x: number, y: number) => [number, number]

interface PixelSmearOrBlurOpts {
    x: number
    y: number
    width: number
    height: number
    nextCb?: NextCb
}
interface PixelSmearOpts extends PixelSmearOrBlurOpts {
    palette: ColorRGB[]
}

export class PixelSmear {
    x: number
    y: number
    width: number
    height: number
    done = false
    currentColor: ColorRGB = { r: 255, g: 255, b: 255 }
    sinceLast: number = 0
    palette: ColorRGB[]
    paletteHSL: ColorHSL[]
    promise: Promise<void>
    resolve: (value: void) => void
    _next: NextCb

    constructor({
        x = 0,
        y = 0,
        width,
        height,
        palette,
        nextCb = (x, y) => [x, y + 1],
    }: PixelSmearOpts) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.palette = palette
        this.paletteHSL = palette.map((color) => rgbToHsl(color))
        let [promise, resolve] = this.getPromise()
        this.promise = promise
        this.resolve = resolve
        this._next = nextCb
    }

    getPromise = () => {
        let savedResolve: (value: void) => void
        let promise = new Promise<void>((resolve) => {
            savedResolve = resolve
        })
        return [promise, savedResolve!] as [Promise<void>, (value: void) => void]
    }

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

    getClosestColor = (rgb: ColorRGB) => {
        let hsl = rgbToHsl(rgb)
        let closest = 0
        let closestDist = Infinity
        this.paletteHSL.forEach((paletteColor, i) => {
            let distance = Math.abs(hsl.h - paletteColor.h)
            if (distance < closestDist) {
                closest = i
                closestDist = distance
            }
        })
        return this.palette[closest]
    }

    step = (imageData: ImageData) => {
        if (this.done) return
        let ix = this.x
        let iy = this.y
        let i = (ix + iy * imageData.width) * 4
        this.updateColor(imageData, ix, iy)

        imageData.data[i] = this.currentColor.r
        imageData.data[i + 1] = this.currentColor.g
        imageData.data[i + 2] = this.currentColor.b
        imageData.data[i + 3] = 255
        this.next()
    }

    updateColor = (imageData: ImageData, pixelX: number, pixelY: number) => {
        let i = (pixelX + pixelY * imageData.width) * 4
        let pix = {
            r: imageData.data[i],
            g: imageData.data[i + 1],
            b: imageData.data[i + 2],
        }

        if (isNotWhite(pix)) {
            this.currentColor = this.getClosestColor(pix)
            this.sinceLast = 0
        } else {
            this.currentColor = lerpRgb(this.currentColor, { r: 255, g: 255, b: 255 }, 0.01)
            this.sinceLast++
        }
    }
}

export class PixelBlur {
    x: number
    y: number
    width: number
    height: number
    done = false
    currentColor: ColorRGB | undefined
    promise: Promise<void>
    resolve: (value: void) => void
    _next: NextCb
    constructor({
        x = 0,
        y = 0,
        width,
        height,
        nextCb = (x, y) => [x, y + 1],
    }: Omit<PixelSmearOpts, 'palette'>) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        let [promise, resolve] = this.getPromise()
        this.promise = promise
        this.resolve = resolve
        this._next = nextCb
    }

    getPromise = () => {
        let savedResolve: (value: void) => void
        let promise = new Promise<void>((resolve) => {
            savedResolve = resolve
        })
        return [promise, savedResolve!] as [Promise<void>, (value: void) => void]
    }

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

    step = (imageData: ImageData) => {
        if (this.done) return
        let ix = this.x
        let iy = this.y
        let i = (ix + iy * imageData.width) * 4
        let color = {
            r: imageData.data[i],
            g: imageData.data[i + 1],
            b: imageData.data[i + 2],
        }
        let cHsl = rgbToHsl(color)

        for (let move = 1; move < 4; move += 1) {
            let i = (ix - move + (iy - move) * imageData.width) * 4
            let color1 = {
                r: imageData.data[i],
                g: imageData.data[i + 1],
                b: imageData.data[i + 2],
            }
            let c1Hsl = rgbToHsl(color1)
            cHsl = {
                h: lerp(cHsl.h, c1Hsl.h, 0.8),
                s: Math.max(cHsl.s, c1Hsl.s),
                l: lerp(cHsl.l, c1Hsl.l, 0.5),
            }
        }

        this.currentColor = hslToRgb(cHsl)

        imageData.data[i] = this.currentColor.r
        imageData.data[i + 1] = this.currentColor.g
        imageData.data[i + 2] = this.currentColor.b
        imageData.data[i + 3] = 255
        this.next()
    }
}

export interface SmearOpts {
    direction?: 'down' | 'right' | 'left' | 'up'
    width?: number
    height?: number
    palette: ColorRGB[]
    pixelDensity?: number
    stepRate?: number
}

const nextCbRight: NextCb = (x, y) => [x + 1, y]
const nextCbLeft: NextCb = (x, y) => [x - 1, y]
const nextCbDown: NextCb = (x, y) => [x, y + 1]
const nextCbUp: NextCb = (x, y) => [x, y - 1]

const nextCbMap = {
    right: nextCbRight,
    left: nextCbLeft,
    down: nextCbDown,
    up: nextCbUp,
}

export class Smear {
    direction: 'down' | 'right' | 'left' | 'up'
    pixels: PixelSmear[] = []
    width: number
    height: number
    pixelDensity: number
    offscreenCanvas: HTMLCanvasElement
    offscreenCtx: CanvasRenderingContext2D
    promises: Promise<void>[] = []
    done = false
    stepRate: number
    lastDelta: number = 0

    constructor({
        direction = 'right',
        width = 500,
        height = 500,
        stepRate = 200,
        pixelDensity = 1,
        palette,
    }: SmearOpts) {
        this.direction = direction
        this.width = width
        this.height = height
        this.stepRate = stepRate
        this.pixelDensity = pixelDensity
        this.offscreenCanvas = document.createElement('canvas')
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!
        this.offscreenCanvas.width = this.width * this.pixelDensity
        this.offscreenCanvas.height = this.height * this.pixelDensity

        if (this.direction === 'down' || this.direction === 'up') {
            for (let x = 0; x < width * this.pixelDensity; x += 1) {
                let pix = new PixelSmear({
                    x,
                    y: this.direction === 'down' ? 0 : this.height * this.pixelDensity - 1,
                    width: width * this.pixelDensity,
                    height: height * this.pixelDensity,
                    palette: palette,
                    nextCb: nextCbMap[this.direction],
                })
                this.pixels.push(pix)
                this.promises.push(pix.promise)
            }
        } else {
            for (let y = 0; y < height * this.pixelDensity; y += 1) {
                let pix = new PixelSmear({
                    x: this.direction === 'right' ? 0 : this.width * this.pixelDensity - 1,
                    y,
                    width: width * this.pixelDensity,
                    height: height * this.pixelDensity,
                    palette: palette,
                    nextCb: nextCbMap[this.direction],
                })
                this.pixels.push(pix)
                this.promises.push(pix.promise)
            }
        }

        Promise.all(this.promises).then(() => {
            this.done = true
            console.log('done')
        })
    }

    update = (ctx: CanvasRenderingContext2D, delta: number) => {
        if (this.done) return

        let d = this.lastDelta + delta
        let stepsNeeded = Math.round(d * (this.stepRate / 1000))
        if (stepsNeeded === 0) {
            this.lastDelta += d
            return
        } else {
            this.lastDelta = 0
        }

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
                for (let i = 0; i < this.pixelDensity; i++) {
                    pixel.step(imageData)
                }
            })
            ctx.putImageData(imageData, 0, 0)
            steps++
        }
    }
}

export class Blur {
    direction: 'down' | 'right' | 'left' | 'up'
    pixels: PixelBlur[] = []
    width: number
    height: number
    pixelDensity: number
    offscreenCanvas: HTMLCanvasElement
    offscreenCtx: CanvasRenderingContext2D
    promises: Promise<void>[] = []
    done = false

    constructor({
        direction = 'right',
        width = 500,
        height = 500,
        pixelDensity = 1,
    }: Omit<SmearOpts, 'palette'>) {
        this.direction = direction
        this.width = width
        this.height = height
        this.pixelDensity = pixelDensity
        this.offscreenCanvas = document.createElement('canvas')
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!
        this.offscreenCanvas.width = this.width * this.pixelDensity
        this.offscreenCanvas.height = this.height * this.pixelDensity

        for (let y = 0; y < height * this.pixelDensity; y += 1) {
            let pix = new PixelBlur({
                x: 0,
                y,
                width: width * this.pixelDensity,
                height: height * this.pixelDensity,
                nextCb: nextCbMap['right'],
            })
            this.pixels.push(pix)
            this.promises.push(pix.promise)
        }

        Promise.all(this.promises).then(() => {
            this.done = true
            console.log('done')
        })
    }

    update = (ctx: CanvasRenderingContext2D) => {
        if (this.done) return
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
            for (let i = 0; i < this.pixelDensity; i++) {
                pixel.step(imageData)
            }
        })
        ctx.putImageData(imageData, 0, 0)
    }
}
