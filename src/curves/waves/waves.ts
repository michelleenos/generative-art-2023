import '../../style.css'
import { Pane } from 'tweakpane'
import createCanvas from '~/helpers/canvas/createCanvas'

// https://www.bit-101.com/blog/2022/11/coding-curves-02-trig-curves/

let width = window.innerWidth
let height = window.innerHeight

let { canvas, ctx } = createCanvas(width, height)

const PARAMS = {
    x0: 10,
    x1: width - 10,
    y0: 400,
    y1: 200,
    wavelength: 50,
    amplitude: 70,
}

const pane = new Pane()
pane.addInput(PARAMS, 'x0', { min: 0, max: width })
pane.addInput(PARAMS, 'x1', { min: 0, max: width })
pane.addInput(PARAMS, 'y0', { min: 0, max: height })
pane.addInput(PARAMS, 'y1', { min: 0, max: height })
pane.addInput(PARAMS, 'wavelength', { min: 0, max: width })
pane.addInput(PARAMS, 'amplitude', { min: 0, max: height + 200 })

pane.on('change', () => {
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = '#fff'
    sineWave(PARAMS.x0, PARAMS.y0, PARAMS.x1, PARAMS.y1, PARAMS.wavelength, PARAMS.amplitude)
})

function sineWave(x0, y0, x1, y1, wavelen, amp) {
    let dx = x1 - x0
    let dy = y1 - y0
    let dist = Math.sqrt(dx * dx + dy * dy)
    let angle = Math.atan2(dy, dx)

    ctx.save()
    ctx.translate(x0, y0)
    ctx.rotate(angle)
    ctx.beginPath()
    for (let x = 0; x < dist; x++) {
        let y = Math.sin((x / wavelen) * Math.PI * 2) * amp
        ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.restore()
}

ctx.strokeStyle = '#fff'
sineWave(10, 400, width - 10, 200, 50, 70)
