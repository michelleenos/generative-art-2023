const lerp = (a, b, alpha) => a + alpha * (b - a)

const map = (num, inMin, inMax, outMin, outMax) =>
    ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin

const random = (min: number = 0, max: number = 1) =>
    Math.random() * (max - min) + min

const shuffle = (array: any[]) => {
    let currentIndex = array.length
    let randomIndex

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex -= 1
        ;[array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ]
    }

    return array
}

const constrain = (num, min, max) => Math.min(Math.max(num, min), max)

export { lerp, map, random, shuffle, constrain }
