// https://github.com/AndrewRayCode/easing-utils/blob/master/src/easing.js
// https://github.com/Michaelangel007/easing#tldr-shut-up-and-show-me-the-code
// easings.net

const easings = {
    inSine: (x: number) => 1 - Math.cos((x * Math.PI) / 2),
    outSine: (x: number) => Math.sin((x * Math.PI) / 2),
    inOutSine: (x: number) => -0.5 * (Math.cos(Math.PI * x) - 1),
    inQuad: (x: number) => x * x,
    outQuad: (x: number) => 1 - (1 - x) * (1 - x),
    inOutQuad: (x: number) => (x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x),
    inCubic: (x: number) => x * x * x,
    outCubic: (x: number) => 1 - Math.pow(1 - x, 3),
    inOutCubic: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    inQuart: (x: number) => x * x * x * x,
    outQuart: (x: number) => 1 - Math.pow(1 - x, 4),
    inOutQuart: (x: number) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
    inQuint: (x: number) => x * x * x * x * x,
    outQuint: (x: number) => 1 - Math.pow(1 - x, 5),
    inOutQuint: (x: number) => (x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2),
    inExpo: (x: number) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10)),
    outExpo: (x: number) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inCirc: (x: number) => 1 - Math.sqrt(1 - x * x),
    outCirc: (x: number) => Math.sqrt(1 - Math.pow(x - 1, 2)),
    inOutCirc: (x: number) =>
        x < 0.5
            ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
            : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2,
    outSquareRoot: (x: number) => Math.sqrt(x),
    inSquareRoot: (x: number) => 1 - Math.sqrt(1 - x),
    linear: (x: number) => x,
}

export type Easing = keyof typeof easings

export default easings
