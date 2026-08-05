import chroma from 'chroma-js'
import { createNoise2D, NoiseFunction2D } from 'simplex-noise'
import createCanvas from '~/helpers/create-canvas'
import { GuiExtra } from '~/helpers/gui/lilgui-extra'
import { makeRng, Rng } from '~/helpers/prng'
import { Vec2 } from '~/helpers/trig-shapes'
import { clamp, lerp, map, randomInt, round } from '~/helpers/utils'
import '~/style.css'
import { getRibbon, smoothDrawRibbon } from './ribbon-wavy-noise'

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

const C = {
    bumps: {
        peakSampleN: 10,
        highMin: 90,
        highMax: 150,
        lowMin: 30,
        lowMax: 50,
        peakMin: 2,
        peakMax: 5,
    },

    wave: {
        peakWidth: 150,
        chaikinTimes: 4,
    },
    strokes: {
        density: { x: 7, y: 10 },
        noiseScale: { x: 0.156, y: 0.076 },
        moveAmtBot: { x: 28, y: 12 },
        moveAmtTop: { x: 0, y: 0 },
        useNoise: true,
        steps: 4,
        stepLen: 10,
        blendAngleAmt: 1,
        flattenAngle: 0,
    },
    strokeRibbon: {
        width: 10,
        taper: 0.4,
        taperLen: 25,
        useCurves: true,
        // noiseUnit: 80,
        // noiseJitter: 0.17,
        // overlaps: 1,
        // overlapOffset: 3,
    },
    fill: 'each' as 'column' | 'row' | 'each',
    spacing: 100,
    alpha: 0.3,
}

window.chroma = chroma

function buildGui() {
    const gui = new GuiExtra()
    gui.add(C, 'spacing', 5, 300, 1)
    gui.add(C, 'alpha', 0, 1, 0.01)
    gui.add(C, 'fill', ['row', 'column', 'each'])
    gui.add(
        {
            newSeed: () => {
                initRng(true)
                draw()
            },
        },
        'newSeed',
    )

    const bf = gui.addFolder('bumps').close()
    bf.add(C.bumps, 'lowMin', 0, 300, 1)
    bf.add(C.bumps, 'lowMax', 0, 300, 1)
    bf.add(C.bumps, 'highMin', 0, 500, 1)
    bf.add(C.bumps, 'highMax', 0, 500, 1)
    bf.add(C.bumps, 'peakMin', 0, 20, 1)
    bf.add(C.bumps, 'peakMax', 0, 20, 1)
    bf.add(C.bumps, 'peakSampleN', 1, 40, 1)

    const wf = gui.addFolder('waves').close()
    wf.add(C.wave, 'peakWidth', 0, 300, 1)
    wf.add(C.wave, 'chaikinTimes', 0, 6, 1)

    const sf = gui.addFolder('strokes').close()
    sf.add(C.strokes, 'stepLen', 1, 100, 1)
    sf.add(C.strokes, 'steps', 1, 20, 1)
    sf.addVec2(C.strokes, 'density', 1, 200, 1)
    sf.addVec2(C.strokes, 'moveAmtTop', 0, 100, 1)
    sf.addVec2(C.strokes, 'moveAmtBot', 0, 100, 1)
    sf.add(C.strokes, 'useNoise')
    sf.addVec2(C.strokes, 'noiseScale', 0, 0.4, 0.001)
    sf.add(C.strokes, 'flattenAngle', 0, 1, 0.01)
    sf.add(C.strokes, 'blendAngleAmt', 0, 1, 0.01)

    const rf = gui.addFolder('stroke ribbons').close()
    rf.add(C.strokeRibbon, 'width', 1, 20, 1)
    rf.add(C.strokeRibbon, 'taper', 0, 1, 0.1)
    rf.add(C.strokeRibbon, 'taperLen', 0, 100, 1)
    rf.add(C.strokeRibbon, 'useCurves')
    // rf.add(C.strokeRibbon, 'noiseJitter', 0, 2, 0.01)
    // rf.add(C.strokeRibbon, 'noiseUnit', 0, 200, 1)
    // rf.add(C.strokeRibbon, 'overlaps', 1, 10, 1)
    // rf.add(C.strokeRibbon, 'overlapOffset', 0, 100, 0.01)

    gui.onChange(() => {
        initRng()
        draw()
    })
}

