import { Vec2 } from '~/helpers/trig-shapes'
import { map } from '~/helpers/utils'
import type { Silhouette } from './silhouette'

/**
 * A stroke is time-invariant *structure*: which span of a line it covers and how
 * tall it is. It holds no points and no noise — turning it into geometry (which
 * needs the silhouette, and later `t`) happens in strokeToPoints. Keeping this
 * split is what lets animation recompute only the cheap per-frame geometry.
 */
export interface Stroke {
    start: number
    end: number
    amp: number
}

export interface GenerateStrokesParams {
    /** number of steps across the line */
    steps: number
    /** how many strokes to generate (C.wave.strokeCount) */
    count: number
    /** base amplitude (C.wave.amp) */
    amp: number
    rng: (min: number, max: number) => number
}

/**
 * Default stroke-generation strategy: random spans with amplitude tapering off
 * across strokes. Swap this function for a silhouette-aware strategy (weight by
 * height, avoid peak endpoints, etc.) — it already has everything it needs via
 * params; add a `silhouette` arg when you want shape-awareness.
 */
export function generateStrokes({ steps, count, amp, rng }: GenerateStrokesParams): Stroke[] {
    const strokes: Stroke[] = []

    for (let j = 0; j < count; j++) {
        let start: number
        let end: number
        const strokeAmp = count === 1 ? amp : map(j, 0, count - 1, amp, amp * 0.25)

        const span = Math.floor(rng(steps / 2, steps + 1))
        if (span > steps / 2) {
            start = Math.floor(rng(0, steps - span + 1))
            end = start + span + 1
        } else {
            end = Math.floor(rng(span, steps + 1))
            start = end - span
        }
        strokes.push({ start, end, amp: strokeAmp })
    }

    return strokes
}

/** Per-frame geometry: map a stroke onto the silhouette to get its polyline. */
export function strokeToPoints(silhouette: Silhouette, stroke: Stroke): Vec2[] {
    const pts: Vec2[] = []
    for (let xi = stroke.start; xi < stroke.end; xi++) {
        const x = silhouette.xAt(xi)
        const y = silhouette.baseY - silhouette.sampleAt(xi) * stroke.amp
        pts.push(new Vec2(x, y))
    }
    return pts
}
