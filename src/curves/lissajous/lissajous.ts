import '../../style.css'
import { Pane } from 'tweakpane'
import createCanvas from '~/helpers/canvas/createCanvas'

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

const pane = new Pane()
const params = {
    cx: 0,
    cy: 0,
    A: 300,
    B: 100,
    a: 1,
    b: 3,
    d: 0,
}

pane.addInput(params, 'cx', { min: -width / 2, max: width / 2, step: 1 })
pane.addInput(params, 'cy', { min: -height / 2, max: height / 2, step: 1 })
pane.addInput(params, 'A', { min: 0, max: width * 0.4, label: 'Amplitude A', step: 1 })
pane.addInput(params, 'B', { min: 0, max: height * 0.4, label: 'Amplitude B', step: 1 })
pane.addInput(params, 'a', { min: 0, max: 20, label: 'Frequency A', step: 1 })
pane.addInput(params, 'b', { min: 0, max: 20, label: 'Frequency B', step: 1 })
pane.addInput(params, 'd', { min: 0, max: 20, label: 'Delta', step: 1 })

pane.on('change', () => {
    ctx.clearRect(-width / 2, -height / 2, width, height)
    liss(params.cx, params.cy, params.A, params.B, params.a, params.b, params.d)
    ctx.stroke()
})

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

ctx.lineWidth = 2
ctx.strokeStyle = '#fff'

ctx.translate(width / 2, height / 2)
liss(params.cx, params.cy, params.A, params.B, params.a, params.b, params.d)
ctx.stroke()

// function loop(cb) {
//     let t = 0
//     const animation = () => {
//         cb(t)
//         t++
//         requestAnimationFrame(animation)
//     }

//     requestAnimationFrame(animation)
// }

// function circleOnLiss(t) {
//     let w = 400
//     let h = 400
//     let a = 13
//     let b = 2.5

//     ctx.clearRect(0, 0, canvas.width, canvas.height)
//     ctx.strokeStyle = '#fff'
//     let x = w / 2 + Math.sin(a * t * 0.01) * 100
//     let y = h / 2 + Math.sin(b * t * 0.01) * 100
//     ellipse(x, y, 20, 20)
//     ctx.stroke()
// }
