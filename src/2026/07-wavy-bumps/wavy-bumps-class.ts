import chroma from 'chroma-js'
import { createNoise2D, NoiseFunction2D } from 'simplex-noise'
import createCanvas from '~/helpers/create-canvas'
import { FixedFpsLoop } from '~/helpers/loop'
import { makeRng, Rng } from '~/helpers/prng'
import { map, round } from '~/helpers/utils'
import '~/style.css'
import { getRibbon, Ribbon, smoothDrawRibbon } from './bumps-ribbon'
import { getLineLookup, makeStroke } from './bumps-strokes'
import { C, WavyBumpsConfig } from './config'
import { getBumpsPoints } from './get-bumps'
import { buildWavyBumpsGui } from './gui'

type Sizes = { width: number; height: number }

type BumpsPalette = {
    c1: chroma.Color
    c2: chroma.Color
    bgColor: chroma.Color
    lessSaturated: boolean
    reset(): void
    nextColor(): chroma.Color
}

type BumpsSeedState = {
    rng: Rng
    noise: NoiseFunction2D
    palette: BumpsPalette
}

type BumpsLayout = {
    bounds: {
        xStart: number
        xEnd: number
        peakXStart: number
        peakXEnd: number
    }
    overlapY: number
    fieldStepX: number
    fieldStepY: number
}

function makePalette(rng: Rng): BumpsPalette {
    const hue = rng(170, 330)

    const c1 = chroma([0.25, 0.12, hue], 'oklch')
    const c2 = chroma(c1)
        .set('oklch.h', `+${rng(100, 200)}`)
        .set('oklch.l', `+0.5`)
    const lessSaturated = rng() < 0.3
    let mixAmt = 0
    function nextColor() {
        const c = chroma
            .mix(c1, c2, mixAmt, 'oklch')
            .set('oklch.c', lessSaturated ? `*${rng(0.8, 1.8)}` : `*${rng(1.2, 2)}`)
        mixAmt = (mixAmt + rng(0.5, 0.75)) % 1
        return c
    }
    const bgColor = nextColor().set('oklch.l', '0.7')

    return {
        c1,
        c2,
        lessSaturated,
        reset() {
            mixAmt = rng(0, 1)
        },
        nextColor,
        bgColor,
    }
}

function makeSeedState(seed: number): BumpsSeedState {
    const rng = makeRng(seed)
    const noise = createNoise2D(rng)
    return { rng, noise, palette: makePalette(rng) }
}

function makeLayout(width: number, C: WavyBumpsConfig): BumpsLayout {
    const { peakWidth, lowMin } = C.bumps
    const { density } = C.field
    const { spacing, overlap } = C
    const fieldStepY = 100 / density.y
    return {
        bounds: {
            xStart: -peakWidth,
            xEnd: width + peakWidth,
            peakXStart: Math.trunc(-peakWidth * 0.5),
            peakXEnd: Math.trunc(width + peakWidth * 0.5),
        },
        overlapY: overlap ? Math.ceil(spacing + (spacing - lowMin)) : 0,
        fieldStepX: 100 / density.x,
        fieldStepY,
    }
}

interface WavyBumpsProps {
    ctx: CanvasRenderingContext2D
    sizes: Sizes
}

class WavyBumps {
    seed = 395055755
    seedState: BumpsSeedState
    layout: BumpsLayout
    ctx: CanvasRenderingContext2D
    sizes: Sizes

    constructor({ ctx, sizes }: WavyBumpsProps) {
        this.ctx = ctx
        this.sizes = sizes
        this.seedState = makeSeedState(this.seed)
        this.layout = makeLayout(sizes.width, C)
    }

    buildGui() {
        buildWavyBumpsGui(C, {
            onChange: () => {
                this.setup()
                this.draw()
            },
            onNewSeed: () => {
                this.newSeed()
                this.setup()
                this.draw()
            },
        })
    }

    newSeed() {
        this.seed = (Math.random() * 2 ** 32) >>> 0
    }

    setup() {
        console.log('SEED: ', this.seed)
        this.seedState = makeSeedState(this.seed)
        this.layout = makeLayout(this.sizes.width, C)
    }

