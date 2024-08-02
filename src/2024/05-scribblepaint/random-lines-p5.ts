import chroma from 'chroma-js'
import p5 from 'p5'
import easing from '~/helpers/easings'
import { Rectangle } from '~/helpers/trig-shapes'
import { random } from '~/helpers/utils'
import { getLinePoints } from './lines-fns'
import { sortPalette } from '../../helpers/sort-colors'
import { pixelIndex, randomAngle, randomInCircle, randomInSquare, setShadow } from './utils'

function distSq(p1: [number, number], p2: [number, number]) {
    return Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2)
}

type LinesOptions = {
    palette: string[]
    pd: number
}

type LinesState = {
    _currentLineLengths: number[]
    _currentLines: [number, number][][]
    linesDrawn: number
    lineLookPoint: [number, number][]
    longLines: [number, number][][]
    angle: number
    redrawnCount: number
    redrawing: boolean
    longLinesSaved: [number, number][][]
    done: boolean
    doneAdding: boolean
    colorIndex: number[]
    failsCount: number
    currentMinLen: number
}

const linesStateDefaults = (): Omit<
    LinesState,
    'angle' | 'lineAngle' | 'lineLookPoint' | 'currentMinLen'
> => ({
    done: false,
    doneAdding: false,
    colorIndex: [],
    linesDrawn: 0,
    longLines: [],
    failsCount: 0,
    longLinesSaved: [],
    redrawing: false,
    redrawnCount: 0,
    _currentLines: [],
    _currentLineLengths: [],
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
    parallel = 1
    lookPointShare = false

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
        dir: undefined as 1 | -1 | undefined,
    }
    failsUntil = {
        stop: 1000,
        moveLook: 150,
        forceMoveLook: 300,
        reduceMinLen: 200,
    }
    tries = {
        pixel: 10,
        linePoint: 10,
    }
    colors = {
        sort: 'none' as Parameters<typeof sortPalette>[1] | 'none',
        pattern: 'step' as 'step' | 'length',
        move: 0.0001,
        mixSpace: 'hsl' as chroma.InterpolationMode,
        sortDir: '+' as '+' | '-',
        shadowAmt: 0,
        shadowAlpha: 0,
        shadowOffset: [0, 0] as [number, number],
    }

    state: LinesState = {
        _currentLineLengths: [],
        _currentLines: [],
        linesDrawn: 0,
        lineLookPoint: [],
        longLines: [],
        angle: 0,
        redrawnCount: 0,
        redrawing: false,
        longLinesSaved: [],
        done: false,
        doneAdding: false,
        colorIndex: [],
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
        this.state.lineLookPoint = []
        for (let i = 0; i < this.parallel; i++) {
            this.state.lineLookPoint[i] = [
                Math.floor(random(this.width)),
                Math.floor(random(this.height)),
            ]
        }

        this.palette = opts.palette
        this.sortColors()

        for (let i = 0; i < this.parallel; i++) {
            this.state._currentLines.push([])
            this.state._currentLineLengths.push(0)
        }
    }

    get done() {
        return this.state.done
    }

    setLine(index: number, line: [number, number][] = [], isBeingRedrawn = false) {
        if (!isBeingRedrawn && line.length > 2) {
            if (distSq(line[0], line[line.length - 1]) > (this.width * this.longLineRatio) ** 2) {
                this.state.longLines.push([...line])

                this.state.longLinesSaved.push([...line])
            }
        }
        this.state._currentLines[index] = [...line]
        this.state._currentLineLengths[index] = line.length
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

    maybeGetNewPixel(index: number) {
        let x: number, y: number
        if (this.lookPointShare) {
            ;[x, y] = this.state.lineLookPoint[0]
        } else {
            if (!this.state.lineLookPoint[index]) {
                this.state.lineLookPoint[index] = this.rect.getRandom()
            }
            ;[x, y] = this.state.lineLookPoint[index]
        }
        let tries = 0
        while (tries < this.tries.pixel) {
            let [nx, ny] =
                this.newPixelMethod === 'circle'
                    ? randomInCircle(x, y, this.newPixelRadius)
                    : this.newPixelMethod === 'rect'
                    ? randomInSquare(x, y, this.newPixelRadius)
                    : this.rect.getRandom()
            if (this.isBlankIshPx(nx, ny)) {
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
        return getLinePoints({
            x,
            y,
            angle: this.state.angle,
            wiggle: this.wiggle.withinLine,
            wiggleMax: this.wiggle.max ?? undefined,
            lenMax: this.len.max,
            lenMin: this.state.currentMinLen,
            mult: this.stepMult,
            maxTries: this.tries.linePoint,
            checkPoint: (x, y) => {
                if (!this.rect.contains(x, y)) {
                    return { valid: false, stop: true }
                } else if (!this.isBlankIshPx(x, y)) {
                    return { valid: false, stop: false }
                }
                return { valid: true, stop: false }
            },
        })
    }

    addFail(index: number) {
        let state = this.state
        state.failsCount++
        if (state.failsCount > this.failsUntil.moveLook && state.longLines.length) {
            let longLine = state.longLines.shift()!
            if (this.lookPointShare) {
                state.lineLookPoint[0] = longLine[Math.floor(longLine.length / 2)]
            } else {
                state.lineLookPoint[index] = longLine[Math.floor(longLine.length / 2)]
            }
        } else if (state.failsCount > this.failsUntil.forceMoveLook) {
            if (this.lookPointShare) {
                state.lineLookPoint[0] = this.rect.getRandom()
            } else {
                state.lineLookPoint[index] = this.rect.getRandom()
            }
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
            state.done = true
            state.longLinesSaved.sort((a, b) => b.length - a.length)
            state.redrawnCount = 0
        }
    }

    maybeGetNewLine(index: number) {
        while (true) {
            let pixel = this.maybeGetNewPixel(index)
            if (!pixel) break

            let [x1, y1] = pixel
            let points = this.getLinePoints(x1, y1)

            if (!points) break

            this.setLine(index, points)
            return true
        }
        this.addFail(index)
        return false
    }

    finishLine(index: number) {
        this.state.linesDrawn++
        this.loadPixels()
        this.setLine(index)
        if (this.state.linesDrawn % this.wiggle.nLines === 0) {
            this.getNewAngle()
        }

        if (
            this.redraw &&
            this.state.linesDrawn > this.redraw.after &&
            this.state.linesDrawn % this.redraw.rate === 0 &&
            this.state.redrawnCount < this.state.longLinesSaved.length * this.redraw.maxMult
        ) {
            this.doRedraw(index)
        }
    }

    getNewAngle() {
        this.state.angle += randomAngle(this.wiggle.betweenLine, this.wiggle.dir)
    }

    doRedraw(index: number) {
        this.state.redrawing = true
        this.state.redrawnCount++
        this.setLine(
            index,
            this.state.longLinesSaved[this.state.redrawnCount % this.state.longLinesSaved.length],
            true
        )
    }

    // doEndRedraw() {
    //     if (this.redraw && this.state.redrawnCount < this.state.longLinesSaved.length) {
    //         this.doRedraw()
    //     } else {
    //         this.state.done = true
    //     }
    // }

    setColor(index: number) {
        let color: chroma.Color
        let colorIndexes = this.state.colorIndex
        if (this.colors.pattern === 'step') {
            if (colorIndexes[index] === undefined) colorIndexes[index] = 0
            colorIndexes[index] += this.colors.move
            if (colorIndexes[index] >= this.currentPalette.length) {
                colorIndexes[index] = 0
            }
            let c1 = this.currentPalette[Math.floor(colorIndexes[index])]
            let c2 = this.currentPalette[Math.ceil(colorIndexes[index])]
            if (!c2) c2 = this.currentPalette[0]
            color = chroma.mix(c1, c2, colorIndexes[index] % 1, this.colors.mixSpace)
        } else {
            let len = this.state._currentLineLengths[index]
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

    lineStep(i: number) {
        let line = this.state._currentLines[i]
        if (line.length < 2) return
        let [x1, y1] = line[0]
        this.setColor(i)
        let [x2, y2] = line[1]

        this.g.line(x1, y1, x2, y2)
        line.shift()
        if (line.length < 2) {
            this.finishLine(i)
        }
    }

    update(delta: number) {
        let steps = Math.round((delta / 1000) * this.stepRate)
        while (steps > 0 && !this.state.done) {
            let i = 0
            while (i < this.parallel && !this.state.done) {
                let line = this.state._currentLines[i]
                if (line && line.length >= 2) {
                    this.lineStep(i)
                    i++
                } else {
                    this.maybeGetNewLine(i)
                }
            }
            steps--
            if (this.state.done) break
        }

        return this.state.done
    }

    loadPixels() {
        this.g.loadPixels()
    }

    reset(angle?: number) {
        this.g.clear()
        this.loadPixels()
        this.sortColors()

        let newangle = angle || Math.random() * Math.PI * 2
        let points = [...this.state.lineLookPoint]
        for (let i = 0; i < this.parallel; i++) {
            points[i] = this.rect.getRandom()
        }
        this.state = {
            ...linesStateDefaults(),
            angle: newangle,
            lineLookPoint: points,
            currentMinLen: this.len.minStart,
        }
    }
}
