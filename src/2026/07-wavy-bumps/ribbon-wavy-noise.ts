import { type NoiseFunction2D } from 'simplex-noise'
import { Vec2 } from '~/helpers/trig-shapes'
import { map } from '~/helpers/utils'

interface RibbonParams {
    width: number
    taper: number
    taperType?: 'start' | 'end' | 'symmetric'
    taperLen: number
    noiseFn?: NoiseFunction2D
    noiseJitter?: number
    noiseScale?: number
    noiseOffsetX?: number
    noiseOffsetY?: number
}

type Vec2Simple = { x: number; y: number }

function progress(distance: number, max: number) {
    if (distance >= max) return 1
    return distance / max
}

export function getRibbon(
    pts: { x: number; y: number }[],
    {
        width,
        taper,
        taperLen,
        taperType = 'symmetric',
        noiseFn,
        noiseJitter = 0.5,
        noiseScale = 0.01,
        noiseOffsetX = 10,
        noiseOffsetY = 10,
    }: RibbonParams,
) {
    const len = pts.length
    const results: { e1: Vec2Simple; e2: Vec2Simple }[] = []
    let distance = 0
    let last: Vec2Simple | null = null

    const calculateRibbon = (i: number) => {
        const pt = pts[i]
        if (last !== null) distance += Math.hypot(pt.x - last.x, pt.y - last.y)
        last = pt

        let w = width
        if (taper !== 1) {
            let pTaper = progress(distance, taperLen)
            w = map(pTaper, 0, 1, width * taper, width)
        }
        w /= 2
        let w1 = w
        let w2 = w

        if (noiseFn) {
            let n1 = noiseFn((pt.x + noiseOffsetX) * noiseScale, (pt.y + noiseOffsetY) * noiseScale)
            let n2 = noiseFn(
                (pt.x + noiseOffsetX * 24) * noiseScale,
                (pt.y + noiseOffsetY * 24) * noiseScale,
            )
            w1 *= 1 + Math.abs(n1) * noiseJitter
            w2 *= 1 + Math.abs(n2) * noiseJitter
        }

        const a = pts[Math.max(0, i - 1)]
        const b = pts[Math.min(len - 1, i + 1)]

        const dx = b.x - a.x
        const dy = b.y - a.y
        const mag = Math.hypot(dx, dy)
        const dirX = mag === 0 ? 1 : dx / mag
        const dirY = mag === 0 ? 0 : dy / mag
        const normalX = -dirY
        const normalY = dirX

        const e1 = new Vec2(pt.x + normalX * w, pt.y + normalY * w)
        const e2 = new Vec2(pt.x - normalX * w, pt.y - normalY * w)

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

function midpoint(a: Vec2Simple, b: Vec2Simple) {
    // return a.copy().add(b).div(2)
    return [(a.x + b.x) / 2, (a.y + b.y) / 2] as [number, number]
}

export function smoothDrawRibbon(
    ribbon: { e1: Vec2Simple; e2: Vec2Simple }[],
    ctx: CanvasRenderingContext2D,
    useCurves = true,
) {
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
