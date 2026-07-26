import easing from '~/helpers/easings'
import { WaveConfig, WavySmoothingConfig } from './config'
import { map } from '~/helpers/utils'
import { Vec2 } from '~/helpers/trig-shapes'
import { NoiseFunction3D } from 'simplex-noise'

interface GetPtParams {
    x: number
    baseY: number
    wave: WaveConfig
    /** progress of the taper (0-1) */
    progress: number
    /** time in milliseconds */
    time: number
    noise: NoiseFunction3D
}
export function getPt({ x, baseY, wave, progress: p, time, noise }: GetPtParams) {
    const { taper, ease, freqX, freqY, speed, amp, useAbs } = wave
    let amt = 1
    if (taper > 0) {
        amt = p < 0 || p > 1 ? 0 : p > 0.5 ? 1 - (p - 0.5) * 2 : p * 2
        amt = easing[ease](amt)
        amt = map(amt, 0, 1, 1 - taper, 1)
    }
    const n = noise(x * freqX, baseY * freqY, (time / 1000) * speed)
    let y = baseY
    if (useAbs) {
        y -= Math.abs(n) * amt * amp
    } else {
        y += n * amt * amp
    }
    return new Vec2(x, y)
}

interface BuildLinePointsParams {
    baseY: number
    /** time in milliseconds */
    time: number
    wave: WaveConfig
    noise: NoiseFunction3D
    steps: number
}

export function buildLinePoints({ baseY, time, wave, noise, steps }: BuildLinePointsParams) {
    const { xStep } = wave
    const pts: Vec2[] = []
    for (let xi = 0; xi <= steps + 1; xi++) {
        const x = xStep * xi
        pts.push(getPt({ x, baseY, progress: xi / (steps + 1), time, wave, noise }))
    }
    return pts
}

function smoothPts(pts: Vec2[], strength: number, taubinFactor: number | false = false) {
    const smoothed: Vec2[] = []
    smoothed.push(pts[0].copy())
    for (let i = 1; i < pts.length - 1; i++) {
        let prev = pts[i - 1]
        let next = pts[i + 1]
        let self = pts[i]
        const avgX = (prev.x + next.x) / 2
        const avgY = (prev.y + next.y) / 2
        const x = self.x + strength * (avgX - self.x)
        const y = self.y + strength * (avgY - self.y)
        smoothed.push(new Vec2(x, y))
    }
    smoothed.push(pts[pts.length - 1].copy())
    if (taubinFactor !== false && strength > 0) {
        return smoothPts(smoothed, -strength * taubinFactor)
    }
    return smoothed
}

export function smoothLinePoints(pts: Vec2[], config: WavySmoothingConfig) {
    const { strength, taubin, taubinAmt, times } = config
    if (strength === 0 || times === 0) return pts

    let smoothedPts = [...pts]
    for (let i = 0; i < times; i++) {
        smoothedPts = smoothPts(smoothedPts, strength, taubin ? taubinAmt : false)
    }

    return smoothedPts
}
