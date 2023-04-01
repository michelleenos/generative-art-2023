import '../../style.css'

function createCanvas(
    width: number,
    height: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas')
    let resolution = window.devicePixelRatio
    canvas.width = width * resolution
    canvas.height = height * resolution
    canvas.style.position = 'absolute'
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    document.body.appendChild(canvas)

    let ctx = canvas.getContext('2d')!
    ctx.scale(resolution, resolution)
    return { canvas, ctx }
}

let width = window.innerWidth
let height = window.innerHeight

let { canvas, ctx } = createCanvas(width, height)

function ellipse(cx, cy, rx, ry) {
    let res = Math.max(rx, ry) < 6 ? 0.1 : 4 / Math.max(rx, ry)
    ctx.beginPath()

    for (let angle = 0; angle < Math.PI * 2; angle += res) {
        ctx.lineTo(cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry)
    }
    ctx.closePath()
}

// trochoid
// x = a * t - b * sin(t)
// y = a - b * cos(t)

// epitrochoid
// r0 = radius of fixed circle / r1 = radius of moving circle
// t = angle / d = distance from the center of the moving circle to the drawing point
// for an epicycloid d is the same as r1 (it's a point on the moving circle)
// x = (r0 + r1) * cos(t) - d * cos(((r0 + r1) * t) / r1)
// y = (r0 + r1) * sin(t) - d * sin(((r0 + r1) * t) / r1)

ctx.strokeStyle = '#fff'
// ctx.translate(width / 2, height / 2)
ctx.translate(0, height / 2)
ctx.scale(1, -1)
ctx.stroke()

trochoid(50, 50)

function trochoid(radius, lineLen) {
    let res = 0.05
    ctx.beginPath()
    // t is the angle of rotation of the circle
    // but also somehow the distance it's traveled along the line?
    for (let t = 0; t < width; t += res) {
        let x = radius * t - lineLen * Math.sin(t)
        let y = radius - lineLen * Math.cos(t)
        ctx.lineTo(x, y)
    }
    ctx.stroke()
}

function gcf(x, y) {
    let result = Math.min(x, y)
    while (result > 0) {
        if (x % result === 0 && y % result === 0) {
            break
        }
        result--
    }
    return result
}

function simplify(num, denom) {
    let factor = gcf(num, denom)
    return { num: num / factor, denom: denom / factor }
}

function epitrochoid(r0, r1, d) {
    let res = 0.05
    ellipse(0, 0, r0, r0)
    ctx.stroke()

    // find the number of steps necessary to close the loop
    // works as long as the two radius vals are whole numbers
    let { denom } = simplify(r0, r1)
    let steps = Math.ceil(Math.PI * 2 * denom)

    ctx.beginPath()
    for (let t = 0; t <= steps; t += res) {
        let x = (r0 + r1) * Math.cos(t) - d * Math.cos(((r0 + r1) * t) / r1)
        let y = (r0 + r1) * Math.sin(t) - d * Math.sin(((r0 + r1) * t) / r1)
        ctx.lineTo(x, y)
    }
    ctx.stroke()
}
