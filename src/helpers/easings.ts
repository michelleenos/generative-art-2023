// https://github.com/AndrewRayCode/easing-utils/blob/master/src/easing.js
// https://github.com/Michaelangel007/easing#tldr-shut-up-and-show-me-the-code
// easings.net

const easings = {
    inSine: (x) => Math.sin(x * (Math.PI / 2)),
    outSine: (x) => Math.sin(x * (Math.PI / 2)),
    inOutSine: (x) => -0.5 * (Math.cos(Math.PI * x) - 1),
    inQuad: (x) => x * x,
    outQuad: (x) => x * (2 - x),
    inOutQuad: (x) => (x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x),
    inCubic: (x) => x * x * x,
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    inQuart: (x) => x * x * x * x,
    outQuart: (x) => 1 - Math.pow(1 - x, 4),
    inCirc: (x) => 1 - Math.sqrt(1 - x * x),
    outCirc: (x) => Math.sqrt(1 - Math.pow(x - 1, 2)),
    inOutCirc: (x) =>
        x < 0.5
            ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
            : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2,
}

export default easings
