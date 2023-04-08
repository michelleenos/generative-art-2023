import '../../style.css'
import createCanvas from '~/helpers/canvas/createCanvas'

// https://www.bit-101.com/blog/2022/12/coding-curves-08-bezier-curves/

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

function quadBezierOne(a0, a1, a2, t) {
    let m = 1 - t
    return m * m * a0 + 2 * m * t * a1 + t * t * a2
}

function quadBezierPoint(x0, y0, x1, y1, x2, y2, t) {
    return { x: quadBezierOne(x0, x1, x2, t), y: quadBezierOne(y0, y1, y2, t) }
}

function quadCurve(x0, y0, x1, y1, x2, y2, res) {
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    for (let t = res; t <= 1; t += res) {
        let { x, y } = quadBezierPoint(x0, y0, x1, y1, x2, y2, t)
        ctx.lineTo(x, y)
    }
    ctx.lineTo(x2, y2)
}

function cubicBezierOne(a0, a1, a2, a3, t) {
    let m = 1 - t
    return m * m * m * a0 + 3 * m * m * t * a1 + 3 * m * t * t * a2 + t * t * t * a3
}

function cubicBezierPoint(x0, y0, x1, y1, x2, y2, x3, y3, t) {
    let x = cubicBezierOne(x0, x1, x2, x3, t)
    let y = cubicBezierOne(y0, y1, y2, y3, t)
    return { x, y }
}

function cubicCurve(x0, y0, x1, y1, x2, y2, x3, y3, res) {
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    for (let t = res; t <= 1; t += res) {
        let { x, y } = cubicBezierPoint(x0, y0, x1, y1, x2, y2, x3, y3, t)
        ctx.lineTo(x, y)
    }
    ctx.lineTo(x3, y3)
}

ctx.strokeStyle = '#fff'
ctx.fillStyle = '#fff'

let finalT = 0
let dt = 0.01
let res = 0.025
let x0 = 100
let x1 = 200
let x2 = 250
let y0 = 50
let y1 = 150
let y2 = 200

function drawCurve() {
    ctx.clearRect(0, 0, width, height)
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    for (let t = res; t < finalT; t += res) {
        let { x, y } = quadBezierPoint(x0, y0, x1, y1, x2, y2, t)
        ctx.lineTo(x, y)
    }
    ctx.stroke()

    finalT += dt

    if (finalT > 1) {
        finalT = 1
        dt = -dt
    } else if (finalT < 0) {
        finalT = 0
        dt = -dt
    }

    requestAnimationFrame(loop)
}

// function circleOnCurve(t) {
//     ctx.clearRect(0, 0, width, height)
//     let { x, y } = quadBezierPoint(x0, y0, x1, y1, x2, y2, (Math.sin(t * 0.01) + 1) / 2)

//     ellipse(x, y, 5, 5)
//     ctx.fill()
// }

function loop(cb) {
    let t = 0
    const animate = () => {
        cb(t)
        t++
        requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
}

function multiCurve(points) {
    ctx.moveTo(points[0].x, points[0].y)
    let midX = (points[0].x + points[1].x) / 2
    let midY = (points[0].y + points[1].y) / 2
    ctx.lineTo(midX, midY)

    for (let i = 1; i < points.length - 1; i++) {
        let p0 = points[i]
        let p1 = points[i + 1]
        let midX = (p0.x + p1.x) / 2
        let midY = (p0.y + p1.y) / 2
        ctx.quadraticCurveTo(p0.x, p0.y, midX, midY)
    }

    let last = points[points.length - 1]
    ctx.lineTo(last.x, last.y)
}

function multiLoop(points) {
    // ctx.moveTo(points[0].x, points[0].y)
    let midX0 = (points[0].x + points[1].x) / 2
    let midY0 = (points[0].y + points[1].y) / 2
    ctx.moveTo(midX0, midY0)

    for (let i = 1; i < points.length - 1; i++) {
        let p0 = points[i]
        let p1 = points[i + 1]
        let midX = (p0.x + p1.x) / 2
        let midY = (p0.y + p1.y) / 2
        // ctx.strokeStyle = i === 0 ? '#f0f' : i === 1 ? '#ff0' : i === 3 ? '#00f' : '#fff'
        ctx.quadraticCurveTo(p0.x, p0.y, midX, midY)
    }

    let last = points[points.length - 1]
    // midpoint between last & first points to close the loop
    let midX1 = (last.x + points[0].x) / 2
    let midY1 = (last.y + points[0].y) / 2
    ctx.quadraticCurveTo(last.x, last.y, midX1, midY1)
    ctx.quadraticCurveTo(points[0].x, points[0].y, midX0, midY0)
}

type Point = { x: number; y: number }

let points: Point[] = []

// [
//     { x: 500, y: 200 },
//     { x: 200, y: 200 },
//     { x: 500, y: 700 },
//     { x: 700, y: 400 },
// ]

for (let i = 0; i < 5; i++) {
    points.push({ x: Math.floor(Math.random() * 800), y: Math.floor(Math.random() * 800) })
}

points.forEach((pt) => {
    ellipse(pt.x, pt.y, 5, 5)
    ctx.fill()
})

// multiCurve(points)
multiLoop(points)
ctx.stroke()

// cubicCurve(x0, y0, x1, y1, x2, y2, x3, y3, 0.01)
// ctx.stroke()
// quadCurve(x0, y0, x1, y1, x3, y3, 0.01)
// ctx.stroke()
