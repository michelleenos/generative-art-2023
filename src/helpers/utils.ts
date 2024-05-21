const lerp = (a: number, b: number, alpha: number) => a + alpha * (b - a)

const map = (num: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
    ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin

function random(): number
function random(max: number): number
function random(minOrMax: number, max: number): number
function random<T>(array: T[]): T

function random<T>(numOrArray?: number | T[], max?: number) {
    if (Array.isArray(numOrArray)) {
        return numOrArray[Math.floor(Math.random() * numOrArray.length)]
    }
    if (numOrArray === undefined) {
        return Math.random()
    }
    if (max === undefined) {
        return Math.random() * numOrArray
    }
    return Math.random() * (max - numOrArray) + numOrArray
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
}
