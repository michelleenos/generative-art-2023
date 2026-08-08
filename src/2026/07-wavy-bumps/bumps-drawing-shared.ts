import chroma from 'chroma-js'
import { Rng } from '~/helpers/prng'
import { WavyBumpsConfig } from './config'
import { BumpsLayout, BumpsPalette, Sizes } from './types'

export function getPalette(rng: Rng, count: number): BumpsPalette {
    const hue = rng(170, 330)

    const c1 = chroma([0.25, 0.12, hue], 'oklch')
    const c2 = chroma(c1)
        .set('oklch.h', `+${rng(100, 200)}`)
        .set('oklch.l', `+0.5`)
    const lessSaturated = rng() < 0.3
    let mixAmt = 0
    function nextColor() {
        const c = chroma
            .mix(c1, c2, mixAmt, 'oklch')
            .set('oklch.c', lessSaturated ? `*${rng(0.8, 1.8)}` : `*${rng(1.2, 2)}`)
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

export function makeLayout(sizes: Sizes, C: WavyBumpsConfig): BumpsLayout {
    const { width, height } = sizes
    const { peakWidth, lowMin } = C.bumps
    const { density } = C.field
    const { spacing, overlap } = C
    const fieldStepY = 100 / density.y
    return {
        rowCount: Math.ceil(height / spacing) + 1,
        sizes,
        bounds: {
            xStart: -peakWidth,
            xEnd: width + peakWidth,
            peakXStart: Math.trunc(-peakWidth * 0.5),
            peakXEnd: Math.trunc(width + peakWidth * 0.5),
        },
        overlapY: overlap ? Math.ceil(spacing + (spacing - lowMin)) : 0,
        fieldStepX: 100 / density.x,
        fieldStepY,
    }
}
