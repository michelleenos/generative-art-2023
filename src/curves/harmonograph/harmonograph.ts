import '../../style.css'
import { Pane } from 'tweakpane'
import createCanvas from '~/helpers/canvas/createCanvas'

let width = window.innerWidth
let height = window.innerHeight
let { ctx } = createCanvas(window.innerWidth, window.innerHeight)

const PARAMS = {
    A: height * 0.4,
    B: height * 0.4,
    a: 3,
    b: 5,
    p1: 5,
    p2: 8.5,
    d1: 0.01,
    d2: 0.01,
    delta: 1,
    iter: 5000,
    shape: 'liss',
}

let pane = new Pane()
pane.addInput(PARAMS, 'A', {
    min: 0,
    max: height * 0.5,
    label: 'Amplitude A',
    step: 1,
})
pane.addInput(PARAMS, 'B', {
    min: 0,
    max: height * 0.5,
    label: 'Amplitude B',
    step: 1,
})
pane.addInput(PARAMS, 'a', { min: 0, max: 10, label: 'Frequency A', step: 0.1 })
pane.addInput(PARAMS, 'b', { min: 0, max: 10, label: 'Frequency B', step: 0.1 })
pane.addInput(PARAMS, 'p1', { min: 0, max: 10, label: 'phasing A', step: 0.1 })
pane.addInput(PARAMS, 'p2', { min: 0, max: 10, label: 'phasing B', step: 0.1 })
pane.addInput(PARAMS, 'd1', {
    min: 0,
    max: 0.1,
    step: 0.001,
    label: 'damping A',
})
pane.addInput(PARAMS, 'd2', {
    min: 0,
    max: 0.1,
    step: 0.001,
    label: 'damping B',
})
pane.addInput(PARAMS, 'iter', {
    min: 0,
    max: 40000,
    step: 1,
    label: 'iterations',
})
pane.addInput(PARAMS, 'delta', {
    min: 0,
    max: 10,
    step: 0.1,
    label: 'delta',
})
pane.on('change', () => {
    ctx.clearRect(-width / 2, -height / 2, width, height)

    if (PARAMS.shape == 'liss') {
        liss(0, 0, PARAMS.A, PARAMS.B, PARAMS.a, PARAMS.b, PARAMS.delta)
    } else {
        harmonograph(
            0,
            0,
            PARAMS.A,
            PARAMS.B,
            PARAMS.a,
            PARAMS.b,
            PARAMS.p1,
            PARAMS.p2,
            PARAMS.d1,
            PARAMS.d2,
            PARAMS.iter
        )
    }
})

// lissajous curve
// A & B = amplitude of the wave on each axis
// a & b = frequency on each axis
// d = delta, puts x out of phase with y
function liss(cx: number, cy: number, A: number, B: number, a: number, b: number, d: number) {
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
    ctx.stroke()
}

// p1 & p2 = "phases" (same thing as d above, except now we use them on both axes)
// d1 & d2 = damping (simulating a pendulum slowing down over time)
// for best results...
// keep a & b close to whole number, but let them vary by a small amount like 0.1
// and/or make a & B have a simple ratio like 1:2 or 1:3 (and try adding a tiny bit to one of them)
function harmonograph(
    cx: number,
    cy: number,
    A: number,
    B: number,
    a: number,
    b: number,
    p1: number,
    p2: number,
    d1: number,
    d2: number,
    iter: number
) {
    let res = 0.01
    ctx.beginPath()
    for (let t = 0; t < iter; t += res) {
        let x = cx + Math.sin(a * t + p1) * A * damping(d1, t)
        let y = cy + Math.sin(b * t + p2) * B * damping(d2, t)
        ctx.lineTo(x, y)
        t += res
    }
    ctx.stroke()
}

function damping(d: number, t: number) {
    return Math.pow(Math.E, -d * t)
}

ctx.strokeStyle = '#fff'
ctx.lineWidth = 0.5
ctx.translate(width / 2, height / 2)
liss(0, 0, PARAMS.A, PARAMS.B, PARAMS.a, PARAMS.b, PARAMS.delta)
// harmonograph(
//     0,
//     0,
//     PARAMS.A,
//     PARAMS.B,
//     PARAMS.a,
//     PARAMS.b,
//     PARAMS.p1,
//     PARAMS.p2,
//     PARAMS.d1,
//     PARAMS.d2,
//     PARAMS.iter
// )
