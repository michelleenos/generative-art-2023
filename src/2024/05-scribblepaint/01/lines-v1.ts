import chroma from 'chroma-js'
import p5 from 'p5'
import easing from '~/helpers/easings'
import { random } from '~/helpers/utils'
import { sortPalette } from '../../../helpers/sort-colors'
import { Rectangle } from '~/helpers/trig-shapes'
import { pixelIndex, randomAngle, randomInCircle, randomInSquare, setShadow } from '../utils'

function distSq(p1: [number, number], p2: [number, number]) {
    return Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2)
}

type LinesOptions = {
    palette: string[]
    pd: number
}

type LinesState = {
    _currentLineLength: number
    _currentLine: [number, number][]
    linesDrawn: number
    lineLookPoint: [number, number]
    lastPoint: [number, number] | null
    longLines: [number, number][][]
    angle: number
    lineAngle: number
    redrawnCount: number
    redrawing: boolean
    longLinesSaved: [number, number][][]
    done: boolean
    doneAdding: boolean
    colorIndex: number
    failsCount: number
    currentMinLen: number
}

const linesStateDefaults = (): Omit<
    LinesState,
    'angle' | 'lineAngle' | 'lineLookPoint' | 'currentMinLen'
> => ({
    done: false,
    doneAdding: false,
    colorIndex: 0,
    linesDrawn: 0,
    longLines: [],
    failsCount: 0,
    lastPoint: null,
    longLinesSaved: [],
    redrawing: false,
    redrawnCount: 0,
    _currentLine: [],
    _currentLineLength: 0,
})

export class Lines {
    g: p5.Graphics
    width: number
    height: number
    rect: Rectangle
    pd: number

    palette: string[]
    currentPalette!: string[]
    stepRate = 2000
    stepMult = 1
    alphaThreshold = 150
    longLineRatio = 0.4
    lineWidth = 3
    newPixelRadius = 50
    newPixelMethod: 'circle' | 'rect' | 'random' = 'random'

    len = {
        minStart: 20,
        minEnd: 10,
        minReduceBy: 2,
        maxForColor: 500,
        max: 500,
    }
    redraw:
        | {
              rate: number
              maxMult: number
              after: number
          }
        | false = false
    wiggle = {
        withinLine: 0.05,
        onLinePointFail: 0.05,
        betweenLine: 0.05,
        nLines: 100,
        max: 0,
        dir: undefined as undefined | 1 | -1,
    }
    failsUntil = {
        stop: 1000,
        moveLook: 15,
        forceMoveLook: 100,
        reduceMinLen: 200,
    }
    tries = {
        pixel: 10,
        linePoint: 10,
    }
    colors = {
        sort: 'none' as 'luminance' | 'lightness' | 'saturation' | 'hue' | 'none',
        pattern: 'step' as 'step' | 'length',
        move: 0.0001,
        mixSpace: 'hsl' as chroma.InterpolationMode,
        sortDir: '+' as '+' | '-',
        shadowAmt: 0,
        shadowAlpha: 0,
        shadowOffset: [0, 0] as [number, number],
    }

    state: LinesState = {
        _currentLineLength: 0,
        _currentLine: [],
        linesDrawn: 0,
        lineLookPoint: [0, 0],
        lastPoint: null,
        longLines: [],
        angle: 0,
        lineAngle: 0,
        redrawnCount: 0,
        redrawing: false,
        longLinesSaved: [],
        done: false,
        doneAdding: false,
        colorIndex: 0,
        failsCount: 0,
        currentMinLen: this.len.minStart,
    }

    constructor(g: p5.Graphics, opts: LinesOptions) {
        this.width = g.width
        this.height = g.height
        this.rect = new Rectangle(0, 0, this.width, this.height)
        this.pd = opts.pd
        this.g = g
        this.g.pixelDensity(this.pd)
        this.loadPixels()

        this.state.angle = Math.random() * Math.PI * 2
        this.state.lineAngle = this.state.angle
        this.state.lineLookPoint = [Math.floor(random(this.width)), Math.floor(random(this.height))]

        this.palette = opts.palette
        this.sortColors()
    }

