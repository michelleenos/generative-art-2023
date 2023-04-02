import '../../style.css'
import createCanvas from '~/helpers/canvas/createCanvas/createCanvas'

// https://www.bit-101.com/blog/2022/11/coding-curves/

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

function drawAxes() {
    ctx.save()
    ctx.lineWidth = 0.25
    ctx.beginPath()
    ctx.moveTo(-width, 0)
    ctx.lineTo(width, 0)
    ctx.moveTo(0, -height)
    ctx.lineTo(0, height)
    ctx.stroke()
    ctx.restore()
}

// y = a * x * x
function parabolaSimple(a = 0.003) {
    ctx.beginPath()
    for (let x = -width / 2; x <= width / 2; x++) {
        let y = a * x * x
        ctx.lineTo(x, y)
    }
    ctx.stroke()

    // draw focus point
    let focusX = 0
    let focusY = 1 / (4 * a)
    ellipse(focusX, focusY, 10, 10)
    ctx.fill()

    // directrix
    let directrixY = -1 / (4 * a)
    ctx.moveTo(-width / 2, directrixY)
    ctx.lineTo(width / 2, directrixY)
    ctx.stroke()

    function equalLines() {
        // draw lines from point on the parabola to the directrix
        // and point on parabola to focus
        // distance of these 2 lines at each point is equal
        ctx.lineWidth = 0.5
        for (let x = -width / 2; x <= width / 2; x += 40) {
            let y = a * x * x
            ellipse(x, y, 4, 4)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(x, directrixY)
            ctx.lineTo(x, y)
            ctx.lineTo(0, focusY)
            ctx.stroke()
        }
    }

    // x0 = fixed point on the parabola
    // x1 = a point on the tangent line (can be anywhere basically)
    function tangentPoint(x0, x1) {
        return 2 * a * x0 * x1 - a * x0 * x0
    }

    function tangentLine(x0) {
        let y0 = a * x0 * x0
        ellipse(x0, y0, 4, 4)
        ctx.fill()

        // find a point on the left of the canvas
        let x1 = -width / 2
        let y1 = tangentPoint(x0, x1)

        // and one on the far right
        let x2 = width / 2
        let y2 = tangentPoint(x0, x2)

        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
    }

    function tangentLines() {
        ctx.lineWidth = 0.25
        for (let x = -width / 2; x <= width / 2; x += 25) {
            tangentLine(x)
        }
    }

    tangentLines()
    // equalLines()
}

// y = a * x * x + b * x + c --> standard quadratic form (ax^2 + bx + c)
function parabolaQuadratic(a = 0.003, b, c) {
    ctx.beginPath()
    for (let x = -width / 2; x <= width / 2; x++) {
        let y = a * x * x + b * x + c
        ctx.lineTo(x, y)
    }
    ctx.stroke()

    // vertex
    let vx = -b / (2 * a)
    let vy = a * vx * vx + b * vx + c
    ellipse(vx, vy, 10, 10)
    ctx.fill()

    // then you could find it with vertex form
    // parabolaVertex(a, vx, vy)
}

// y = a(x - h)^2 + k --> vertex form (vertex point is h, k)
function parabolaVertex(a, h, k) {
    ctx.beginPath()
    for (let x = -width / 2; x <= width / 2; x++) {
        let y = a * (x - h) * (x - h) + k
        ctx.lineTo(x, y)
    }
    ctx.stroke()

    // focus
    let fx = h
    let fy = k + 1 / (4 * a)
    ellipse(fx, fy, 8, 8)
    ctx.fill()

    // directrix
    let dy = k - 1 / (4 * a)
    ctx.moveTo(-width / 2, dy)
    ctx.lineTo(width / 2, dy)
    ctx.stroke()

    // x0 = fixed point on the parabola
    // x1 = a point on the tangent line (can be anywhere basically)
    function tangentPoint(x0, x1) {
        return 2 * a * x0 * x1 - a * (x0 - h) * (x0 - h) + k
    }

    function tangentLine(x0) {
        let y0 = a * (x0 - h) * (x0 - h) + k
        ellipse(x0, y0, 4, 4)
        ctx.fill()

        // find a point on the left of the canvas
        let x1 = -width / 2
        let y1 = tangentPoint(x0, x1)

        // and one on the far right
        let x2 = width / 2
        let y2 = tangentPoint(x0, x2)

        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
    }

    for (let x = -width / 2; x <= width / 2; x += 50) {
        tangentLine(x)
    }
}

ctx.strokeStyle = '#fff'
ctx.fillStyle = '#fff'
ctx.translate(width / 2, height / 2)
ctx.scale(1, -1)
drawAxes()

// parabolaSimple(0.002)
// parabolaQuadratic(0.003, -1.5, 100)
parabolaVertex(0.003, 0, -200)
