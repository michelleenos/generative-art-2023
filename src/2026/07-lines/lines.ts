import { getPaletteVariants, PaletteVariant } from 'mish-bainrow'
import { createNoise2D, NoiseFunction2D } from 'simplex-noise'
import GUI from 'lil-gui'
import createCanvas from '~/helpers/create-canvas'
import { makeRng } from '~/helpers/prng'
import { Sizes } from '~/helpers/sizes'
import { Vec2 } from '~/helpers/trig-shapes'
import { makePalettesGui } from '~/helpers/gui-palettes'
import { saveCanvasImage } from '~/helpers/canvas-save-image'
import '~/style.css'
import { C } from './config'
import { pickColors } from './color'
import { buildSilhouette } from './silhouette'
import { generateStrokes, strokeToPoints, Stroke } from './strokes'
import { getRibbon, RibbonParams } from './ribbon'

// To animate later, import `loop` and drive draw(t) with it — the silhouette
// and brush strokes already accept `t` (see silhouette.ts / draw()).

// ---------------------------------------------------------------------------
// state
// ---------------------------------------------------------------------------

let seed = (Math.random() * 2 ** 32) >>> 0
let rng: ReturnType<typeof makeRng>
let noise: NoiseFunction2D
let palette: PaletteVariant

// derived geometry, recomputed in setup()
let steps: number
let iw: number
let ih: number

// the static model: which strokes exist per line. Rebuilt only in setup().
type LineModel = { baseY: number; color: string; strokes: Stroke[] }
let lines: LineModel[] = []

const paletteOpts = getPaletteVariants(
    [
        'bubbles-2',
        'dust-0',
        'untitledApril15-0',
        'squiggles-0',
        'valen-4',
        'autmn-3',
        'dust-2',
        'ember-0',
        'natura-2',
    ],
    { isolateColors: true, useStroke: false },
)

palette = paletteOpts[6]

// seed = 729098741
// seed = 844516114
// seed = 2164242208
console.log('SEED ', seed)

const sizes = new Sizes()
const { ctx, resizeCanvas, canvas } = createCanvas(sizes.width, sizes.height)
sizes.on('resize', (width, height) => {
    resizeCanvas(width, height)
    setup()
    draw(0)
})

// ---------------------------------------------------------------------------
// render helpers
// ---------------------------------------------------------------------------

function midpoint(a: Vec2, b: Vec2) {
    return a.copy().add(b).div(2)
}

function smoothDrawClosed(pts: Vec2[]) {
    ctx.beginPath()
    const len = pts.length
    let mpa1 = midpoint(pts[0], pts[pts.length - 1])
    ctx.moveTo(mpa1.x, mpa1.y)
    for (let i = 0; i < len; i++) {
        const mid = midpoint(pts[i], pts[(i + 1) % len])
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mid.x, mid.y)
    }
    ctx.quadraticCurveTo(pts[0].x, pts[0].y, mpa1.x, mpa1.y)
    ctx.closePath()
}

/**
 * Draws one stroke as a ribbon, then re-stamps it `overlap.passes` times with
 * noise jitter for the brushy look. Everything that shapes the overlap reads
 * from C.ribbon / C.overlap — no hardcoded values, so this is the single place
 * controlling the look.
 */
function drawBrushStroke(pts: Vec2[]) {
    const ribbonParams: RibbonParams = {
        width: C.ribbon.width,
        taper: C.ribbon.taper,
        taperLen: C.ribbon.taperLen,
        endsLen: C.ribbon.endsLen,
        easeFn: C.ribbon.easeFn,
    }

    ctx.save()
    ctx.globalAlpha = C.overlap.alpha

    const ribbon = getRibbon(pts, { ...ribbonParams })
    smoothDrawClosed(ribbon.all)
    ctx.fill()

    for (let i = 0; i < C.overlap.passes; i++) {
        const noiseRibbon = getRibbon(pts, {
            ...ribbonParams,
            noiseFn: noise,
            noiseScale: C.overlap.noiseScale,
            // animation hook: advance this by time to make the brush squiggle
            noiseOffset: i * 100,
            noiseJitter: C.overlap.jitter,
            noiseRotate: C.overlap.rotate,
        })
        smoothDrawClosed(noiseRibbon.all)
        ctx.fill()
    }

    ctx.restore()
}

