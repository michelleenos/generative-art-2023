import '../../style.css'
import createCanvas from '~/helpers/canvas/createCanvas'

// https://www.bit-101.com/blog/2022/11/coding-curves-03-arcs-circles-ellipses/

let width = 800
let height = 800

let { ctx } = createCanvas(width, height)

function sector(
    cx: number,
    cy: number,
    r: number,
    start: number,
    end: number,
    counterclockwise = false
) {
    arc(cx, cy, r, start, end, counterclockwise)
    ctx.lineTo(cx, cy)
    ctx.closePath()
}

function segment(
    cx: number,
    cy: number,
    r: number,
    start: number,
    end: number,
    counterclockwise = false
) {
    arc(cx, cy, r, start, end, counterclockwise)
    ctx.closePath()
}

function arc(
    cx: number,
    cy: number,
    r: number,
    start: number,
    end: number,
    counterclockwise = false
) {
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

function polygon(cx: number, cy: number, r: number, sides: number, rotation = 0) {
    let step = (Math.PI * 2) / sides
    ctx.beginPath()
    for (let i = 0; i < sides; i++) {
        ctx.lineTo(cx + Math.cos(i * step + rotation) * r, cy + Math.sin(i * step + rotation) * r)
    }
    ctx.closePath()
}

function ellipse(cx: number, cy: number, rx: number, ry: number) {
    let res = Math.max(rx, ry) < 6 ? 0.1 : 4 / Math.max(rx, ry)
    ctx.beginPath()

    for (let angle = 0; angle < Math.PI * 2; angle += res) {
        ctx.lineTo(cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry)
    }
    ctx.closePath()
}

ctx.strokeStyle = '#fff'
ctx.fillStyle = '#fff'
ctx.translate(width / 2, height / 2)
arc(-300, -300, 50, 0, Math.PI * 1.5)
ctx.stroke()
ctx.fillText('arc', -330, -360)

segment(-150, -300, 50, -1, 2)
ctx.stroke()
ctx.fillText('segment', -170, -350)

sector(0, -300, 50, 3, 5)
ctx.stroke()
ctx.fillText('sector', -20, -360)

ctx.fillText('polygons', -300, -190)

polygon(-250, -120, 80, 5)
ctx.stroke()

polygon(-70, -120, 80, 6)
ctx.stroke()

ctx.fillText('polygon with rotation', 100, -210)
polygon(140, -120, 80, 7, 1)
ctx.stroke()

polygon(-250, 30, 50, 5)
ctx.stroke()

polygon(-150, 30, 50, 5, 0.1)
ctx.stroke()

polygon(-50, 30, 50, 5, 0.2)
ctx.stroke()

polygon(50, 30, 50, 5, 0.3)
ctx.stroke()

ctx.fillText('ellipses', -310, 120)
ellipse(-250, 200, 50, 80)
ctx.stroke()

ellipse(-250, 200, 80, 50)
ctx.stroke()