    displacePoint(x: number, y: number, wavePct: number) {
        const { noiseScale, moveAmtTop, moveAmtBot } = C.field
        const { noise } = this.seedState
        let xVal = x
        let yVal = y
        let noiseAmtX = map(wavePct, 0, 1, moveAmtBot.x, moveAmtTop.x)
        let noiseAmtY = map(wavePct, 0, 1, moveAmtBot.y, moveAmtTop.y)
        let nx = noise(x * noiseScale.x, y * noiseScale.y)
        let ny = noise(x * noiseScale.x + 123, y * noiseScale.y + 123)
        let angle = Math.atan2(ny, nx)
        let nr = noise(x * noiseScale.x + 245, y * noiseScale.y + 245)
        xVal += Math.cos(angle) * noiseAmtX * nr
        yVal += Math.sin(angle) * noiseAmtY * nr
        return { x: xVal, y: yVal }
    }

    getStrokeRibbon(
        x: number,
        y: number,
        wavePct: number,
        lineLookup: ReturnType<typeof getLineLookup>,
    ) {
        const displaced = this.displacePoint(x, y, wavePct)
        const strokePts = makeStroke({ ...displaced, lineLookup, config: C.strokePath })
        const ribbon = getRibbon(strokePts, {
            ...C.strokeRibbon,
            taperType: this.seedState.rng() < 0.5 ? 'start' : 'end',
        })
        return ribbon
    }

    // *getStrokes(rowY: number) {
    //     const { rng } = this.seedState
    //     const { width } = this.sizes
    //     const { bounds, fieldStepX, overlapY, fieldStepY } = this.layout
    //     const points = getBumpsPoints({ ...bounds, bumps: C.bumps, rng })
    //     const lineLookup = getLineLookup(points, { ...bounds })
    //     const bottom = -overlapY
    //     const jitter = fieldStepX * C.animation.jitterRatio

    //     const positions: { x: number; y: number; wavePct: number; key: number }[] = []
    //     for (let x = -fieldStepX; x < width + fieldStepX * 2; x += fieldStepX) {
    //         const top = Math.abs(lineLookup(x).y)
    //         for (let y = top; y > bottom; y -= fieldStepY) {
    //             const wavePct = top === 0 ? 0 : Math.max(0, y) / top
    //             positions.push({ x, y, wavePct, key: x + rng(-jitter, jitter) })
    //         }
    //     }

    //     positions.sort((a, b) => a.key - b.key)

    //     for (const { x, y, wavePct } of positions) {
    //         yield this.getStrokeRibbon(x, y + rowY, wavePct, lineLookup)
    //     }
    // }

    *getStrokes(rowY: number) {
        const { rng } = this.seedState
        const { width } = this.sizes
        const { bounds, fieldStepX, overlapY, fieldStepY } = this.layout
        const points = getBumpsPoints({ ...bounds, bumps: C.bumps, rng })
        const lineLookup = getLineLookup(points, { ...bounds })
        const bottom = -overlapY

        for (let x = -fieldStepX; x < width + fieldStepX * 2; x += fieldStepX) {
            const top = Math.abs(lineLookup(x).y)
            for (let y = top; y > bottom; y -= fieldStepY) {
                const wavePct = top === 0 ? 0 : Math.max(0, y) / top
                yield this.getStrokeRibbon(x, y + rowY, wavePct, lineLookup)
            }
        }
    }

    drawRow(rowY: number) {
        const { ctx } = this
        for (const ribbon of this.getStrokes(rowY)) {
            ctx.beginPath()
            smoothDrawRibbon(ribbon, ctx)
            ctx.fill()
        }
    }

    setupCanvas() {
        const { ctx } = this
        const { width, height } = this.sizes
        const { palette } = this.seedState
        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = palette.bgColor.css()
        ctx.fillRect(0, 0, width, height)
    }

    draw() {
        const startTime = performance.now()

        const { ctx } = this
        const { palette } = this.seedState
        const { height } = this.sizes
        const { spacing } = C

        this.setupCanvas()
        ctx.save()
        ctx.translate(0, height / 2)
        ctx.scale(1, -1)
        ctx.translate(0, -height / 2)

        const yCount = Math.ceil(height / spacing) + 1
        for (let yi = yCount - 1; yi >= 0; yi--) {
            const y = yi * spacing
            const color = palette.nextColor().alpha(C.alpha).css()
            ctx.fillStyle = color
            this.drawRow(y)
        }

        ctx.restore()

        const time = performance.now() - startTime
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, height - 30, 70, 30)
        ctx.font = '12px monospace'
        ctx.font
        ctx.fillStyle = '#000000'
        ctx.fillText(`${round(time, 3)}ms`, 10, height - 12)
    }
}

