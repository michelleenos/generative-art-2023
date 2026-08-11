import chroma from 'chroma-js'
import { makeRandomSeed, makeRng, Rng } from '~/helpers/prng'
import { WavyBumpsConfig } from './config'
import { BumpsLayout, BumpsPalette, BumpsScene, Sizes } from './_wavy-bumps-types'
import { createNoise2D } from 'simplex-noise'
import { randomInt } from '~/helpers/utils'

function decideColorScheme(rng: Rng, config: WavyBumpsConfig['colors']) {
    const colorDiff = randomInt(1, 3, rng)
    if (colorDiff === 1) {
        config.hue = rng(180, 320)
        config.addHue = 80
    } else if (colorDiff === 2) {
        config.hue = rng(170, 310)
        config.addHue = 130
    } else {
        config.hue = rng(140, 270)
        config.addHue = 200
    }
    config.lessSaturated = rng() < 0.3
}

function decideBumps(rng: Rng, config: WavyBumpsConfig['bumps']) {
    config.spacing = randomInt(5, 300, rng)
    config.highMax = randomInt(90, 400, rng)
    config.highMin = randomInt(80, config.highMax, rng)
    config.lowMin = randomInt(10, Math.floor(config.highMin * 0.7), rng)
    config.lowMax = randomInt(config.lowMin, Math.floor(config.highMin * 0.9), rng)
    config.peakMin = randomInt(1, 4, rng)
    config.peakMax = randomInt(config.peakMin + 1, 10)
    config.peakWidth = randomInt(100, 300, rng)
    config.chaikinTimes = randomInt(2, 3)
}

export function makePalette(
    rng: Rng,
    count: number,
    config: WavyBumpsConfig['colors'],
): BumpsPalette {
    if (config.regenerate) {
        decideColorScheme(rng, config)
    } else {
        rng()
    }
    const { hue, addHue, lessSaturated } = config

    console.log({ hue, addHue, lessSaturated })

    const l1 = 0.35
    const l2 = 0.85
    const chromaVal = 0.08

    const colorAt = (amt: number) => {
        return chroma.oklch(l1 + (l2 - l1) * amt, chromaVal, hue + addHue * amt)
    }

    let mixAmt = 0
    function nextColor() {
        const c = colorAt(mixAmt).set(
            'oklch.c',
            lessSaturated ? `*${rng(0.7, 1.5)}` : `*${rng(1.2, 2)}`,
        )
        mixAmt = (mixAmt + rng(0.55, 0.75)) % 1
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
    const { peakWidth, lowMin, spacing, highMax } = C.bumps
    const { density } = C.field
    const { overlap } = C.waves
    const fieldStepY = 100 / density.y

    const rowGap = Math.max(0, spacing - lowMin)
    const margin = Math.max(spacing, fieldStepY * 2)

    const rowsBelow = Math.ceil(highMax / spacing)
    return {
        rowCount: Math.ceil(height / spacing) + 1 + rowsBelow,
        rowsBelow,
        sizes,
        bounds: {
            xStart: -peakWidth,
            xEnd: width + peakWidth,
            peakXStart: Math.trunc(-peakWidth * 0.5),
            peakXEnd: Math.trunc(width + peakWidth * 0.5),
        },
        overlapY: overlap ? Math.ceil(spacing + (spacing - lowMin)) : 0,
        // overlapY: overlap ? Math.ceil(rowGap + margin) : 0,
        fieldStepX: 100 / density.x,
        fieldStepY,
    }
}

export function makeScene(config: WavyBumpsConfig, sizes: Sizes, seed: number): BumpsScene {
    console.log('SEED: ', seed)
    const rng = makeRng(seed)
    const noise = createNoise2D(rng)

    if (config.bumps.regenerate) decideBumps(rng, config.bumps)

    const layout = makeLayout(sizes, config)
    const palette = makePalette(makeRng(makeRandomSeed(rng)), layout.rowCount, config.colors)

    return { config, rng, noise, layout, palette }
}
