import { Recorder } from 'canvas-frames'
import GUI from 'lil-gui'
import { createNoise3D, NoiseFunction3D } from 'simplex-noise'
import createCanvas from '~/helpers/create-canvas'
import easing from '~/helpers/easings'
import loop from '~/helpers/loop'
import { makeRng } from '~/helpers/prng'
import { Vec2 } from '~/helpers/trig-shapes'
import { map, round } from '~/helpers/utils'
import '~/style.css'
import { buildLinePoints, smoothLinePoints } from './build-wavy-lines'
import { getConfig, WavyConfig } from './config'

const PHI = (1 + Math.sqrt(5)) / 2 // 1.618...
const INV_PHI = PHI - 1 // 0.618... (== 1/PHI)

let rng: ReturnType<typeof makeRng>
let noise: NoiseFunction3D

let C: WavyConfig
let gui: GUI | null = null

const layout = {
    marginX: 50,
    marginY: 50,
    aspect: 1,
}

const state = {
    // seed: (Math.random() * 2 ** 32) >>> 0,
    // seed: 3145594983,
    // seed: 2658639953,
    seed: 4208337816,
    // seed: 974856497,
    steps: 0,
    iw: 0,
    ih: 0,
    linesCount: 0,
    offsetY: 0,
}

const sizes = { width: 950, height: 950 }
const { ctx, canvas, resizeCanvas } = createCanvas(sizes.width, sizes.height)
const recorder = new Recorder({ canvas, draw, position: 'bottom-right' })

recorder.on('beforeStart', () => (recorder.fileName = `waves-${state.seed}`))

function initRng(newSeed = false) {
    if (newSeed) state.seed = (Math.random() * 2 ** 32) >>> 0
    console.log('SEED: ', state.seed)
    rng = makeRng(state.seed)
    noise = createNoise3D(rng)
    C = getConfig(rng)
    rebuildLayoutState()
    buildGui()
}

function getLinePeak(samples = 10) {
    let peak = 0
    for (let s = 0; s < samples; s++) {
        const t = (1000 / C.wave.speed) * (s / samples)
        let pts = buildLinePoints({ baseY: 0, time: t, wave: C.wave, noise, steps: state.steps })
        pts = smoothLinePoints(pts, C.smoothing)
        for (const pt of pts) peak = Math.max(peak, -pt.y)
    }
    console.log({ peak })
    return peak
}

function rebuildLayoutState() {
    const { width, height } = sizes
    const { marginX, marginY, aspect } = layout
    const { xStep, spacing } = C.wave

    let iw = width - marginX * 2
    let ih = height - marginY * 2
    if (iw / aspect > ih) {
        iw = ih * aspect
    } else {
        ih = iw / aspect
    }
    state.steps = Math.floor(iw / xStep)
    state.iw = state.steps * xStep

    // note: claude helped with figuring out calculations for these y offsets/margins
    state.offsetY = Math.ceil(getLinePeak() * 0.8)
    state.linesCount = Math.floor((ih - state.offsetY) / spacing) + 1
    state.ih = state.offsetY + (state.linesCount - 1) * spacing
}

// 998611812

function buildGui() {
    if (gui) gui.destroy()
    gui = new GUI()
    gui.add(C, 'style').disable()
    gui.add(state, 'seed')
    gui.add(state, 'offsetY', 0, 200, 1)

    const fl = gui.addFolder('layout')
    fl.add(layout, 'aspect', 0.2, 3, 0.1)
    fl.add(layout, 'marginX', 0, 200, 1)
    fl.add(layout, 'marginY', 0, 200, 1)
    fl.onChange(() => rebuildLayoutState())

    const fw = gui.addFolder('wave')
    fw.add(C.wave, 'xStep', 1, 200, 1).onChange(rebuildLayoutState)
    fw.add(C.wave, 'spacing', 1, 150, 1).onChange(rebuildLayoutState)
    fw.add(C.wave, 'amp', 0, 400, 1)
    fw.add(C.wave, 'speed', 0, 2, 0.01)
    fw.add(C.wave, 'freqX', 0, 0.05, 0.0001)
    fw.add(C.wave, 'freqY', 0, 0.01, 0.0001)
    fw.add(C.wave, 'taper', 0, 1, 0.1)
    fw.add(C.wave, 'ease', Object.keys(easing))

    const fs = gui.addFolder('smoothing').onChange(rebuildLayoutState)
    fs.add(C.smoothing, 'times', 0, 12, 1)
    fs.add(C.smoothing, 'strength', 0, 1, 0.1)
    fs.add(C.smoothing, 'taubin')
    fs.add(C.smoothing, 'taubinAmt', 1, 1.5, 0.01)

    const fd = gui.addFolder('draw')
    fd.add(C.draw, 'lineWidth', 1, 20, 1)

    gui.add({ newSeed: () => initRng(true) }, 'newSeed')
    gui.add({ reset: () => initRng(false) }, 'reset')
}

