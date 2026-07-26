import type { Easing } from '~/helpers/easings'

/**
 * Single source of truth for every tunable. Grouped by pipeline stage so the
 * GUI folders map 1:1 and so the values that shape the brushy overlap all live
 * in one place (they used to be split between here and hardcoded literals inside
 * the render function).
 */
export const C = {
    // page geometry — the grid the lines sit on
    layout: {
        spacing: 80,
        aspect: 4 / 5,
        padding: [50, 50],
        xStep: 22,
    },
    // the underlying wave shape + how many strokes fill each line
    wave: {
        amp: 90,
        freqX: 0.01,
        freqY: 0.01,
        strokeCount: 20, // was `brushSweeps`
    },
    // shape of a single ribbon (one stroke). taper*/ends*/easeFn used to be
    // hardcoded in smoothMultipleRibbon.
    ribbon: {
        width: 10,
        taper: 0.3,
        taperLen: 200,
        endsLen: 100,
        easeFn: 'outSine' as Easing,
    },
    // the brushy re-stamping: each ribbon is drawn `passes` extra times with
    // noise jitter at low alpha.
    overlap: {
        passes: 3, // was `brushOverlaps`
        alpha: 0.2,
        noiseScale: 0.01, // was `overlapNoiseScale`
        jitter: 2,
        rotate: Math.PI * 0.25, // currently inert (see ribbon.ts noiseRotate)
    },
}

export type Config = typeof C
