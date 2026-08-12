import '~/style.css'
import chroma from 'chroma-js'
import createCanvas from '~/helpers/create-canvas'
import { makeRandomSeed, makeRng, Rng } from '~/helpers/prng'
import GUI from 'lil-gui'
import { map } from '~/helpers/utils'

const width = 800
const height = 800
const { ctx } = createCanvas(800, 800)

const colorsTest = () => {
    let seed: number
    let rng: Rng

    const config = {
        hue: 170,
        addHue: 100,
        lessSaturated: false,
        count: 12,
    }

    function makePalette(rng: Rng, regenerate = false) {
        const { count } = config
        // const hue = rng(170, 330)
        const hue = config.hue
        if (regenerate) {
            config.addHue = rng(100, 200)
            config.lessSaturated = rng() < 0
        } else {
            rng()
            rng()
        }

        let l1 = 0.35
        let l2 = 0.85
        let chromaVal = 0.08
        const colorAt = (amt: number) => {
            return chroma.oklch(l1 + (l2 - l1) * amt, chromaVal, hue + config.addHue * amt)
        }
        // const c1 = chroma([0.25, 0.12, hue], 'oklch')
        const c1 = chroma.oklch(l1, 0.05, hue)
        console.log(c1.oklch())
        let mixAmt = 0

        function nextColor() {
            const c = colorAt(mixAmt).set(
                'oklch.c',
                config.lessSaturated ? `*${rng(0.7, 1.5)}` : `*${rng(1.2, 2)}`,
            )
            mixAmt = (mixAmt + rng(0.5, 0.75)) % 1
            return c
        }
        const bgColor = nextColor().set('oklch.l', '0.7')
        const rowColors = Array.from({ length: count }, () => nextColor())

        return {
            bgColor,
            rowColors,
        }
    }

    function draw(regenerate = false) {
        const { count } = config

        seed = makeRandomSeed()
        rng = makeRng(seed)
        let palette = makePalette(rng, regenerate)

        ctx.fillStyle = palette.bgColor.css()
        ctx.fillRect(0, 0, width / 2, height)

        let step = height / count
        palette.rowColors.forEach((color, i) => {
            ctx.fillStyle = color.css()
            ctx.fillRect(width / 2, i * step, width / 2, step)
        })
    }

    draw(true)

    const gui = new GUI()
    gui.add(config, 'hue', 0, 360, 1).onChange(() => draw(false))
    gui.add(config, 'addHue', 0, 250, 1)
        .listen()
        .onChange(() => draw(false))
    gui.add(config, 'lessSaturated')
        .listen()
        .onChange(() => draw(false))
    gui.add({ redo: () => draw(false) }, 'redo')
}

const points = [
    {
        x: 380.960231493259,
        y: 94.78100362908131,
    },
    {
        x: 385.93168121226324,
        y: 95.31456495771457,
    },
    {
        x: 390.90313093126747,
        y: 95.84812628634782,
    },
    {
        x: 395.8745806502717,
        y: 96.38168761498108,
    },
    {
        x: 400.8460303692759,
        y: 96.91524894361433,
    },
    {
        x: 405.81748008828015,
        y: 97.44881027224758,
    },
]
interface RibbonParams {
    strokeWidth: number
    taper: number
    taperType?: 'start' | 'end' | 'symmetric'
    taperLen: number
}

type Vec2Like = { x: number; y: number }

type RibbonStep = {
    e1: { x: number; y: number }
    e2: { x: number; y: number }
}

export type Ribbon = RibbonStep[]

function progress(distance: number, max: number) {
    if (distance >= max) return 1
    return distance / max
}

export function getRibbon(
    pts: { x: number; y: number }[],
    { strokeWidth, taper, taperLen, taperType = 'symmetric' }: RibbonParams,
) {
    const len = pts.length
    const results: Ribbon = []
    let distance = 0
    let last: { x: number; y: number } | null = null

    const calculateRibbon = (i: number) => {
        const pt = pts[i]
        if (last !== null) distance += Math.hypot(pt.x - last.x, pt.y - last.y)
        last = pt

        let w = strokeWidth
        if (taper !== 1) {
            let pTaper = progress(distance, taperLen)
            w = map(pTaper, 0, 1, strokeWidth * taper, strokeWidth)
        }
        w /= 2

        const a = pts[Math.max(0, i - 1)]
        const b = pts[Math.min(len - 1, i + 1)]

        const dx = b.x - a.x
        const dy = b.y - a.y
        const mag = Math.hypot(dx, dy)
        const dirX = mag === 0 ? 1 : dx / mag
        const dirY = mag === 0 ? 0 : dy / mag
        const normalX = -dirY
        const normalY = dirX

        const e1 = { x: pt.x + normalX * w, y: pt.y + normalY * w }
        const e2 = { x: pt.x - normalX * w, y: pt.y - normalY * w }

        results[i] = { e1, e2 }
    }

    if (taperType === 'symmetric') {
        for (let i = 0; i < Math.floor(len / 2); i++) calculateRibbon(i)

        last = null
        distance = 0
        for (let i = len - 1; i >= Math.floor(len / 2); i--) calculateRibbon(i)
    } else if (taperType === 'start') {
        for (let i = 0; i < len; i++) calculateRibbon(i)
    } else {
        for (let i = len - 1; i >= 0; i--) calculateRibbon(i)
    }

    return results
}

function midpoint(a: Vec2Like, b: Vec2Like) {
    return [(a.x + b.x) / 2, (a.y + b.y) / 2] as [number, number]
}

export function smoothDrawRibbon(ribbon: Ribbon, ctx: CanvasRenderingContext2D, useCurves = true) {
    const len = ribbon.length
    let mp1 = midpoint(ribbon[0].e1, ribbon[0].e2)
    ctx.moveTo(...mp1)

    const line = (cpx: number, cpy: number, mpx: number, mpy: number) => {
        if (useCurves) {
            ctx.quadraticCurveTo(cpx, cpy, mpx, mpy)
        } else {
            ctx.lineTo(mpx, mpy)
        }
    }

    for (let i = 0; i < ribbon.length - 1; i++) {
        const mid = midpoint(ribbon[i].e1, ribbon[i + 1].e1)
        line(ribbon[i].e1.x, ribbon[i].e1.y, ...mid)
    }

    let mp2 = midpoint(ribbon[len - 1].e1, ribbon[len - 1].e2)
    line(ribbon[len - 1].e1.x, ribbon[len - 1].e1.y, ...mp2)

    for (let i = len - 1; i > 0; i--) {
        const mid = midpoint(ribbon[i].e2, ribbon[i - 1].e2)
        line(ribbon[i].e2.x, ribbon[i].e2.y, ...mid)
    }

    line(ribbon[0].e2.x, ribbon[0].e2.y, ...mp1)
}

function draw() {
    const ribbon = getRibbon(points, {
        strokeWidth: 28,
        taper: 0.7,
        taperLen: 10,
    })

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    // ctx.translate(-width / 2, -height / 2)
    ctx.strokeStyle = '#000'
    smoothDrawRibbon(ribbon, ctx)
    // ctx.moveTo(points[0].x, points[0].y)
    // for (let i = 1; i < points.length; i++) {
    //     ctx.lineTo(points[i].x, points[i].y)
    // }
    ctx.stroke()

    ctx.restore()
}

draw()
