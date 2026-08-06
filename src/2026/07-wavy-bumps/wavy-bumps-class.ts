import chroma from 'chroma-js'
import { createNoise2D, NoiseFunction2D } from 'simplex-noise'
import createCanvas from '~/helpers/create-canvas'
import { makeRng, Rng } from '~/helpers/prng'
import { map, round } from '~/helpers/utils'
import '~/style.css'
import { getLineLookup, makeStroke } from './bumps-strokes'
import { C, WavyBumpsConfig } from './config'
import { getBumpsPoints } from './get-bumps'
import { buildWavyBumpsGui } from './gui'
import { getRibbon, smoothDrawRibbon } from './bumps-ribbon'

type Sizes = { width: number; height: number }

type BumpsPalette = {
    c1: chroma.Color
    c2: chroma.Color
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

    return {
        c1,
        c2,
        lessSaturated,
        reset() {
            mixAmt = rng(0, 1)
        },
        nextColor() {
            const c = chroma
                .mix(c1, c2, mixAmt, 'oklch')
                .set('oklch.c', lessSaturated ? `*${rng(0.8, 1.8)}` : `*${rng(1.2, 2)}`)
            mixAmt = (mixAmt + rng(0.5, 0.75)) % 1
            return c
        },
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

class WavyBumps {
    private seed = 395055755
    private seedState: BumpsSeedState
    private layout: BumpsLayout

    constructor(
        private ctx: CanvasRenderingContext2D,
        private sizes: Sizes,
    ) {
        this.seedState = makeSeedState(this.seed)
        this.layout = makeLayout(sizes.width, C)
    }

    init() {
        buildWavyBumpsGui(C, {
            onChange: () => {
                this.setup()
                this.draw()
            },
            onNewSeed: () => this.newSeed(),
        })

        this.draw()
    }

    newSeed() {
        this.seed = (Math.random() * 2 ** 32) >>> 0
        this.setup()
        this.draw()
    }

    private setup() {
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

    drawCol(x: number, rowY: number, lineLookup: ReturnType<typeof getLineLookup>) {
        const colItems = this.getCol(x, rowY, lineLookup)

        colItems.forEach((item) => {
            ctx.beginPath()
            smoothDrawRibbon(item, ctx)
            ctx.fill()
        })
    }

    getCol(x: number, rowY: number, lineLookup: ReturnType<typeof getLineLookup>) {
        const { overlapY, fieldStepY } = this.layout
        const top = Math.abs(lineLookup(x).y)
        const bottom = -overlapY

        const items: ReturnType<typeof getRibbon>[] = []

        // start at the top so there's always a line at the peak
        for (let y = top; y > bottom; y -= fieldStepY) {
            const wavePct = top === 0 ? 0 : Math.max(0, y) / top
            const ribbon = this.getStrokeRibbon(x, y + rowY, wavePct, lineLookup)
            items.push(ribbon)
        }

        return items
    }

    getRow(rowY: number) {
        const { width } = this.sizes
        const { bounds, fieldStepX } = this.layout
        const points = getBumpsPoints({ ...bounds, bumps: C.bumps, rng: this.seedState.rng })
        const lineLookup = getLineLookup(points, { ...bounds })

        const row: ReturnType<InstanceType<typeof WavyBumps>['getCol']>[] = []

        for (let x = -fieldStepX; x < width + fieldStepX * 2; x += fieldStepX) {
            row.push(this.getCol(x, rowY, lineLookup))
        }

        return row
    }

    drawRow(rowY: number) {
        const { width } = this.sizes
        const { bounds, fieldStepX } = this.layout
        const points = getBumpsPoints({ ...bounds, bumps: C.bumps, rng: this.seedState.rng })
        const lineLookup = getLineLookup(points, { ...bounds })

        for (let x = -fieldStepX; x < width + fieldStepX * 2; x += fieldStepX) {
            this.drawCol(x, rowY, lineLookup)
        }
    }

    draw() {
        const startTime = performance.now()

        const { ctx, sizes } = this
        const { palette } = this.seedState
        const { width, height } = sizes
        const { spacing } = C

        ctx.save()
        ctx.clearRect(0, 0, width, height)

        ctx.fillStyle = palette.nextColor().set('oklch.l', '0.9').css()
        ctx.fillRect(0, 0, width, height)

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

const sizes = { width: 900, height: 900 }
const { ctx } = createCanvas(sizes.width, sizes.height)
new WavyBumps(ctx, sizes).init()
