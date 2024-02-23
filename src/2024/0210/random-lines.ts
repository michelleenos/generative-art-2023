import { random, shuffle } from '~/helpers/utils'

type AngleType = 'diag1' | 'diag2' | 'horz' | 'vert'
let angleOpts: { [key in AngleType]: [number, number] } = {
    diag1: [-Math.PI * 0.25, Math.PI * 0.75], // diag topright bottomleft
    diag2: [Math.PI * 0.25, -Math.PI * 0.75], // diag topleft bottomright
    horz: [0, Math.PI], // horizontal
    vert: [Math.PI * 0.5, -Math.PI * 0.5], // vertical
}

const angleCombos: [AngleType, AngleType][] = [
    ['diag1', 'diag2'],
    ['diag1', 'horz'],
    ['diag1', 'vert'],
    ['diag2', 'horz'],
    ['diag2', 'vert'],
]

type RandomLinesOptions = {
    palette: string[]
    pixelDensity?: number
    stepRate?: number
    maxLines?: number
    maxLineLength?: number
    minLineLength?: number
    weight?: number
    width?: number
    height?: number
    stepMult?: number
}

export class RandomLines {
    drawing = false
    pointIndexCurrent = 0
    color: string = ''
    palette: string[] = []
    angleTypes: AngleType[]
    angleOptions: number[]
    angleCurrent: number = 0
    angle: number = 0
    pointsToDraw: [number, number][] = []
    linesDrawn = 0
    maxLines: number
    maxLineLength: number
    minLineLength: number
    stepRate: number
    stepMult: number
    weight: number
    pixelDensity: number
    width: number
    height: number
    offscreenCanvas: HTMLCanvasElement
    offscreenCtx: CanvasRenderingContext2D
    done = false
    startAttempts = 0
    maxStartAttempts = 40

    constructor({
        palette,
        pixelDensity = 1,
        stepRate = 1200,
        maxLines = 100,
        maxLineLength = 500,
        minLineLength = 20,
        width = 500,
        height = 500,
        weight = 1,
        stepMult = 1,
    }: RandomLinesOptions) {
        this.drawing = false
        this.palette = palette
        this.pixelDensity = pixelDensity
        this.stepRate = stepRate
        this.maxLines = maxLines
        this.maxLineLength = maxLineLength
        this.minLineLength = minLineLength
        this.width = width
        this.height = height
        this.weight = weight
        this.stepMult = stepMult

        this.offscreenCanvas = document.createElement('canvas')
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!
        this.offscreenCanvas.width = this.width * this.pixelDensity
        this.offscreenCanvas.height = this.height * this.pixelDensity
        this.offscreenCtx.scale(this.pixelDensity, this.pixelDensity)
        this.offscreenCtx.fillStyle = '#fff'
        this.offscreenCtx.fillRect(0, 0, this.width, this.height)

        // let angleTypes = shuffle(Object.keys(angleOpts))
        shuffle(angleCombos)
        this.angleTypes = [angleCombos[0][0], angleCombos[0][1]]
        this.angleOptions = [...angleOpts[this.angleTypes[0]], ...angleOpts[this.angleTypes[1]]]
    }

    isHorizontal = () => this.angleTypes.includes('horz')

    isVertical = () => this.angleTypes.includes('vert')

    getBlankPixel = (imageData: ImageData): [number, number] | void => {
        let x = Math.floor(Math.random() * this.width)
        let y = Math.floor(Math.random() * this.height)
        let pixel = (x + y * imageData.width) * 4 * this.pixelDensity

        let maxTries = 10
        let tries = 0
        while (tries < maxTries) {
            if (imageData.data[pixel] === 255) {
                return [x, y]
            }
            x = Math.floor(Math.random() * this.width)
            y = Math.floor(Math.random() * this.height)
            pixel = (x + y * imageData.width) * 4 * this.pixelDensity

            tries++
        }
    }

    getLinePoints = (imageData: ImageData, x: number, y: number) => {
        let curX = x
        let curY = y
        let points: [number, number][] = []

        while (points.length < this.maxLineLength) {
            let nextX = Math.round(curX + Math.cos(this.angle) * this.stepMult)
            let nextY = Math.round(curY + Math.sin(this.angle) * this.stepMult)
            let pix = (nextX + nextY * imageData.width) * 4 * this.pixelDensity

            if (
                imageData.data[pix] < 255 ||
                nextX < -10 ||
                nextX >= this.width + 10 ||
                nextY < -10 ||
                nextY >= this.height + 10
            ) {
                break
            } else {
                points.push([curX, curY])
                curX = nextX
                curY = nextY
            }
        }

        if (points.length < this.minLineLength) {
            return false
        }

        return points
    }

    attemptStart = () => {
        if (this.startAttempts > this.maxStartAttempts) {
            this.done = true
            console.log('done with lines: ', this.linesDrawn)
            return
        }
        let imageData = this.offscreenCtx.getImageData(
            0,
            0,
            this.offscreenCanvas.width,
            this.offscreenCanvas.height
        )
        let px = this.getBlankPixel(imageData)
        if (!px) {
            this.startAttempts++
            return
        }

        this.angle = random(this.angleOptions)
        this.color = random(this.palette)

        let points = this.getLinePoints(imageData, px[0], px[1])
        if (!points) {
            this.startAttempts++
            return
        }

        this.pointsToDraw = points
        this.pointIndexCurrent = 0
        this.drawing = true
        this.startAttempts = 0
    }

    update = (ctx: CanvasRenderingContext2D, delta: number) => {
        if (!this.drawing && this.linesDrawn >= this.maxLines) {
            this.done = true
            return false
        }

        let stepsNeeded = Math.round((delta / 1000) * this.stepRate)
        let steps = 0
        while (steps < stepsNeeded) {
            if (this.done || this.linesDrawn >= this.maxLines) {
                this.done = true
                return false
            }
            if (!this.drawing) {
                this.attemptStart()
            } else {
                this.drawStep(ctx)
            }

            steps++
        }

        return true
    }

    drawStep = (ctx: CanvasRenderingContext2D) => {
        ctx.strokeStyle = this.color
        ctx.lineCap = 'round'
        ctx.lineWidth = this.weight

        let nextPoint = this.pointsToDraw[this.pointIndexCurrent + 1]
        let curPoint = this.pointsToDraw[this.pointIndexCurrent]
        ctx.beginPath()
        ctx.moveTo(curPoint[0], curPoint[1])
        ctx.lineTo(nextPoint[0], nextPoint[1])
        ctx.stroke()

        this.offscreenCtx.beginPath()
        this.offscreenCtx.moveTo(curPoint[0], curPoint[1])
        this.offscreenCtx.lineTo(nextPoint[0], nextPoint[1])
        this.offscreenCtx.lineWidth = this.weight * 4
        this.offscreenCtx.stroke()

        if (this.pointIndexCurrent >= this.pointsToDraw.length - 2) {
            this.drawing = false
            this.linesDrawn++
        }

        this.pointIndexCurrent++
    }

    stepInFrame = () => {}
}
