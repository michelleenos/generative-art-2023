type NoiseFn = (x: number, y: number) => number

export interface SilhouetteParams {
    baseY: number
    steps: number
    xStep: number
    freqX: number
    freqY: number
    noise: NoiseFn
    /** Animation hook: wire into a 3rd noise dimension to move the wave over time. */
    t?: number
}

export interface Silhouette {
    baseY: number
    /** x position of step index `xi`. */
    xAt(xi: number): number
    /**
     * Height of the wave at step `xi`, as a magnitude independent of any
     * stroke's amplitude. This is the "shape" — query it to place strokes by
     * height, avoid peaks, etc.
     */
    sampleAt(xi: number): number
}

/**
 * The line's shape as data. This is the ONLY place noise is sampled, so
 * animating the silhouette later (2D noise -> createNoise3D with `t`) is a
 * one-line change here — nothing downstream needs to know about time.
 */
export function buildSilhouette({
    baseY,
    steps,
    xStep,
    freqX,
    freqY,
    noise,
    t = 0,
}: SilhouetteParams): Silhouette {
    void t // reserved for animation; unused while noise is 2D
    const sampleNoise = (x: number, y: number) => noise(x, y)

    return {
        baseY,
        xAt(xi) {
            return xStep * xi
        },
        sampleAt(xi) {
            const x = xStep * xi
            const p = xi / steps
            // triangle envelope: 0 at the edges, 1 in the middle
            const amt = p > 0.5 ? 1 - (p - 0.5) * 2 : p * 2
            const n = sampleNoise(x * freqX, baseY * freqY)
            return Math.abs(n) * amt
        },
    }
}
