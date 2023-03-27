import '../style.css'

function createCanvas(width, height) {
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

// lissajous curve
// A & B = amplitude of the wave on each axis
// a & b = frequency on each axis
// d = delta, puts x out of phase with y
function liss(cx, cy, A, B, a, b, d) {
    let res = 0.01
    ctx.beginPath()

    // when a & b are integers, the shape is complete when t is 2 * PI
    // when they're not integers, it can take much longer
    for (let t = 0; t < Math.PI * 7; t += res) {
        let x = cx + Math.sin(a * t + d) * A
        let y = cy + Math.sin(b * t) * B
        ctx.lineTo(x, y)
    }
    // ctx.closePath()
}

// p1 & p2 = "phases" (same thing as d above, except now we use them on both axes)
// d1 & d2 = damping (simulating a pendulum slowing down over time)
function harmonograph(cx, cy, A, B, a, b, p1, p2, d1, d2, iter) {
    let res = 0.01
    for (let t = 0; t < iter; t += res) {
        let x = cx + Math.sin(a * t + p1) * A * damping(d1, t)
        let y = cy + Math.sin(b * t + p2) * B * damping(d2, t)
        ctx.lineTo(x, y)
        t += res
    }
    ctx.stroke()
}

function damping(d, t) {
    return Math.pow(Math.E, -d * t)
}

function loop(cb) {
    let t = 0
    const animation = () => {
        cb(t)
        t++
        requestAnimationFrame(animation)
    }

    requestAnimationFrame(animation)
}

function circleOnLiss(t) {
    let w = 400
    let h = 400
    let a = 13
    let b = 2.5

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#fff'
    let x = w / 2 + Math.sin(a * t * 0.01) * 100
    let y = h / 2 + Math.sin(b * t * 0.01) * 100
    ellipse(x, y, 20, 20)
    ctx.stroke()
}

ctx.strokeStyle = '#fff'
ctx.translate(width / 2, height / 2)
let A = height * 0.4
let B = height * 0.4
// liss(0, 0, width * 0.4, height * 0.4, 1, 3, 2)

function harmExample() {
    let a = 1
    let b = 6
    let p1 = 1
    let p2 = 5
    let d1 = 0.01
    let d2 = 0.005
    let iter = 1000
    ctx.lineWidth = 0.5
    ctx.strokeStyle = '#fff'
    harmonograph(0, 0, A, B, a, b, p1, p2, d1, d2, iter)
}

harmExample()