    get done() {
        return this.state.done
    }

    setLine(line: [number, number][] = [], isBeingRedrawn = false) {
        if (!isBeingRedrawn && line.length > 2) {
            if (distSq(line[0], line[line.length - 1]) > (this.width * this.longLineRatio) ** 2) {
                this.state.longLines.push([...line])

                this.state.longLinesSaved.push([...line])
            }
        }
        this.state.lastPoint = null
        this.state._currentLine = [...line]
        this.state._currentLineLength = this.state._currentLine.length
        this.state.failsCount = 0
    }

    sortColors() {
        this.currentPalette = [...this.palette]
        if (this.colors.sort === 'none') {
            return
        }
        this.currentPalette = sortPalette(
            this.currentPalette,
            this.colors.sort,
            this.colors.sortDir
        )
    }

    maybeGetNewPixel() {
        let [x, y] = this.state.lineLookPoint
        let tries = 0
        while (tries < this.tries.pixel) {
            let [nx, ny] =
                this.newPixelMethod === 'circle'
                    ? randomInCircle(x, y, this.newPixelRadius)
                    : this.newPixelMethod === 'rect'
                    ? randomInSquare(x, y, this.newPixelRadius)
                    : this.rect.getRandom()
            if (this.rect.contains(nx, ny) && this.isBlankIshPx(nx, ny)) {
                return [nx, ny]
            }
            tries++
        }
        return false
    }

    isBlankIshPx(x: number, y: number) {
        let ind = pixelIndex(Math.round(x), Math.round(y), this.width, this.pd)
        return this.g.pixels[ind + 3] < this.alphaThreshold
    }

    getLinePoints(x: number, y: number) {
        let curX = x
        let curY = y
        let points: [number, number][] = []
        let tries = 0

        while (points.length < this.len.max && tries < this.tries.linePoint) {
            let nextX = curX + Math.cos(this.state.lineAngle) * this.stepMult
            let nextY = curY + Math.sin(this.state.lineAngle) * this.stepMult

            if (nextX < 0 || nextX >= this.width || nextY < 0 || nextY >= this.height) {
                break
            } else if (!this.isBlankIshPx(nextX, nextY)) {
                this.state.lineAngle += randomAngle(this.wiggle.onLinePointFail)
                tries++
            } else {
                points.push([curX, curY])
                curX = nextX
                curY = nextY
                let angleDiff = this.state.lineAngle - this.state.angle

                if (this.wiggle.max > 0 && Math.abs(angleDiff) > this.wiggle.max) {
                    this.state.lineAngle +=
                        random(this.wiggle.withinLine) * (angleDiff > 0 ? -1 : 1)
                } else {
                    this.state.lineAngle += randomAngle(this.wiggle.withinLine)
                }

                tries = 0
            }
        }

        if (points.length < this.state.currentMinLen) {
            return false
        }

        return points
    }

    addFail() {
        let state = this.state
        state.failsCount++
        if (state.failsCount > this.failsUntil.moveLook && state.longLines.length) {
            let longLine = state.longLines.shift()!
            state.lineLookPoint = longLine[Math.floor(longLine.length / 2)]
        } else if (state.failsCount > this.failsUntil.forceMoveLook) {
            state.lineLookPoint = this.rect.getRandom()
        }

        if (state.failsCount > this.failsUntil.reduceMinLen) {
            this.state.currentMinLen = Math.max(
                this.state.currentMinLen - this.len.minReduceBy,
                this.len.minEnd
            )
        }

        if (
            state.failsCount > this.failsUntil.stop &&
            this.state.currentMinLen === this.len.minEnd
        ) {
            state.doneAdding = true
            state.longLinesSaved.sort((a, b) => b.length - a.length)
            state.redrawnCount = 0
        }
    }

