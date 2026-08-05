import GUI from 'lil-gui'
import { getPaletteVariants, PaletteVariant } from 'mish-bainrow'
import { createNoise2D, NoiseFunction2D } from 'simplex-noise'
import { saveCanvasImage } from '~/helpers/canvas-save-image'
import createCanvas from '~/helpers/create-canvas'
import { makePalettesGui } from '~/helpers/gui-palettes'
import { makeRng } from '~/helpers/prng'
import { Sizes } from '~/helpers/sizes'
import { Vec2 } from '~/helpers/trig-shapes'
import '~/style.css'
import { C } from './config'
import { getRibbon, RibbonParams } from './ribbon'
import { silhouetteData } from './silhouette'
import { generateStrokes, Stroke } from './strokes'
import easing from '~/helpers/easings'

const PHI = (1 + Math.sqrt(5)) / 2 // 1.618...
const INV_PHI = PHI - 1 // 0.618... (== 1/PHI)

// To animate later, import `loop` and drive draw(t) with it — the silhouette
// and brush strokes already accept `t` (see silhouette.ts / draw()).

// ---------------------------------------------------------------------------
// state
// ---------------------------------------------------------------------------

let seed = (Math.random() * 2 ** 32) >>> 0
// let seed = 3711163552
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

function drawBrushStroke(pts: Vec2[], t = 0) {
    const ribbonParams: RibbonParams = {
        width: C.ribbon.width,
        taper: C.ribbon.taper,
        taperLen: C.ribbon.taperLen,
        noiseTaperLen: C.ribbon.noiseTaperLen,
        easeFn: C.ribbon.easeFn,
    }

    ctx.save()
    ctx.globalAlpha = C.overlap.alpha

    for (let i = 0; i < C.overlap.passes; i++) {
        const noiseRibbon = getRibbon(pts, {
            ...ribbonParams,
            noiseFn: noise,
            noiseScale: C.overlap.noiseScale,
            noiseOffset: i * 100,
            noiseJitter: C.overlap.jitter,
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

function pickColor(colors: string[], ind: number) {
    return colors[Math.floor(((ind * INV_PHI) % 1) * colors.length)]
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

    lines = []
    for (let i = 0; i < lineCount; i++) {
        lines.push({
            baseY: i * spacing,
            color: pickColor(palette.colors, i),
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

function draw(t: number) {
    const { width, height } = sizes
    const { spacing, xStep } = C.layout
    const { freqX, freqY, amp, easeFn } = C.wave

    ctx.fillStyle = palette.bg
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.translate((width - iw) / 2, (height - ih) / 2)
    ctx.translate(0, C.ribbon.width / 2 + spacing / 2)

    lines.forEach(({ baseY, color, strokes }) => {
        ctx.fillStyle = color

        const slh = silhouetteData({ baseY, steps, xStep, freqX, freqY, noise, t })

        strokes.forEach((stroke) => {
            const pts: Vec2[] = []
            for (let xi = stroke.start; xi < stroke.end; xi++) {
                const { x, p, n } = slh[xi]
                let amt = p > 0.5 ? 1 - (p - 0.5) * 2 : p * 2
                amt = easing[easeFn](amt)
                const y = Math.abs(n) * amt * stroke.amp
                pts.push(new Vec2(x, baseY - y))
            }
            drawBrushStroke(pts)
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
    wave.add(C.wave, 'easeFn', Object.keys(easing))

    const ribbon = gui.addFolder('ribbon')
    ribbon.add(C.ribbon, 'width', 1, 100, 1)
    ribbon.add(C.ribbon, 'taper', 0, 1, 0.01)
    ribbon.add(C.ribbon, 'taperLen', 5, 500, 1)
    ribbon.add(C.ribbon, 'noiseTaperLen', 5, 300, 1)

    const overlap = gui.addFolder('overlap')
    overlap.add(C.overlap, 'passes', 1, 40, 1)
    overlap.add(C.overlap, 'alpha', 0, 1, 0.01)
    overlap.add(C.overlap, 'noiseScale', 0, 0.1, 0.0001)
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
