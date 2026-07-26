/**
 *
 * @param a Seed - requires 32-bit integer (to produce one use `(Math.random() * 2 ** 32) >>> 0`)
 * @returns
 */
export function mulberry32(a: number = (Math.random() * 2 ** 32) >>> 0) {
    return function () {
        let t = (a += 0x6d2b79f5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export function makeRng(seed: number) {
    const next = mulberry32(seed)

    function random(): number
    function random(max: number): number
    function random(minOrMax: number, max: number): number
    function random<T>(array: readonly T[]): T
    function random<T>(numOrArray?: number | readonly T[], max?: number) {
        if (typeof numOrArray === 'undefined') {
            return next()
        }

        if (typeof numOrArray === 'number') {
            if (typeof max === 'undefined') {
                return next() * numOrArray
            }
            return next() * (max - numOrArray) + numOrArray
        }
        return numOrArray[Math.floor(next() * numOrArray.length)]
    }

    return random
}
