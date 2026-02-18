import p5 from 'p5'
import { Pane } from 'tweakpane'
import { random, round, shuffle } from '~/helpers/utils'
import '../../style.css'
import { drawings, SheetOpts, SheetType, sheetTypes } from './sheet'

const palette = {
    red: 'hsl(1,60%,50%)',
    purple: 'hsl(250, 60%, 50%)',
    blue: 'hsl(200, 60%, 50%)',
    green: 'hsl(145, 70%, 45%)',
    yellow: 'hsl(40, 90%, 55%)',
}

const paletteArr = Object.values(palette)

const optsMap = sheetTypes.reduce(
    (acc, cur) => {
        return { ...acc, [cur]: cur }
    },
    {} as { [key: string]: string },
)

interface Pattern extends Omit<SheetOpts, 'x' | 'y' | 'w' | 'h'> {
    drawing: SheetType
    color: string
    show: boolean
    opts: SheetTypeOpts
}

const optsDefaults = {
    rects: { sizeX: 0.9, sizeY: 0.9 },
    arcs: { size: 1, ratio: 1 },
    rounded: { sizeX: 0.9, sizeY: 0.9 },
    pluses: { size: 0.7, thickness: 0.3 },
    zigzag: { size: 0.9 },
    circles: { diameter: 0.9 },
} satisfies Record<SheetType, { [key: string]: number }>
type SheetTypeOpts = typeof optsDefaults

const patterns: Pattern[] = [
    {
        drawing: 'rects',
        color: palette.red,
        nx: 1,
        ny: 1,
        show: true,
        offset: false,
        border: 0.03,
        opts: { ...optsDefaults },
    },
    {
        drawing: 'rects',
        color: palette.blue,
        nx: 5,
        ny: 5,
        show: true,
        offset: false,
        border: 0.03,
        opts: { ...optsDefaults },
    },
    {
        drawing: 'circles',
        color: palette.green,
        nx: 5,
        ny: 5,
        show: false,
        offset: false,
        border: 0.03,
        opts: { ...optsDefaults },
    },
]

function createPane(parent: Pane, params: Pattern, title: string) {
    const f = parent.addFolder({ title })
    const drawingCtrl = f.addBinding(params, 'drawing', { options: optsMap, label: 'drawing' })
    f.addBinding(params, 'nx', { min: 1, max: 12, step: 1 })
    f.addBinding(params, 'ny', { min: 1, max: 12, step: 1 })

    f.addBinding(params, 'show')
    f.addBinding(params, 'offset')
    f.addBlade({ view: 'separator' })
    const rectCtrls = [
        f.addBinding(params.opts.rects, 'sizeX', { min: 0, max: 1.5, step: 0.05 }),
        f.addBinding(params.opts.rects, 'sizeY', { min: 0, max: 1.5, step: 0.05 }),
    ]
    const arcsCtrls = [
        f.addBinding(params.opts.arcs, 'size', { min: 0, max: 2, step: 0.05 }),
        f.addBinding(params.opts.arcs, 'ratio', { min: 0, max: 3, step: 0.05 }),
    ]
    const roundedCtrls = [
        f.addBinding(params.opts.rounded, 'sizeX', { min: 0, max: 1.5, step: 0.05 }),
        f.addBinding(params.opts.rounded, 'sizeY', { min: 0, max: 1.5, step: 0.05 }),
    ]
    const plusesCtrls = [
        f.addBinding(params.opts.pluses, 'size', { min: 0, max: 1.5, step: 0.05 }),
        f.addBinding(params.opts.pluses, 'thickness', { min: 0, max: 1, step: 0.05 }),
    ]
    const zigzagCtrls = [f.addBinding(params.opts.zigzag, 'size', { min: 0, max: 1.5, step: 0.05 })]
    const circleCtrls = [
        f.addBinding(params.opts.circles, 'diameter', { min: 0, max: 1.5, step: 0.05 }),
    ]

    const onDrawingChange = () => {
        rectCtrls.forEach((c) => (c.hidden = params.drawing !== 'rects'))
        arcsCtrls.forEach((c) => (c.hidden = params.drawing !== 'arcs'))
        roundedCtrls.forEach((c) => (c.hidden = params.drawing !== 'rounded'))
        plusesCtrls.forEach((c) => (c.hidden = params.drawing !== 'pluses'))
        zigzagCtrls.forEach((c) => (c.hidden = params.drawing !== 'zigzag'))
        circleCtrls.forEach((c) => (c.hidden = params.drawing !== 'circles'))
    }
    drawingCtrl.on('change', onDrawingChange)
    onDrawingChange()

    return f
}

const pane = new Pane()
patterns.forEach((p, i) => createPane(pane, p, `shape ${i}`))

