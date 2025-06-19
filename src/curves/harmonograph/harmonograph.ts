import '../../style.css'
import { Pane } from 'tweakpane'
import createCanvas from '~/helpers/create-canvas'
import { Controller, GUI } from 'lil-gui'

let width = window.innerWidth
let height = window.innerHeight
let { ctx } = createCanvas(window.innerWidth, window.innerHeight)

const PARAMS = {
    amp1: height * 0.4,
    amp2: height * 0.4,
    freq1: 3.99,
    freq2: 4.01,
    p1: 0.5,
    p2: 1.7,
    d1: 0.001,
    d2: 0.002,
    iter: 50000,
    shape: 'harmonograph',
}

let harmControls: Controller[] = []

const gui = new GUI()
gui.add(PARAMS, 'amp1', 0, height * 0.5, 1)
gui.add(PARAMS, 'amp2', 0, height * 0.5, 1)
gui.add(PARAMS, 'freq1', 0, 10, 0.01)
gui.add(PARAMS, 'freq2', 0, 10, 0.01)
gui.add(PARAMS, 'p1', 0, 10, 0.1).name('phase 1')
harmControls.push(gui.add(PARAMS, 'p2', 0, 10, 0.1).name('phase 2'))
harmControls.push(gui.add(PARAMS, 'd1', 0, 0.1, 0.001).name('damping 1'))
harmControls.push(gui.add(PARAMS, 'd2', 0, 0.1, 0.001).name('damping 2'))
gui.add(PARAMS, 'iter', 0, 100000, 1).name('iterations')
gui.add(PARAMS, 'shape', ['lissajous', 'harmonograph']).onChange(
    (val: 'lissajous' | 'harmonograph') => {
        if (val == 'lissajous') {
            harmControls.forEach((c) => c.disable())
        } else {
            harmControls.forEach((c) => c.enable())
        }
    }
)
gui.onChange(draw)

function draw() {
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 0.5
    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.clearRect(-width / 2, -height / 2, width, height)

    if (PARAMS.shape == 'lissajous') {
        liss()
    } else {
        harmonograph()
    }
    ctx.restore()
}

// lissajous curve
// amp = amplitude of the wave on each axis
// freq = frequency on each axis
// p1 = delta, puts x out of phase with y
function liss() {
    let { amp1, amp2, freq1, freq2, p1, iter } = PARAMS
    let res = 0.01
    ctx.beginPath()

    // when a & b are integers, the shape is complete when t is 2 * PI
    // when they're not integers, it can take much longer
    for (let i = 0; i < iter; i++) {
        let t = i * res
        let x = Math.sin(freq1 * t + p1) * amp1
        let y = Math.sin(freq2 * t) * amp2
        ctx.lineTo(x, y)
    }

    // ctx.closePath()
    ctx.stroke()
}

// p1 & p2 = "phases" (same thing as delta/p1 above, except now we use them on both axes)
// dx & dy = damping (simulating a pendulum slowing down over time)
// for best results...
// keep frequencies a & b close to whole number, but let them vary by a small amount like 0.1
// and/or make a & B have a simple ratio like 1:2 or 1:3 (and try adding a tiny bit to one of them)
function harmonograph() {
    let { amp1, amp2, freq1, freq2, p1, p2, d1, d2, iter } = PARAMS
    let res = 0.01
    ctx.beginPath()
    for (let i = 0; i < iter; i++) {
        let t = i * res
        let x = Math.sin(freq1 * t + p1) * amp1 * damping(d1, t)
        let y = Math.sin(freq2 * t + p2) * amp2 * damping(d2, t)
        ctx.lineTo(x, y)
    }
    ctx.stroke()
}

function damping(d: number, t: number) {
    return Math.pow(Math.E, -d * t)
}

ctx.strokeStyle = '#fff'
ctx.lineWidth = 0.5
draw()
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
