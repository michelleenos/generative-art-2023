import { getPaletteVariant, getPaletteVariants, PaletteVariant } from 'mish-bainrow'
import { createNoise2D, NoiseFunction2D } from 'simplex-noise'
import createCanvas from '~/helpers/create-canvas'
import { makeRng, mulberry32 } from '~/helpers/prng'
import { Sizes } from '~/helpers/sizes'
import { Vec2 } from '~/helpers/trig-shapes'
import '~/style.css'
import { getRibbon, RibbonParams } from './ribbon'
import { clamp, map } from '~/helpers/utils'
import GUI from 'lil-gui'
import { makePalettesGui } from '~/helpers/gui-palettes'
import loop from '~/helpers/loop'
import { saveCanvasImage } from '~/helpers/canvas-save-image'

let seed = (Math.random() * 2 ** 32) >>> 0
let rng: ReturnType<typeof makeRng>
let noise: NoiseFunction2D
let palette: PaletteVariant
let lines: number
let steps: number
let iw: number
let ih: number
let colors: string[]
let lineSettings: ReturnType<typeof buildLineSettings>

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

// palette = getPaletteVariant('untitledApril15-2')

// palette = buildVariant(palettes.autmn, 3, { isolateColors: true })

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

const C = {
    spacing: 80,
    aspect: 4 / 5,
    padding: [50, 50],
    amp: 90,
    xStep: 22,
    freqX: 0.01,
    freqY: 0.01,
    width: 10,
    alpha: 0.2,
    brushOverlaps: 3,
    overlapNoiseScale: 0.01,
    jitter: 2,
    brushSweeps: 20,
    segmentsMethod: 'rng' as 'rng' | 'noise',
}

function midpoint(a: Vec2, b: Vec2) {
    return a.copy().add(b).div(2)
}

function smoothDraw(pts: Vec2[]) {
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

function smoothMultipleRibbon(pts: Vec2[], width: number) {
    const ribbonParams: RibbonParams = {
        width,
        taperLen: 200,
        endsLen: 100,
        easeFn: 'outSine',
        taper: 0.3,
    }
    const ribbon = getRibbon(pts, { ...ribbonParams })

    ctx.save()
    ctx.globalAlpha = C.alpha
    smoothDrawClosed(ribbon.all)
    ctx.fill()

    for (let i = 0; i < C.brushOverlaps; i++) {
        const noiseRibbon = getRibbon(pts, {
            ...ribbonParams,
            noiseFn: noise,
            noiseScale: C.overlapNoiseScale,
            noiseOffset: i * 100,
            noiseJitter: C.jitter,
            noiseRotate: Math.PI * 0.25,
        })
        smoothDrawClosed(noiseRibbon.all)
        ctx.fill()
    }

    ctx.restore()
}

function shuffle<T>(array: T[]) {
    let currentIndex = array.length
    let randomIndex
    const out = [...array]

    while (0 !== currentIndex) {
        randomIndex = Math.floor(rng(currentIndex))
        currentIndex -= 1
        ;[out[currentIndex], out[randomIndex]] = [out[randomIndex], out[currentIndex]]
    }

    return out
}
function pickColors(count: number, colors: string[]) {
    let lastColor: string | null = null
    const pickedColors: string[] = []

    let indices = new Array(count).fill(0).map((_, i) => i)
    indices = shuffle(indices)

    for (let i = 0; i < Math.min(indices.length, colors.length); i++) {
        let index = indices[i]
        let color = colors[i]
        pickedColors[index] = color
    }

    for (let i = 0; i < count; i++) {
        if (pickedColors[i] !== undefined) {
            lastColor = pickedColors[i]
            continue
        }
        let color = rng(colors)
        if (colors.length >= 3) {
            let nextColor = i < count ? pickedColors[i + 1] : undefined
            while (color === lastColor || color === nextColor) {
                color = rng(colors)
            }
        }
        pickedColors[i] = color
        lastColor = color
    }
    return pickedColors
}

function resetSeed() {
    rng = makeRng(seed)
    noise = createNoise2D(rng)
}

function initialize() {
    setup()

    const gui = new GUI()
    const f = gui.addFolder('params')
    f.add(C, 'spacing', 5, 200, 1)
    f.add(C.padding, 0, 0, 200, 1).name('padding x')
    f.add(C.padding, 1, 0, 200, 1).name('padding y')
    f.add(C, 'aspect', 0.1, 3, 0.1)
    f.add(C, 'amp', 0, 200, 1)
    f.add(C, 'xStep', 1, 200, 1)
    f.add(C, 'freqX', 0, 0.5, 0.0001)
    f.add(C, 'freqY', 0, 0.5, 0.0001)
    f.add(C, 'width', 1, 100, 1)
    f.add(C, 'brushOverlaps', 1, 40, 1)
    f.add(C, 'alpha', 0, 1, 0.01)
    f.add(C, 'overlapNoiseScale', 0, 0.5, 0.0001)
    f.add(C, 'jitter', 0, 20, 0.1)
    f.add(C, 'brushSweeps', 1, 50, 1)
    f.onChange((e) => {
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

function setup() {
    resetSeed()
    const { width, height } = sizes

    iw = width - C.padding[0] * 2
    ih = height - C.padding[1] * 2
    if (iw / C.aspect > ih) {
        iw = ih * C.aspect
    } else {
        ih = iw / C.aspect
    }
    lines = Math.floor(ih / C.spacing)
    steps = Math.floor(iw / C.xStep)
    iw = steps * C.xStep
    ih = lines * C.spacing
    // palette = rng(paletteOpts)
    colors = pickColors(lines, palette.colors)

    lineSettings = buildLineSettings()

    resetSeed()
}

function buildLineSettings() {
    const lineSettings = []
    for (let i = 0; i < lines; i++) {
        const baseY = i * C.spacing

        const segments = []
        const brushes = []

        for (let j = 0; j < C.brushSweeps; j++) {
            let start: number
            let end: number
            let amp =
                C.brushSweeps === 1 ? C.amp : map(j, 0, C.brushSweeps - 1, C.amp, C.amp * 0.25)

            let count = Math.floor(rng(steps / 2, steps + 1))
            if (count > steps / 2) {
                start = Math.floor(rng(0, steps - count + 1))
                end = start + count + 1
            } else {
                end = Math.floor(rng(count, steps + 1))
                start = end - count
            }
            segments.push({ start, end, amp })
        }

        lineSettings.push({ baseY, segments, color: colors[i] })
    }
    return lineSettings
}

function draw(ms: number) {
    const { width, height } = sizes
    ctx.fillStyle = palette.bg
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.translate((width - iw) / 2, (height - ih) / 2)
    ctx.translate(0, C.width / 2 + C.spacing / 2)

    lineSettings.forEach((ls) => {
        const { baseY, segments, color } = ls

        segments.forEach(({ start, end, amp }) => {
            const pts: Vec2[] = []
            for (let xi = start; xi < end; xi++) {
                const x = C.xStep * xi
                const p = xi / steps
                let amt = p > 0.5 ? 1 - (p - 0.5) * 2 : p * 2
                const n = noise(x * C.freqX, baseY * C.freqY)
                let y = baseY - Math.abs(n) * amt * amp

                pts.push(new Vec2(x, y))
            }

            ctx.fillStyle = color
            smoothMultipleRibbon(pts, C.width)
        })
    })

    ctx.restore()
}

initialize()

draw(0)
