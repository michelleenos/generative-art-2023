import { getVariantsFromSinglePalette, PaletteName, palettes } from 'mish-bainrow'
import { Easing } from '~/helpers/easings'
import { makeRng } from '~/helpers/prng'
import { randomInt, shuffle } from '~/helpers/utils'

function getColors(rng: ReturnType<typeof makeRng>, grayscaleChance = 0.3) {
    const isGrayscale = rng() < grayscaleChance

    if (isGrayscale) {
        return { bg: '#f3f2f1', colors: ['#121212'], name: 'grayscale' }
    }

    const palName: PaletteName = rng(['mountains', 'brain', 'earthGem1', 'squiggles'])
    let palette = rng(
        getVariantsFromSinglePalette(palettes[palName], {
            isolateColors: true,
            minContrastBg: 2,
            bgColor: { maxChroma: 0.11 },
        }),
    )
    if (palette.colors.length > 4) {
        const shuffled = shuffle([...palette.colors], rng)
        const colors = shuffled.slice(0, 4)
        return { bg: palette.bg, colors, name: palette.name }
    }

    return { bg: palette.bg, colors: palette.colors, name: palette.name }
}

export type WavySmoothingConfig = {
    times: number
    strength: number
    taubin: boolean
    taubinAmt: number
}

export type WaveConfig = {
    speed: number
    useAbs: boolean
    freqX: number
    freqY: number
    amp: number
    taper: number
    ease: Easing
    xStep: number
    spacing: number
}

export type WavyConfig = {
    style: 'wavy' | 'wavy-in' | 'wiggly' | 'thin' | 'bigly'
    draw: {
        lineWidth: number
        palette: { bg: string; colors: string[]; name: string }
    }
    smoothing: WavySmoothingConfig
    wave: WaveConfig
}

export function getConfig(rng: ReturnType<typeof makeRng>): WavyConfig {
    let style: WavyConfig['style'] = rng([
        'wavy-in',
        'wavy-in',
        'wavy',
        'wavy',
        'wiggly',
        'wiggly',
        'thin',
        'bigly',
    ])
    const palette = getColors(rng, style === 'thin' ? 0.8 : 0.3)

    let smoothing: WavyConfig['smoothing'] = {
        times: randomInt(5, 10, rng),
        strength: rng(0.5, 0.65),
        taubin: true,
        taubinAmt: 1,
    }
    let wave: WavyConfig['wave'] = {
        ease: 'outQuart',
        freqX: 0.002,
        freqY: 0.001,
        speed: rng(0.2, 0.8),
        taper: 1,
        amp: 100,
        useAbs: true,
        xStep: 5,
        spacing: 20,
    }

    if (style === 'wavy' || style === 'wavy-in' || style === 'bigly') {
        wave.spacing = style === 'bigly' ? randomInt(60, 100, rng) : randomInt(5, 45, rng)
        let smallStep = rng() < 0.5
        wave.xStep = smallStep ? randomInt(7, 12, rng) : randomInt(12, 30, rng)
        smoothing.times = randomInt(3, 10, rng)
        smoothing.taubin = wave.xStep > 15 ? rng() < 0.5 : false

        if (style === 'wavy-in') {
            wave.amp = randomInt(100, 300, rng)
            wave.ease = 'inSquareRoot'
            if (smoothing.times >= 8) {
                smoothing.strength = rng(0.2, 0.4)
            }
            if (smallStep) {
                wave.freqX = rng(0.02, 0.04)
            } else {
                wave.freqX = rng(0.004, 0.005)
            }
            wave.freqY = rng(0.0005, 0.003)
        } else {
            wave.amp = smallStep ? randomInt(100, 150, rng) : randomInt(100, 250, rng)
            wave.freqX = wave.xStep <= 10 ? rng(0.005, 0.01) : rng(0.0015, 0.02)
            wave.freqY = rng(0.001, 0.002)
            if (wave.freqX < 0.003) {
                smoothing.times = 10
            }
        }
    } else if (style === 'wiggly') {
        wave.spacing = randomInt(10, 20, rng)
        wave.xStep = randomInt(7, 12, rng)
        smoothing = {
            times: randomInt(1, 7, rng),
            strength: 0.5,
            taubin: false,
            taubinAmt: 1,
        }
        wave.freqX = rng(0.012, 0.03)
        // wave.freqY = smoothing.times > 3 ? rng(0.007, 0.01) : rng(0.001, 0.003)
        wave.freqY = rng(0.001, 0.003)
        wave.amp = randomInt(50, 100, rng)
    } else {
        wave.spacing = randomInt(3, 7, rng)
        wave.xStep = randomInt(12, 70, rng)

        wave.freqX = rng(0.005, 0.01)
        wave.freqY = rng(0.007, 0.008)
        wave.taper = rng(0.5, 0.9)
        wave.amp = randomInt(70, 150, rng)
        smoothing.times = wave.xStep > 40 ? randomInt(0, 3, rng) : randomInt(2, 7, rng)
    }

    let lineWidth: number
    if (style === 'thin') {
        lineWidth = rng([1, 2])
    } else if (style === 'bigly') {
        lineWidth = randomInt(15, 30, rng)
    } else {
        lineWidth =
            wave.spacing > 20
                ? randomInt(4, 7, rng)
                : wave.spacing > 10
                  ? randomInt(2, 4, rng)
                  : randomInt(2, 3, rng)
    }
    return {
        style,
        draw: {
            lineWidth,
            palette,
        },
        smoothing,
        wave,
    }
}