    maybeGetNewLine() {
        while (true) {
            let pixel = this.maybeGetNewPixel()
            if (!pixel) break

            let [x1, y1] = pixel
            let points = this.getLinePoints(x1, y1)

            if (!points) break

            this.setLine(points)
            return true
        }
        this.addFail()
        return false
    }

    finishLine() {
        this.state.linesDrawn++
        this.loadPixels()
        this.setLine()
        if (this.state.linesDrawn % this.wiggle.nLines === 0) {
            this.getNewAngle()
        }
        this.state.lineAngle = this.state.angle

        if (
            this.redraw &&
            this.state.linesDrawn > this.redraw.after &&
            this.state.linesDrawn % this.redraw.rate === 0 &&
            this.state.redrawnCount < this.state.longLinesSaved.length * this.redraw.maxMult
        ) {
            this.doRedraw()
        }
    }

    getNewAngle() {
        this.state.angle += randomAngle(this.wiggle.betweenLine, this.wiggle.dir)
    }

    doRedraw() {
        this.state.redrawing = true
        this.state.redrawnCount++
        this.setLine(
            this.state.longLinesSaved[this.state.redrawnCount % this.state.longLinesSaved.length],
            true
        )
    }

    doEndRedraw() {
        if (this.redraw && this.state.redrawnCount < this.state.longLinesSaved.length) {
            this.doRedraw()
        } else {
            this.state.done = true
        }
    }

    setColor() {
        let color: chroma.Color
        if (this.colors.pattern === 'step') {
            this.state.colorIndex += this.colors.move
            if (this.state.colorIndex >= this.currentPalette.length) {
                this.state.colorIndex = 0
            }
            let c1 = this.currentPalette[Math.floor(this.state.colorIndex)]
            let c2 = this.currentPalette[Math.ceil(this.state.colorIndex)]
            if (!c2) c2 = this.currentPalette[0]
            color = chroma.mix(c1, c2, this.state.colorIndex % 1, this.colors.mixSpace)
        } else {
            let len = this.state._currentLineLength
            let max = Math.min(this.len.maxForColor, this.len.max)
            let mix = (len - this.len.minEnd) / (max - this.len.minEnd)
            mix = easing.outQuart(mix)
            color = chroma(this.currentPalette[Math.floor(mix * (this.currentPalette.length - 1))])
        }

        if (this.colors.shadowAmt) {
            let shadow = color.alpha(this.colors.shadowAlpha).hex()
            setShadow(
                this.g,
                shadow,
                this.lineWidth * this.colors.shadowAmt,
                this.colors.shadowOffset
            )
        }
        this.g.stroke(color.hex())
        this.g.strokeWeight(this.lineWidth)
    }

    lineStep() {
        if (this.state._currentLine.length < 2) return
        let [x1, y1] = this.state.lastPoint ?? this.state._currentLine[0]
        this.setColor()
        let [x2, y2] = this.state._currentLine[1]

        this.g.line(x1, y1, x2, y2)
        this.state.lastPoint = [x2, y2]
        this.state._currentLine.shift()
        if (this.state._currentLine.length < 2) {
            this.finishLine()
        }
    }

    update(delta: number) {
        let steps = Math.round((delta / 1000) * this.stepRate)
        while (steps > 0 && !this.state.done) {
            if (this.state._currentLine.length >= 2) {
                this.lineStep()
                steps--
                continue
            }
            if (this.state.doneAdding) {
                this.doEndRedraw()
            } else {
                this.maybeGetNewLine()
            }

            if (this.state.done) break
        }
        return this.state.done
    }

    loadPixels() {
        this.g.loadPixels()
    }

    reset(angle?: number, lookPoint?: [number, number]) {
        this.g.clear()
        this.loadPixels()
        this.sortColors()

        let newangle = angle || Math.random() * Math.PI * 2
        let newPoint = lookPoint || this.rect.getRandom()
        this.state = {
            ...linesStateDefaults(),
            angle: newangle,
            lineAngle: newangle,
            lineLookPoint: newPoint,
            currentMinLen: this.len.minStart,
        }
    }
}