function setup() {
    initRng()
    const { peakWidth } = C.wave
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

function randomSample1d(count: number, min: number, max: number, n: number) {
    const results: number[] = []

    while (results.length < count) {
        // generate n random candidates between min and max

        let candidates: number[] = []
        for (let i = 0; i < n; i++) {
            candidates.push(rng(min, max))
        }
        // for each candidate, find the distance between it and existing results
        // take the closest distance
        // select the candidate with the largest closest distance and add to results
        candidates = candidates.sort((a, b) => {
            let closestA = Infinity
            let closestB = Infinity
            results.forEach((r) => {
                closestA = Math.min(closestA, Math.abs(r - a))
                closestB = Math.min(closestB, Math.abs(r - b))
            })
            return closestB - closestA
        })
        results.push(candidates[0])
    }

    return results
}

function chaikinSmooth(pts: { x: number; y: number }[], times: number) {
    let prev: { x: number; y: number }[] = pts

    for (let t = 0; t < times; t++) {
        let next: { x: number; y: number }[] = []
        for (let i = 0; i < prev.length - 1; i++) {
            const a = prev[i]
            const b = prev[i + 1]

            next.push(
                {
                    x: a.x * 0.75 + b.x * 0.25,
                    y: a.y * 0.75 + b.y * 0.25,
                },
                {
                    x: a.x * 0.25 + b.x * 0.75,
                    y: a.y * 0.25 + b.y * 0.75,
                },
            )
        }
        prev = next
    }

    return prev
}

interface GetBumpsPointsParams {
    xStart: number
    xEnd: number
    peakXStart: number
    peakXEnd: number
}
function getBumpsPoints({ xStart, xEnd, peakXStart, peakXEnd }: GetBumpsPointsParams) {
    const peaksCount = randomInt(C.bumps.peakMin, C.bumps.peakMax, rng)
    const peaks = randomSample1d(peaksCount, peakXStart, peakXEnd, C.bumps.peakSampleN)
        .sort((a, b) => a - b)
        .map((x) => ({ x, y: rng(C.bumps.highMin, C.bumps.highMax) }))

    let points: { x: number; y: number }[] = []
    points.push({ x: xStart, y: 0 })
    points.push({ x: xStart, y: 0 })

    let addLeft = true

    const { peakWidth, chaikinTimes } = C.wave

    for (let i = 0; i < peaks.length; i++) {
        let cur = peaks[i]

        if (addLeft) {
            let leftX = cur.x - peakWidth
            if (i !== 0) {
                let prev = peaks[i - 1]
                let mid = (cur.x + prev.x) / 2
                leftX = Math.max(mid, cur.x - peakWidth)
            }
            leftX = Math.max(xStart, leftX)
            points.push({ x: leftX, y: rng(C.bumps.lowMin, C.bumps.lowMax) })
        }
        points.push({ ...cur })

        let rightX = cur.x + peakWidth
        if (i !== peaks.length - 1) {
            let next = peaks[i + 1]
            let mid = (cur.x + next.x) / 2
            if (mid < cur.x + peakWidth * 1.25) {
                rightX = mid
                addLeft = false // don't add a point to the left of the next one if they would be close/the same
            } else {
                rightX = cur.x + peakWidth
                addLeft = true
            }
        }
        rightX = Math.min(rightX, xEnd)
        points.push({ x: rightX, y: rng(C.bumps.lowMin, C.bumps.lowMax) })
    }

    points.push({ x: xEnd, y: 0 })
    points.push({ x: xEnd, y: 0 })

    if (chaikinTimes > 0) points = chaikinSmooth(points, chaikinTimes)

    return points
}

interface LineData {
    y: number
    x: number
    dirX: number
    dirY: number
}

function calcLineData(pts: { x: number; y: number }[]) {
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

    return function sampleAt(x: number) {
        const i = clamp((x - xStart) | 0, 0, lookupLen - 2)
        const p = clamp(x - xStart - i, 0, 1)
        const y = lerp(lookupY[i], lookupY[i + 1], p)
        const dirX = lerp(lookupDirX[i], lookupDirX[i + 1], p)
        const dirY = lerp(lookupDirY[i], lookupDirY[i + 1], p)
        return { x, y, dirX, dirY }
    }

    // return {
    //     data,
    //     sampleAt: (x: number) => {

    //     },
    // }
}

interface MakeStrokeParams {
    sampleLine: ReturnType<typeof calcLineData>
    x: number
    y: number
    steps?: number
    stepLen?: number
}

function makeStroke({ sampleLine, x, y, steps = 4, stepLen = 10 }: MakeStrokeParams) {
    const mainData = sampleLine(x)
    const mainHeading = Math.atan2(mainData.dirY, mainData.dirX)
    const { flattenAngle, blendAngleAmt } = C.strokes

    const start = { x, y }
    const pts: Vec2[] = []
    pts[steps] = new Vec2(x, y)
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
        const nextData = sampleLine(next.x)
        prevDirX = lerp(prevDirX, nextData.dirX, blendAngleAmt)
        prevDirY = lerp(prevDirY, nextData.dirY, blendAngleAmt)
        const nextHeading = Math.atan2(prevDirY, prevDirX)
        curHeading = headingVal(dist, nextHeading)
        pts[i] = new Vec2(next.x, next.y)
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
    const points = getBumpsPoints({ xStart, xEnd, peakXStart, peakXEnd })
    const line = calcLineData(points)

    const { noiseScale, moveAmtTop, moveAmtBot, density } = C.strokes
    const ySpace = 100 / density.y
    const xSpace = 100 / density.x
    const yStep = ySpace
    const baseYSteps = Math.ceil((C.spacing + (C.spacing - C.bumps.lowMin)) / ySpace)
    ctx.save()
    ctx.translate(0, baseY)
    if (C.fill === 'row') ctx.beginPath()
    for (let x = -xSpace; x < width + xSpace * 2; x += xSpace) {
        const data = line(x)
        const ySteps = Math.ceil(Math.abs(data.y) / yStep)

        if (C.fill === 'column') ctx.beginPath()
        for (let yi = -baseYSteps; yi < ySteps; yi++) {
            let y = yi * yStep
            let xVal = x
            let yVal = y
            let dist = ySteps === 0 ? 0 : Math.max(0, yi) / ySteps
            let noiseAmtX = map(dist, 0, 1, moveAmtBot.x, moveAmtTop.x)
            let noiseAmtY = map(dist, 0, 1, moveAmtBot.y, moveAmtTop.y)
            if (C.strokes.useNoise) {
                // let angle = noise(x * noiseScale.x, y * noiseScale.y) * Math.PI * 2
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
                sampleLine: line,
                x: xVal,
                y: yVal,
                // steps: randomInt(4, 6, rng),
                steps: C.strokes.steps,
                stepLen: C.strokes.stepLen,
            })

            const { width, taper, taperLen } = C.strokeRibbon

            let taperType: 'start' | 'end' = rng() < 0.5 ? 'start' : 'end'
            const ribbon = getRibbon(pts, { width, taper, taperType, taperLen })
            if (C.fill === 'each') ctx.beginPath()
            smoothDrawRibbon(ribbon, ctx, C.strokeRibbon.useCurves)
            if (C.fill === 'each') ctx.fill()
        }
        if (C.fill === 'column') ctx.fill()
    }
    if (C.fill === 'row') ctx.fill()

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
        // c = c.set('oklch.c', Math.max(0.12, c.get('oklch.c') * rng(0.9, 1.5)))
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
buildGui()
// const loop = new FixedFpsLoop(draw, { fps: 1 })
draw()