interface WavyBumpsRow {
    color: string
    strokes: Ribbon[]
}

class AnimatedWavyBumps extends WavyBumps {
    frame = 0
    rows: WavyBumpsRow[] | null = null
    strokes: { color: string; stroke: Ribbon }[] = []
    rowIndex = 0
    strokeIndex = 0
    done = false
    offscreen: HTMLCanvasElement
    offCtx: CanvasRenderingContext2D

    constructor(props: WavyBumpsProps) {
        super(props)

        this.offscreen = document.createElement('canvas')
        this.offscreen.width = this.sizes.width
        this.offscreen.height = this.sizes.height
        this.offCtx = this.offscreen.getContext('2d')!
    }

    getActualRowIndex() {
        if (!this.rows) return 0
        return C.animation.direction === 'up' ? this.rowIndex : this.rows.length - 1 - this.rowIndex
    }

    // setupRows() {
    //     const { palette } = this.seedState
    //     const { height } = this.sizes
    //     const { spacing } = C

    //     const yCount = Math.ceil(height / spacing) + 1
    //     const rows: WavyBumpsRow[] = []
    //     for (let yi = 0; yi < yCount; yi++) {
    //         const color = palette.nextColor().alpha(C.alpha).css()
    //         rows.push({
    //             color,
    //             strokes: [...this.getStrokes(yi * spacing)],
    //         })
    //     }

    //     this.rows = rows
    // }
    getAllStrokes() {
        const { spacing, alpha } = C
        const { palette, rng, noise } = this.seedState
        const { width, height } = this.sizes
        const { bounds, fieldStepX, overlapY, fieldStepY } = this.layout
        const { clumpAmt, jitterRatio, clumpScale, direction, rowStagger } = C.animation

        const jitter = fieldStepX * jitterRatio
        const yCount = Math.ceil(height / spacing) + 1
        const dir = direction === 'up' ? -1 : 1

        const positions: {
            x: number
            y: number
            wavePct: number
            key: number
            color: string
            lineLookup: ReturnType<typeof getLineLookup>
        }[] = []
        for (let yi = 0; yi < yCount; yi++) {
            const rowY = yi * spacing
            const color = palette.nextColor().alpha(alpha).css()
            const points = getBumpsPoints({ ...bounds, bumps: C.bumps, rng })
            const lineLookup = getLineLookup(points, { ...bounds })
            const bottom = -overlapY

            const rowKeySpread = width + C.bumps.highMax + overlapY
            const rowKeyStep = rowKeySpread * rowStagger

            for (let x = -fieldStepX; x < width + fieldStepX * 2; x += fieldStepX) {
                const top = Math.abs(lineLookup(x).y)

                for (let y = top; y > bottom; y -= fieldStepY) {
                    const wavePct = top === 0 ? 0 : Math.max(0, y) / top
                    const drift = noise(x * clumpScale, (y + rowY) * clumpScale)
                    const key =
                        x -
                        y +
                        dir * (yCount - yi) * rowKeyStep +
                        drift * clumpAmt +
                        rng(-jitter, jitter)
                    positions.push({ x, y: y + rowY, wavePct, key, color, lineLookup })
                }
            }
        }

        positions.sort((a, b) => a.key - b.key)

        const strokes: { color: string; stroke: Ribbon }[] = []
        for (const { x, y, wavePct, lineLookup, color } of positions) {
            strokes.push({ color, stroke: this.getStrokeRibbon(x, y, wavePct, lineLookup) })
        }

        this.strokes = strokes
    }

