// https://github.com/AndrewRayCode/easing-utils/blob/master/src/easing.js
// https://github.com/Michaelangel007/easing#tldr-shut-up-and-show-me-the-code
// easings.net

const easings = {
    inSine: (x: number) => Math.sin(x * (Math.PI / 2)),
    outSine: (x: number) => Math.sin(x * (Math.PI / 2)),
    inOutSine: (x: number) => -0.5 * (Math.cos(Math.PI * x) - 1),
    inQuad: (x: number) => x * x,
    outQuad: (x: number) => x * (2 - x),
    inOutQuad: (x: number) => (x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x),
    inCubic: (x: number) => x * x * x,
    outCubic: (x: number) => 1 - Math.pow(1 - x, 3),
    inOutCubic: (x: number) =>
        x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
    inQuart: (x: number) => x * x * x * x,
    outQuart: (x: number) => 1 - Math.pow(1 - x, 4),
    inCirc: (x: number) => 1 - Math.sqrt(1 - x * x),
    outCirc: (x: number) => Math.sqrt(1 - Math.pow(x - 1, 2)),
    inOutCirc: (x: number) =>
        x < 0.5
            ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
            : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2,
}

export default easings
