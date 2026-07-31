import { NoiseFunction2D } from 'simplex-noise'
import { Easing } from '~/helpers/easings'

export interface SilhouetteParams {
    baseY: number
    steps: number
    xStep: number
    freqX: number
    freqY: number
    noise: NoiseFunction2D

    t?: number
}

export interface SilhouetteDataPt {
    x: number
    n: number
    p: number
}

export function silhouetteData({
    baseY,
    steps,
    xStep,
    freqX,
    freqY,
    noise,
    t = 0,
}: SilhouetteParams) {
    const points: SilhouetteDataPt[] = []

    for (let xi = 0; xi < steps + 1; xi++) {
        const x = xStep * xi
        const p = xi / steps
        const n = noise(x * freqX, baseY * freqY)
        points.push({ x, p, n })
    }

    return points
}