    *getStrokes(rowY: number) {
        const { rng, noise } = this.seedState
        const { width } = this.sizes
        const { bounds, fieldStepX, overlapY, fieldStepY } = this.layout
        const { clumpAmt, jitterRatio, clumpScale } = C.animation
        const points = getBumpsPoints({ ...bounds, bumps: C.bumps, rng })
        const lineLookup = getLineLookup(points, { ...bounds })
        const bottom = -overlapY
        const jitter = fieldStepX * jitterRatio

        const positions: { x: number; y: number; wavePct: number; key: number }[] = []
        for (let x = -fieldStepX; x < width + fieldStepX * 2; x += fieldStepX) {
            const top = Math.abs(lineLookup(x).y)
            for (let y = top; y > bottom; y -= fieldStepY) {
                const wavePct = top === 0 ? 0 : Math.max(0, y) / top
                const drift = noise(x * clumpScale, (y + rowY) * clumpScale)
                const key = x - y + drift * clumpAmt + rng(-jitter, jitter)
                positions.push({ x, y, wavePct, key })
            }
        }

        positions.sort((a, b) => a.key - b.key)

        for (const { x, y, wavePct } of positions) {
            yield this.getStrokeRibbon(x, y + rowY, wavePct, lineLookup)
        }
    }

    buildGui() {
        buildWavyBumpsGui(C, {
            animated: true,
            onRestart: () => {
                this.setup()
                this.reset()
            },
            onNewSeed: () => {
                this.newSeed()
                this.setup()
                this.reset()
            },
        })
    }

    setup() {
        super.setup()
        this.reset()
    }

    reset() {
        // this.setupRows()
        this.getAllStrokes()
        this.restart()
    }

    restart() {
        this.frame = 0
        this.strokeIndex = 0
        this.rowIndex = 0
        this.done = false
        this.offCtx.clearRect(0, 0, this.sizes.width, this.sizes.height)
    }

    incrementStrokes() {
        if (this.done || this.strokes.length === 0) return
        this.strokeIndex++
        if (this.strokeIndex >= this.strokes.length) {
            this.strokeIndex = 0
            this.done = true
        }
    }

    // increment() {
    //     if (!this.rows) return
    //     let newRow = false
    //     this.strokeIndex++
    //     if (this.strokeIndex >= this.rows[this.getActualRowIndex()].strokes.length) {
    //         this.strokeIndex = 0
    //         this.rowIndex++
    //         newRow = true

    //         if (this.rowIndex >= this.rows.length) {
    //             this.rowIndex = 0
    //             this.done = true
    //             newRow = false
    //         }
    //     }
    //     return newRow
    // }

    draw() {
        // if (!this.rows) return
        if (this.done) return

        const { height, width } = this.sizes
        const { ctx, offCtx } = this
        const { direction, strokesPerFrame } = C.animation

        if (this.frame === 0) this.setupCanvas()

        offCtx.save()
        offCtx.translate(0, height / 2)
        offCtx.scale(1, -1)
        offCtx.translate(0, -height / 2)

        if (direction === 'up') offCtx.globalCompositeOperation = 'destination-over'

        let times = 0
        while (times < strokesPerFrame && !this.done) {
            const stroke = this.strokes[this.strokeIndex]
            offCtx.fillStyle = stroke.color
            offCtx.beginPath()
            smoothDrawRibbon(stroke.stroke, offCtx)
            offCtx.fill()

            this.incrementStrokes()
            times++
        }

        // let times = 0
        // let row = this.rows[this.getActualRowIndex()]
        // offCtx.fillStyle = row.color

        // const { strokesPerFrame } = C.animation

        // while (times < strokesPerFrame && !this.done) {
        //     const stroke = row.strokes[this.strokeIndex]

        //     offCtx.beginPath()
        //     smoothDrawRibbon(stroke, offCtx)
        //     offCtx.fill()

        //     const newRow = this.increment()
        //     if (newRow) {
        //         row = this.rows[this.getActualRowIndex()]
        //         offCtx.fillStyle = row.color
        //     }

        //     times++
        // }

        offCtx.restore()

        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = this.seedState.palette.bgColor.css()
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(this.offscreen, 0, 0)

        this.frame++
    }
}

const sizes = { width: 900, height: 900 }
const { ctx } = createCanvas(sizes.width, sizes.height)
const drawing = new AnimatedWavyBumps({ ctx, sizes })
drawing.buildGui()
drawing.setup()
const loop = new FixedFpsLoop(() => drawing.draw())