new p5(
    (pmain: p5) => {
        let size = Math.max(Math.min(window.innerWidth, window.innerHeight) * 0.6, 600)

        pmain.setup = function () {
            pmain.createCanvas(size, size)
            pmain.noLoop()
            pmain.colorMode(pmain.HSL)

            generateRandom()
        }

        let btnRandom = pane.addButton({ title: 'generate random' })
        btnRandom.on('click', () => {
            generateRandom()
            draw()
        })

        let btnSave = pane.addButton({ title: 'save' })
        btnSave.on('click', () => pmain.saveCanvas('pattern', 'png'))

        pane.on('change', draw)

        function generateRandom() {
            const colors = shuffle(paletteArr)
            patterns.forEach((pattern, i) => {
                let drawing = random(sheetTypes)
                pattern.drawing = drawing
                pattern.offset = random() < 0.5

                if (drawing === 'arcs') {
                    if (random() > 0.5) {
                        pattern.nx = random([2, 3])
                        pattern.ny = pattern.nx * 2
                        pattern.opts.arcs.size = random(0.6, 0.9)
                        pattern.opts.arcs.ratio = 1
                    } else {
                        pattern.nx = random([2, 3, 4, 5])
                        pattern.ny = pattern.nx
                        pattern.opts.arcs.size = random(0.5, 0.9)
                        pattern.opts.arcs.ratio = random(1, 2)
                    }
                } else if (drawing === 'zigzag') {
                    pattern.nx = random([3, 4, 5, 6, 7, 8, 9])
                    pattern.ny = pattern.nx + random([-1, 0, 1])
                    pattern.opts.zigzag.size = round(random(0.5, 0.9), 2)
                } else if (drawing === 'pluses') {
                    pattern.nx = random([3, 4, 5])
                    pattern.ny = pattern.nx
                    pattern.opts.pluses.size = round(random(0.5, 0.9), 2)
                    pattern.opts.pluses.thickness = round(
                        random(0.1, pattern.opts.pluses.size * 0.7),
                        2,
                    )
                } else if (drawing === 'circles') {
                    let nx = random([3, 4, 5, 6])
                    let ny: number
                    if (random() < 0.5) {
                        let opts = [-1, 1]
                        if (nx > 5) opts.push(-2, 2)
                        ny = nx + random(opts)
                    } else {
                        ny = nx
                    }
                    pattern.nx = nx
                    pattern.ny = ny
                    pattern.opts.circles.diameter = round(random(0.7, 0.95), 2)
                } else if (drawing === 'rounded') {
                    let n1 = random([1, 2, 3])
                    let n2 = random([1, 2, 3, 4, 5, 6])
                    let s1 = random(0.8, 0.95)
                    let s2 = random(0.5, 0.9)
                    if (random() < 0.5) {
                        pattern.nx = n1
                        pattern.ny = n2
                        pattern.opts.rounded.sizeX = s1
                        pattern.opts.rounded.sizeY = s2
                    } else {
                        pattern.nx = n2
                        pattern.ny = n1
                        pattern.opts.rounded.sizeX = s2
                        pattern.opts.rounded.sizeY = s1
                    }
                }
                pattern.offset = random() < 0.5
                pattern.color = colors[i % colors.length]
            })
            pane.refresh()
        }

        function drawPattern(pattern: Pattern) {
            if (!pattern.show) return
            const opts: SheetOpts = {
                ...pattern,
                w: pmain.width,
                h: pmain.height,
                x: 0,
                y: 0,
            }
            let p = pmain.createGraphics(opts.w, opts.h)
            p.colorMode(p.HSL)

            p.fill(pattern.color)
            p.noStroke()

            if (pattern.drawing === 'rects') {
                drawings.rects({ ...opts, ...pattern.opts.rects }, p)
            } else if (pattern.drawing === 'arcs') {
                drawings.arcs({ ...opts, ...pattern.opts.arcs }, p)
            } else if (pattern.drawing === 'pluses') {
                drawings.pluses({ ...opts, ...pattern.opts.pluses }, p)
            } else if (pattern.drawing === 'circles') {
                drawings.circles({ ...opts, ...pattern.opts.circles }, p)
            } else if (pattern.drawing === 'rounded') {
                drawings.rounded({ ...opts, ...pattern.opts.rounded }, p)
            } else if (pattern.drawing === 'zigzag') {
                drawings.zigzag({ ...opts, ...pattern.opts.zigzag }, p)
            }

            pmain.image(p, opts.x, opts.y)
        }

        pmain.draw = function () {
            draw()
        }

        function draw() {
            pmain.clear(0, 0, pmain.width, pmain.height)
            pmain.noStroke()
            patterns.forEach((p) => drawPattern(p))
        }
    },
    document.getElementById('canvas-container') ?? undefined,
)