function midpoint(a: Vec2, b: Vec2) {
    return a.copy().add(b).div(2)
}

function smoothDraw(pts: Vec2[], debug = false, baseY?: number) {
    ctx.beginPath()
    for (let i = 0; i < pts.length - 1; i++) {
        const cur = pts[i]
        const next = pts[i + 1]
        const mid = midpoint(cur, next)
        if (i === 0) {
            ctx.moveTo(mid.x, mid.y)
        } else {
            ctx.quadraticCurveTo(cur.x, cur.y, mid.x, mid.y)
        }
    }
    ctx.stroke()

    if (debug) {
        ctx.save()
        pts.forEach((pt) => {
            ctx.fillStyle = '#91e0f3'
            ctx.beginPath()
            ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = '#121212'
            const y = baseY ? pt.y - baseY : pt.y
            ctx.fillText(`${round(y)}`, pt.x, pt.y + 10)
        })
        ctx.restore()
    }
}

function setBaseDrawing(drawRect = false) {
    const { width, height } = sizes
    const { palette } = C.draw
    const { iw, ih, offsetY } = state

    ctx.fillStyle = palette.bg

    ctx.fillRect(0, 0, width, height)
    ctx.translate((width - iw) / 2, (height - ih) / 2)

    if (drawRect) ctx.strokeRect(0, 0, iw, ih)
    ctx.translate(0, offsetY)
}

function debug(method: 'smooth' | 'flat') {
    const { amp, ease, taper, xStep, spacing } = C.wave
    const { steps, linesCount } = state

    ctx.save()
    setBaseDrawing(true)

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    if (method === 'smooth') {
        ctx.translate(-xStep / 2, 0)
    } else {
        ctx.translate(xStep / 2, 0)
    }

    let start = method === 'smooth' ? 0 : -1
    let end = method === 'smooth' ? steps + 1 : steps

    for (let i = 0; i < linesCount; i++) {
        const baseY = i * spacing
        const pts: Vec2[] = []

        for (let xi = start; xi <= end; xi++) {
            const x = xStep * xi
            const p = method === 'smooth' ? xi / (steps + 1) : xi / (steps - 1)
            let amt = 1
            if (taper > 0) {
                amt = p < 0 || p > 1 ? 0 : p > 0.5 ? 1 - (p - 0.5) * 2 : p * 2
                amt = easing[ease](amt)
                amt = map(amt, 0, 1, 1 - taper, 1)
            }
            const y = baseY - 1 * amt * amp
            pts.push(new Vec2(x, y))
        }

        smoothDraw(pts, true, baseY)
    }

    ctx.restore()
    if (method === 'smooth') {
        ctx.fillText('method 1: start at midpoints, smooth curve but ends are not 0', 10, 20)
    } else {
        ctx.fillText(
            'method 2: add extra points to get flat midpoints on the end, but flattens out the end bit of the curve',
            10,
            20,
        )
    }
}

function draw(t: number) {
    const { xStep, spacing } = C.wave
    const { lineWidth, palette } = C.draw
    const { linesCount, steps } = state

    ctx.save()
    setBaseDrawing()

    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.translate(-xStep / 2, 0)

    for (let i = 0; i < linesCount; i++) {
        const baseY = i * spacing
        let pts = buildLinePoints({ baseY, time: t, wave: C.wave, noise, steps: state.steps })
        pts = smoothLinePoints(pts, C.smoothing)

        const ind = Math.floor(((i * INV_PHI) % 1) * palette.colors.length)
        ctx.strokeStyle = palette.colors[ind]
        smoothDraw(pts)

        // ctx.fillStyle = palette.colors[ind]
        // ctx.fillText(`${baseY}`, 0, baseY - 10)
        // const minPt = Math.min(...pts.map(({ y }) => y))
        // ctx.fillText(`${round(minPt, 0)}`, -20, baseY - 10)
    }

    ctx.restore()
}

initRng()
loop(draw)
