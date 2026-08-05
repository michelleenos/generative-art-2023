import chroma from 'chroma-js'
import { createNoise2D, NoiseFunction2D } from 'simplex-noise'
import createCanvas from '~/helpers/create-canvas'
import { makeRng, Rng } from '~/helpers/prng'
import { clamp, lerp, map, randomInt, round } from '~/helpers/utils'
import '~/style.css'
import { getRibbon, smoothDrawRibbon } from './ribbon-wavy-noise'
import { C } from './config'
import { buildWavyBumpsGui } from './gui'
import { getBumpsPoints } from './get-bumps'

// const PHI = (1 + Math.sqrt(5)) / 2 // 1.618...
// const INV_PHI = PHI - 1 // 0.618... (== 1/PHI)

const state = {
    // seed: (Math.random() * 2 ** 32) >>> 0,
    seed: 395055755,
}
let rng: Rng
let noise: NoiseFunction2D
let c1: chroma.Color
let c2: chroma.Color
let dullColors: boolean
let xStart: number
let xEnd: number
let peakXStart: number
let peakXEnd: number
const sizes = { width: 900, height: 900 }
const { ctx, resizeCanvas, canvas } = createCanvas(sizes.width, sizes.height)

buildWavyBumpsGui(C, {
    onChange: () => {
        initRng()
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
    xStart = -peakWidth
    xEnd = width + peakWidth
    peakXStart = Math.trunc(-peakWidth * 0.5)
    peakXEnd = Math.trunc(width + peakWidth * 0.5)
}

function initRng(newSeed = false) {
    if (newSeed) state.seed = (Math.random() * 2 ** 32) >>> 0
    console.log('SEED: ', state.seed)
    rng = makeRng(state.seed)
    noise = createNoise2D(rng)
    // const hue = rng() > 0.5 ? rng(170, 230) : rng(290, 340)
    const hue = rng(170, 330)

    c1 = chroma([0.25, 0.12, hue], 'oklch')
    c2 = chroma(c1)
        .set('oklch.h', `+${rng(100, 200)}`)
        .set('oklch.l', `+0.5`)
    dullColors = false
}

interface LineData {
    y: number
    x: number
    dirX: number
    dirY: number
}

function getLineLookup(pts: { x: number; y: number }[]) {
    const len = pts.length

    const data: LineData[] = pts.map((pt, i) => {
        const a = pts[Math.max(0, i - 1)]
        const b = pts[Math.min(len - 1, i + 1)]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const mag = Math.sqrt(dx ** 2 + dy ** 2)
        return { y: pt.y, x: pt.x, dirX: mag === 0 ? 1 : dx / mag, dirY: mag === 0 ? 0 : dy / mag }
    })

    const lookupLen = xEnd - xStart + 1
    const lookupY = new Float32Array(lookupLen)
    const lookupDirY = new Float32Array(lookupLen)
    const lookupDirX = new Float32Array(lookupLen)

    let curIndex = 0
    for (let i = 0; i < lookupLen; i++) {
        const wx = xStart + i
        let prev = data[curIndex]
        let next = data[curIndex + 1]
        while (curIndex < data.length - 1 && wx > next.x) {
            curIndex++
            prev = data[curIndex]
            next = data[curIndex + 1]
        }
        if (!next) {
            lookupY[i] = prev.y
            lookupDirX[i] = prev.dirX
            lookupDirY[i] = prev.dirY
        } else {
            const dx = next.x - prev.x
            const amt = dx === 0 ? 0 : clamp((wx - prev.x) / dx, 0, 1)
            const y = prev.y + (next.y - prev.y) * amt
            lookupY[i] = y
            lookupDirX[i] = lerp(prev.dirX, next.dirX, amt)
            lookupDirY[i] = lerp(prev.dirY, next.dirY, amt)
        }
    }

    return function (x: number, out: LineData) {
        const i = clamp((x - xStart) | 0, 0, lookupLen - 2)
        const p = clamp(x - xStart - i, 0, 1)
        out.x = x
        out.y = lerp(lookupY[i], lookupY[i + 1], p)
        out.dirX = lerp(lookupDirX[i], lookupDirX[i + 1], p)
        out.dirY = lerp(lookupDirY[i], lookupDirY[i + 1], p)
        return out
    }
}

interface MakeStrokeParams {
    lineLookup: ReturnType<typeof getLineLookup>
    x: number
    y: number
    steps?: number
    stepLen?: number
}

const lineData: LineData = { x: 0, y: 0, dirX: 0, dirY: 0 }

function makeStroke({ lineLookup, x, y, steps = 4, stepLen = 10 }: MakeStrokeParams) {
    lineLookup(x, lineData)
    const mainData = { ...lineData }
    const mainHeading = Math.atan2(lineData.dirY, lineData.dirX)
    const { flattenAngle, blendAngleAmt } = C.strokes

    const start = { x, y }
    const pts: { x: number; y: number }[] = []
    pts[steps] = { x, y }
    let prev = start
    let prevDirX = mainData.dirX
    let prevDirY = mainData.dirY
    const dist = y / mainData.y

    const headingVal = (dist: number, heading: number) => {
        return flattenAngle === 0
            ? heading
            : map(clamp(dist, 0, 1), 0, 1, heading * (1 - flattenAngle), heading)
    }
    let curHeading = headingVal(dist, mainHeading)

    const getPoint = (i: number, dir = 1) => {
        const next = {
            x: prev.x + Math.cos(curHeading) * (stepLen * dir),
            y: prev.y + Math.sin(curHeading) * (stepLen * dir),
        }
        const nextData = lineLookup(next.x, lineData)
        prevDirX = lerp(prevDirX, nextData.dirX, blendAngleAmt)
        prevDirY = lerp(prevDirY, nextData.dirY, blendAngleAmt)
        const nextHeading = Math.atan2(prevDirY, prevDirX)
        curHeading = headingVal(dist, nextHeading)
        pts[i] = next
        prev = next
    }

    for (let i = steps - 1; i >= 0; i--) {
        getPoint(i, -1)
    }

    prev = start
    prevDirX = mainData.dirX
    prevDirY = mainData.dirY
    curHeading = headingVal(dist, mainHeading)
    for (let i = steps + 1; i < steps * 2; i++) {
        getPoint(i, 1)
    }

    return pts
}

function drawOne(baseY: number) {
    const { width } = sizes
    const points = getBumpsPoints({ xStart, xEnd, peakXStart, peakXEnd, bumps: C.bumps, rng })
    const lineLookup = getLineLookup(points)

    const { noiseScale, moveAmtTop, moveAmtBot, density } = C.strokes
    const ySpace = 100 / density.y
    const xSpace = 100 / density.x
    const yStep = ySpace
    const baseYSteps = Math.ceil((C.spacing + (C.spacing - C.bumps.lowMin)) / ySpace)
    ctx.save()
    ctx.translate(0, baseY)
    for (let x = -xSpace; x < width + xSpace * 2; x += xSpace) {
        const data = lineLookup(x, lineData)
        const ySteps = Math.ceil(Math.abs(data.y) / yStep)

        for (let yi = -baseYSteps; yi < ySteps; yi++) {
            let y = yi * yStep
            let xVal = x
            let yVal = y
            let dist = ySteps === 0 ? 0 : Math.max(0, yi) / ySteps
            let noiseAmtX = map(dist, 0, 1, moveAmtBot.x, moveAmtTop.x)
            let noiseAmtY = map(dist, 0, 1, moveAmtBot.y, moveAmtTop.y)
            if (C.strokes.useNoise) {
                let nx = noise(x * noiseScale.x, y * noiseScale.y)
                let ny = noise(x * noiseScale.x + 123, y * noiseScale.y + 123)
                let angle = Math.atan2(ny, nx)
                let nr = noise(x * noiseScale.x + 245, y * noiseScale.y + 245)
                xVal += Math.cos(angle) * noiseAmtX * nr
                yVal += Math.sin(angle) * noiseAmtY * nr
            } else {
                xVal += rng(-noiseAmtX, noiseAmtX)
                yVal += rng(-noiseAmtY, noiseAmtY)
            }

            // if (Number.isNaN(xVal) || Number.isNaN(yVal)) debugger

            const pts = makeStroke({
                lineLookup,
                x: xVal,
                y: yVal,
                steps: C.strokes.steps,
                stepLen: C.strokes.stepLen,
            })

            const { width, taper, taperLen } = C.strokeRibbon

            let taperType: 'start' | 'end' = rng() < 0.5 ? 'start' : 'end'
            const ribbon = getRibbon(pts, { width, taper, taperType, taperLen })
            ctx.beginPath()
            smoothDrawRibbon(ribbon, ctx, C.strokeRibbon.useCurves)
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
            .mix(c1, c2, mixAmt, 'oklch')
            .set('oklch.c', dullColors ? `*${rng(0.8, 1.8)}` : `*${rng(1.2, 2)}`)
        mixAmt = (mixAmt + rng(0.5, 0.75)) % 1
        return c
    }
    const bgColor = newColor().css()
    mixAmt = mixAmt + rng(0.4, 0.8)
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
