const lerp = (a: number, b: number, alpha: number) => a + alpha * (b - a)

const map = (num: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
    ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin

function random(): number
function random(max: number): number
function random(minOrMax: number, max: number): number
function random<T>(array: readonly T[]): T
function random<T>(numOrArray?: number | readonly T[], max?: number) {
    if (typeof numOrArray === 'undefined') {
        return Math.random()
    }

    if (typeof numOrArray === 'number') {
        if (typeof max === 'undefined') {
            return Math.random() * numOrArray
        }
        return Math.random() * (max - numOrArray) + numOrArray
    }

    return numOrArray[Math.floor(Math.random() * numOrArray.length)]
}

function step(edge: number, value: number) {
    return value < edge ? 0 : 1
}

function smoothstep(edge0: number, edge1: number, value: number) {
    const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)))
    return x * x * (3 - 2 * x)
}

function weightedRandom<T>(array: T[], weights: number[]): T {
    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0)
    const randomNum = Math.random() * totalWeight
    let weightSum = 0

    for (let i = 0; i < array.length; i++) {
        weightSum += weights[i]
        if (randomNum <= weightSum) {
            return array[i]
        }
    }

    return array[array.length - 1]
}

const shuffle = (array: any[]) => {
    let currentIndex = array.length
    let randomIndex

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex -= 1
        ;[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
    }

    return array
}

const round = (num: number, precision = 1) => {
    const factor = Math.pow(10, precision)
    return Math.round(num * factor) / factor
}

const roundToNearest = (n: number, nearest: number) => Math.round(n / nearest) * nearest

const ceilNearest = (n: number, nearest: number) => Math.ceil(n / nearest) * nearest

const floorNearest = (n: number, nearest: number) => Math.floor(n / nearest) * nearest

// (constrain & clamp are the same)
const constrain = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max)
const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max)

const mouseAngle = (mouse: { x: number; y: number }, width: number, height: number) =>
    Math.atan2(-mouse.y + height / 2, -mouse.x + width / 2) + Math.PI

const throttle = (fn: Function, wait: number = 300) => {
    let inThrottle: boolean = false

    return function (this: any) {
        const context = this
        const args = arguments

        if (inThrottle) {
            return
        }

        fn.apply(context, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), wait)
    }
}

// https://github.com/georgedoescode/generative-utils/blob/master/src/randomBias.js
const randomBias = (min: number, max: number, bias: number, influence = 0.5) => {
    const base = random(min, max)
    const mix = random(0, 1) * influence
    return base * (1 - mix) + bias * mix
}

function simplify(num: number, denom: number) {
    let factor = gcf(num, denom)
    return { num: num / factor, denom: denom / factor }
}

function gcf(x: number, y: number) {
    let result = Math.min(x, y)
    while (result > 1) {
        if (x % result === 0 && y % result === 0) {
            break
        }
        result--
    }
    return result
}

export {
    lerp,
    map,
    random,
    weightedRandom,
    shuffle,
    constrain,
    clamp,
    mouseAngle,
    round,
    throttle,
    step,
    smoothstep,
    randomBias,
    roundToNearest,
    ceilNearest,
    floorNearest,
    simplify,
    gcf,
}
