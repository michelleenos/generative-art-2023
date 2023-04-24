import '~/style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import { Pane } from 'tweakpane'

let width = window.innerWidth
let height = window.innerHeight
let { ctx } = createCanvas(window.innerWidth, window.innerHeight)

let min = Math.min(width, height)
ctx.translate(width / 2, height / 2)

type GuillocheRing = {
    radius: number
    nodes: number
    var: number
}

function guilloche(
    a: GuillocheRing,
    b: GuillocheRing,
    nodes: number,
    div: number,
    cx: number = 0,
    cy: number = 0
) {
    ctx.beginPath()
    for (let t = 0; t < Math.PI * 2 * div; t += 0.01) {
        let r0 = a.radius + Math.sin(t * a.nodes) * a.var
        let r1 = b.radius + Math.sin(t * b.nodes) * b.var
        let range = (r1 - r0) * 0.5
        let mid = r0 + range
        let radius = mid + Math.sin((t * nodes) / div) * range

        let x = radius * Math.cos(t) + cx
        let y = radius * Math.sin(t) + cy
        ctx.lineTo(x + cx, y + cy)
    }
    ctx.stroke()
}

const PARAMS = {
    a: {
        radius: min * 0.4,
        nodes: 12,
        var: 13,
    },

    b: {
        radius: min * 0.28,
        nodes: 7,
        var: 30,
    },

    c: {
        radius: min * 0.15,
        nodes: 6,
        var: 10,
    },

    d: {
        radius: min * 0.05,
        nodes: 11,
        var: 3,
    },
    nodesAB: 91,
    divAB: 37,
    drawAB: true,
    nodesBC: 81,
    divBC: 53,
    drawBC: true,
    nodesCD: 67,
    divCD: 21,
    drawCD: true,
}

const stepNodes = 1
const stepDiv = 0.1

const pane = new Pane()
let fa = pane.addFolder({ title: 'ring a' })
fa.addInput(PARAMS.a, 'radius', { min: 1, max: width, step: 1 })
fa.addInput(PARAMS.a, 'nodes', { min: 1, max: 100, step: 1 })
fa.addInput(PARAMS.a, 'var', { min: 1, max: 100, step: 1 })

let fab = pane.addFolder({ title: 'A > B' })
fab.addInput(PARAMS, 'nodesAB', { min: 1, max: 200, step: stepNodes })
fab.addInput(PARAMS, 'divAB', { min: 1, max: 200, step: stepDiv })
fab.addInput(PARAMS, 'drawAB')

let fb = pane.addFolder({ title: 'ring b' })
fb.addInput(PARAMS.b, 'radius', { min: 1, max: width, step: 1 })
fb.addInput(PARAMS.b, 'nodes', { min: 1, max: 100, step: 1 })
fb.addInput(PARAMS.b, 'var', { min: 1, max: 100, step: 1 })

let fbc = pane.addFolder({ title: 'B > C' })
fbc.addInput(PARAMS, 'nodesBC', { min: 1, max: 200, step: stepNodes })
fbc.addInput(PARAMS, 'divBC', { min: 1, max: 200, step: stepDiv })
fbc.addInput(PARAMS, 'drawBC')

let fc = pane.addFolder({ title: 'ring c' })
fc.addInput(PARAMS.c, 'radius', { min: 1, max: width, step: 1 })
fc.addInput(PARAMS.c, 'nodes', { min: 1, max: 100, step: 1 })
fc.addInput(PARAMS.c, 'var', { min: 1, max: 100, step: 1 })

let fcd = pane.addFolder({ title: 'C > D' })
fcd.addInput(PARAMS, 'nodesCD', { min: 1, max: 200, step: stepNodes })
fcd.addInput(PARAMS, 'divCD', { min: 1, max: 200, step: stepDiv })
fcd.addInput(PARAMS, 'drawCD')

let fd = pane.addFolder({ title: 'ring d' })
fd.addInput(PARAMS.d, 'radius', { min: 1, max: width, step: 1 })
fd.addInput(PARAMS.d, 'nodes', { min: 1, max: 100, step: 1 })
fd.addInput(PARAMS.d, 'var', { min: 1, max: 100, step: 1 })

function draw() {
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 0.5
    PARAMS.drawAB && guilloche(PARAMS.a, PARAMS.b, PARAMS.nodesAB, PARAMS.divAB)
    PARAMS.drawBC && guilloche(PARAMS.b, PARAMS.c, PARAMS.nodesBC, PARAMS.divBC)
    PARAMS.drawCD && guilloche(PARAMS.c, PARAMS.d, PARAMS.nodesCD, PARAMS.divCD)
}

pane.on('change', () => {
    ctx.clearRect(-width / 2, -height / 2, width, height)
    draw()
})

draw()