// ---------------------------------------------------------------------------
// lifecycle
// ---------------------------------------------------------------------------

function resetSeed() {
    rng = makeRng(seed)
    noise = createNoise2D(rng)
}

/** Builds the static structure: geometry, colors, and the strokes per line. */
function setup() {
    resetSeed()
    const { width, height } = sizes
    const { spacing, aspect, padding, xStep } = C.layout

    iw = width - padding[0] * 2
    ih = height - padding[1] * 2
    if (iw / aspect > ih) {
        iw = ih * aspect
    } else {
        ih = iw / aspect
    }
    const lineCount = Math.floor(ih / spacing)
    steps = Math.floor(iw / xStep)
    iw = steps * xStep
    ih = lineCount * spacing

    const colors = pickColors(lineCount, palette.colors, rng)

    lines = []
    for (let i = 0; i < lineCount; i++) {
        lines.push({
            baseY: i * spacing,
            color: colors[i],
            strokes: generateStrokes({
                steps,
                count: C.wave.strokeCount,
                amp: C.wave.amp,
                rng,
            }),
        })
    }

    resetSeed()
}

/** Per-frame geometry + render. `t` is the animation hook (unused at t = 0). */
function draw(t: number) {
    const { width, height } = sizes
    const { spacing, xStep } = C.layout
    const { freqX, freqY } = C.wave

    ctx.fillStyle = palette.bg
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.translate((width - iw) / 2, (height - ih) / 2)
    ctx.translate(0, C.ribbon.width / 2 + spacing / 2)

    lines.forEach(({ baseY, color, strokes }) => {
        const silhouette = buildSilhouette({ baseY, steps, xStep, freqX, freqY, noise, t })
        ctx.fillStyle = color
        strokes.forEach((stroke) => {
            drawBrushStroke(strokeToPoints(silhouette, stroke))
        })
    })

    ctx.restore()
}

function initialize() {
    setup()

    const gui = new GUI()

    const layout = gui.addFolder('layout')
    layout.add(C.layout, 'spacing', 5, 200, 1)
    layout.add(C.layout.padding, 0, 0, 200, 1).name('padding x')
    layout.add(C.layout.padding, 1, 0, 200, 1).name('padding y')
    layout.add(C.layout, 'aspect', 0.1, 3, 0.1)
    layout.add(C.layout, 'xStep', 1, 200, 1)

    const wave = gui.addFolder('wave')
    wave.add(C.wave, 'amp', 0, 200, 1)
    wave.add(C.wave, 'freqX', 0, 0.5, 0.0001)
    wave.add(C.wave, 'freqY', 0, 0.5, 0.0001)
    wave.add(C.wave, 'strokeCount', 1, 50, 1)

    const ribbon = gui.addFolder('ribbon')
    ribbon.add(C.ribbon, 'width', 1, 100, 1)

    const overlap = gui.addFolder('overlap')
    overlap.add(C.overlap, 'passes', 1, 40, 1)
    overlap.add(C.overlap, 'alpha', 0, 1, 0.01)
    overlap.add(C.overlap, 'noiseScale', 0, 0.5, 0.0001)
    overlap.add(C.overlap, 'jitter', 0, 20, 0.1)

    gui.onChange(() => {
        setup()
        draw(0)
    })

    makePalettesGui(gui, palette, paletteOpts, (pal) => {
        palette = pal
        setup()
        draw(0)
    })

    gui.add({ save: () => saveCanvasImage(canvas) }, 'save')
}

initialize()

draw(0)
