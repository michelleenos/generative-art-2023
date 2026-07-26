import easing, { Easing } from '~/helpers/easings'
import { Vec2 } from '~/helpers/trig-shapes'
import { map } from '~/helpers/utils'

export interface RibbonParams {
    width?: number
    taper?: number
    endsLen?: number
    taperLen?: number
    easeFn?: Easing
    noiseFn?: (x: number, y: number) => number
    noiseOffset?: number
    noiseScale?: number
    noiseJitter?: number
    noiseRotate?: number
}

export interface RibbonData {
    pt: Vec2
    e1: Vec2
    e2: Vec2
    direction: Vec2
    normal: Vec2
    w: number
}

export function getRibbon(
    pts: Vec2[],
    {
        width = 20,
        taper = 0.3,
        easeFn = 'outSine',
        endsLen = 100,
        noiseOffset = 0,
        noiseScale = 0.01,
        noiseJitter = width * taper,
        noiseRotate = Math.PI * 0.5,
        taperLen,
        noiseFn,
    }: RibbonParams,
) {
    const edge1: Vec2[] = []
    const edge2: Vec2[] = []
    const all: Vec2[] = []
    const results: RibbonData[] = []
    const wEnds = width * taper

    const len = pts.length
    let distance = 0
    let last: Vec2 | null = null

    const progress = (distance: number, max: number) => {
        if (distance >= max) return 1
        let p = distance / max
        p = easing[easeFn](p)
        return p
    }

    const calculateRibbon = (ind: number) => {
        const pt = pts[ind]
        if (last !== null) distance += pt.distance(last)
        last = pt

        let p = progress(distance, endsLen)
        let tp = taperLen !== undefined && taperLen !== endsLen ? progress(distance, taperLen) : p
        let w = map(tp, 0, 1, wEnds, width) / 2
        let w1 = w
        let w2 = w
        const a = pts[Math.max(0, ind - 1)]
        const b = pts[Math.min(len - 1, ind + 1)]
        const direction = b.copy().sub(a).normalize()
        if (noiseFn) {
            let n = noiseFn((pt.x + noiseOffset) * noiseScale, (pt.y + noiseOffset) * noiseScale)
            let n2 = noiseFn(
                (pt.x + noiseOffset * 1.5) * noiseScale,
                (pt.y + noiseOffset * 1.5) * noiseScale,
            )
            let p1 = map(p, 0, 1, 0.5, 1)
            w1 += n * noiseJitter * p1
            w2 += n2 * noiseJitter * p1
            // opt-in: uncomment to also wobble the direction (uses noiseRotate).
            // currently off, so `noiseRotate` / C.overlap.rotate are inert.
            // direction.rotate(n * noiseRotate * p)
        }
        const normal = direction.normal()

        const e1 = new Vec2(pt.x + normal.x * w1, pt.y + normal.y * w1)
        const e2 = new Vec2(pt.x - normal.x * w2, pt.y - normal.y * w2)
        results[ind] = { e1, e2, direction, normal, w, pt }
        edge1[ind] = e1
        edge2[ind] = e2
        all[ind] = e1
        all[pts.length * 2 - 1 - ind] = e2
    }

    // Two passes with `distance`/`last` reset between them so the taper eases in
    // from BOTH ends: forward from the start to the middle...
    for (let i = 0; i < Math.floor(len / 2); i++) {
        calculateRibbon(i)
    }

    // ...then backward from the end to the middle.
    last = null
    distance = 0
    for (let i = len - 1; i >= Math.floor(len / 2); i--) {
        calculateRibbon(i)
    }

    return { results, edge1, edge2, all }
}
