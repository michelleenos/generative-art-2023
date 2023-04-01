import '../../style.css'

// https://www.bit-101.com/blog/2022/11/coding-curves-03-arcs-circles-ellipses/

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

let width = 800
let height = 800

let { canvas, ctx } = createCanvas(width, height)

function sector(cx, cy, r, start, end, counterclockwise = false) {
    arc(cx, cy, r, start, end, counterclockwise)
    ctx.lineTo(cx, cy)
    ctx.closePath()
}

function segment(cx, cy, r, start, end, counterclockwise = false) {
    arc(cx, cy, r, start, end, counterclockwise)
    ctx.closePath()
}

function arc(cx, cy, r, start, end, counterclockwise = false) {
    let res = 4 / r
    if (counterclockwise) [start, end] = [end, start]

    while (end < start) {
        end += Math.PI * 2
    }
    ctx.beginPath()
    for (let angle = start; angle < end; angle += res) {
        ctx.lineTo(Math.cos(angle) * r + cx, Math.sin(angle) * r + cy)
    }
}

function polygon(cx, cy, r, sides, rotation = 0) {
    let step = (Math.PI * 2) / sides
    ctx.beginPath()
    for (let i = 0; i < sides; i++) {
        ctx.lineTo(cx + Math.cos(i * step + rotation) * r, cy + Math.sin(i * step + rotation) * r)
    }
    ctx.closePath()
}

function ellipse(cx, cy, rx, ry) {
    let res = Math.max(rx, ry) < 6 ? 0.1 : 4 / Math.max(rx, ry)
    ctx.beginPath()

    for (let angle = 0; angle < Math.PI * 2; angle += res) {
        ctx.lineTo(cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry)
    }
    ctx.closePath()
}

ctx.strokeStyle = '#fff'
ctx.translate(width / 2, height / 2)
arc(-300, -300, 50, 0, 4)
ctx.stroke()
segment(-150, -300, 50, -1, 2)
ctx.stroke()
sector(0, -300, 50, 3, 5)
ctx.stroke()

polygon(-250, -150, 80, 5)
ctx.stroke()

polygon(-70, -150, 80, 6)
ctx.stroke()

polygon(140, -150, 80, 7, 1)
ctx.stroke()

polygon(-250, 0, 50, 5)
ctx.stroke()

polygon(-150, 0, 50, 5, 0.1)
ctx.stroke()

polygon(-50, 0, 50, 5, 0.2)
ctx.stroke()

polygon(50, 0, 50, 5, 0.3)
ctx.stroke()

ellipse(-250, 150, 50, 80)
ctx.stroke()

ellipse(-250, 150, 80, 50)
ctx.stroke()
