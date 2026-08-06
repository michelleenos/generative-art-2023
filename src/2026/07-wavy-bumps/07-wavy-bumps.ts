import chroma from 'chroma-js'
import { createNoise2D, NoiseFunction2D } from 'simplex-noise'
import createCanvas from '~/helpers/create-canvas'
import { makeRng, Rng } from '~/helpers/prng'
import { map, round } from '~/helpers/utils'
import '~/style.css'
import { getLineLookup, makeStroke } from './bumps-strokes'
import { C } from './config'
import { getBumpsPoints } from './get-bumps'
import { buildWavyBumpsGui } from './gui'
import { getRibbon, smoothDrawRibbon } from './bumps-ribbon'

// const PHI = (1 + Math.sqrt(5)) / 2 // 1.618...
// const INV_PHI = PHI - 1 // 0.618... (== 1/PHI)

const state = {
    // seed: (Math.random() * 2 ** 32) >>> 0,
    seed: 395055755,
    c1: null! as chroma.Color,
    c2: null! as chroma.Color,
    lessSaturated: false,
    xStart: 0,
    xEnd: 0,
    peakXStart: 0,
    peakXEnd: 0,
}
let rng: Rng
let noise: NoiseFunction2D
const sizes = { width: 900, height: 900 }
const { ctx } = createCanvas(sizes.width, sizes.height)

buildWavyBumpsGui(C, {
    onChange: () => {
        setup()
        draw()
    },
    onNewSeed: () => {
        initRng(true)
        draw()
    },
})

function setup() {
    initRng()
    const { peakWidth } = C.bumps
    const { width } = sizes
    state.xStart = -peakWidth
    state.xEnd = width + peakWidth
    state.peakXStart = Math.trunc(-peakWidth * 0.5)
    state.peakXEnd = Math.trunc(width + peakWidth * 0.5)
}

function initRng(newSeed = false) {
    if (newSeed) state.seed = (Math.random() * 2 ** 32) >>> 0
    console.log('SEED: ', state.seed)
    rng = makeRng(state.seed)
    noise = createNoise2D(rng)
    // const hue = rng() > 0.5 ? rng(170, 230) : rng(290, 340)
    const hue = rng(170, 330)

    state.c1 = chroma([0.25, 0.12, hue], 'oklch')
    state.c2 = chroma(state.c1)
        .set('oklch.h', `+${rng(100, 200)}`)
        .set('oklch.l', `+0.5`)
    state.lessSaturated = rng() < 0.3
}

function drawOne(baseY: number) {
    const { width } = sizes
    const { xStart, xEnd, peakXStart, peakXEnd } = state
    const points = getBumpsPoints({ xStart, xEnd, peakXStart, peakXEnd, bumps: C.bumps, rng })
    const lineLookup = getLineLookup(points, { xStart, xEnd })

    const { noiseScale, moveAmtTop, moveAmtBot, density } = C.strokes
    const ySpace = 100 / density.y
    const xSpace = 100 / density.x
    const yStep = ySpace
    const baseYSteps = Math.ceil((C.spacing + (C.spacing - C.bumps.lowMin)) / ySpace)
    ctx.save()
    ctx.translate(0, baseY)
    for (let x = -xSpace; x < width + xSpace * 2; x += xSpace) {
        const data = lineLookup(x)
        const ySteps = Math.ceil(Math.abs(data.y) / yStep)

        for (let yi = -baseYSteps; yi < ySteps; yi++) {
            let y = yi * yStep
            let xVal = x
            let yVal = y
            let dist = ySteps === 0 ? 0 : Math.max(0, yi) / ySteps
            let noiseAmtX = map(dist, 0, 1, moveAmtBot.x, moveAmtTop.x)
            let noiseAmtY = map(dist, 0, 1, moveAmtBot.y, moveAmtTop.y)
            let nx = noise(x * noiseScale.x, y * noiseScale.y)
            let ny = noise(x * noiseScale.x + 123, y * noiseScale.y + 123)
            let angle = Math.atan2(ny, nx)
            let nr = noise(x * noiseScale.x + 245, y * noiseScale.y + 245)
            xVal += Math.cos(angle) * noiseAmtX * nr
            yVal += Math.sin(angle) * noiseAmtY * nr

            // if (Number.isNaN(xVal) || Number.isNaN(yVal)) debugger

            const pts = makeStroke({
                lineLookup,
                x: xVal,
                y: yVal,
                config: C.strokeItem,
            })

            const { width, taper, taperLen } = C.strokeRibbon

            let taperType: 'start' | 'end' = rng() < 0.5 ? 'start' : 'end'
            const ribbon = getRibbon(pts, { width, taper, taperType, taperLen })
            ctx.beginPath()
            smoothDrawRibbon(ribbon, ctx)
            ctx.fill()
        }
    }

    ctx.restore()
}

function draw() {
    const startTime = performance.now()
    const { width, height } = sizes
    const { spacing } = C

    ctx.save()
    ctx.clearRect(0, 0, width, height)

    let mixAmt = rng(0, 1)

    const newColor = () => {
        let c = chroma
            .mix(state.c1, state.c2, mixAmt, 'oklch')
            .set('oklch.c', state.lessSaturated ? `*${rng(0.8, 1.8)}` : `*${rng(1.2, 2)}`)
        mixAmt = (mixAmt + rng(0.5, 0.75)) % 1
        return c
    }
    const bgColor = newColor().css()
    // mixAmt = mixAmt + rng(0.4, 0.8)
    mixAmt %= 1
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)

    ctx.translate(0, height / 2)
    ctx.scale(1, -1)
    ctx.translate(0, -height / 2)

    const yCount = Math.ceil(height / spacing) + 1
    for (let yi = yCount - 1; yi >= 0; yi--) {
        const y = yi * spacing

        const color = newColor().alpha(C.alpha).css()

        ctx.fillStyle = color

        drawOne(y)
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

setup()
// const loop = new FixedFpsLoop(draw, { fps: 1 })
draw()
