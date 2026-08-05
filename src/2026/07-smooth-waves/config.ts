import type { Easing } from '~/helpers/easings'

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
        easeFn: 'outSine' as Easing,
    },
    // shape of a single ribbon (one stroke). taper*/ends*/easeFn used to be
    // hardcoded in smoothMultipleRibbon.
    ribbon: {
        width: 10,
        taper: 0.3,
        taperLen: 200,
        noiseTaperLen: 100,
        easeFn: 'outSine' as Easing,
    },
    // the brushy re-stamping: each ribbon is drawn `passes` extra times with
    // noise jitter at low alpha.
    overlap: {
        passes: 3, // was `brushOverlaps`
        alpha: 0.2,
        noiseScale: 0.01, // was `overlapNoiseScale`
        jitter: 7,
    },
}

export type Config = typeof C
