import '~/style.css'
import createCanvas from '~/helpers/create-canvas'
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
    cy: number = 0,
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
fa.addBinding(PARAMS.a, 'radius', { min: 1, max: width, step: 1 })
fa.addBinding(PARAMS.a, 'nodes', { min: 1, max: 100, step: 1 })
fa.addBinding(PARAMS.a, 'var', { min: 1, max: 100, step: 1 })

let fab = pane.addFolder({ title: 'A > B' })
fab.addBinding(PARAMS, 'nodesAB', { min: 1, max: 200, step: stepNodes })
fab.addBinding(PARAMS, 'divAB', { min: 1, max: 200, step: stepDiv })
fab.addBinding(PARAMS, 'drawAB')

let fb = pane.addFolder({ title: 'ring b' })
fb.addBinding(PARAMS.b, 'radius', { min: 1, max: width, step: 1 })
fb.addBinding(PARAMS.b, 'nodes', { min: 1, max: 100, step: 1 })
fb.addBinding(PARAMS.b, 'var', { min: 1, max: 100, step: 1 })

let fbc = pane.addFolder({ title: 'B > C' })
fbc.addBinding(PARAMS, 'nodesBC', { min: 1, max: 200, step: stepNodes })
fbc.addBinding(PARAMS, 'divBC', { min: 1, max: 200, step: stepDiv })
fbc.addBinding(PARAMS, 'drawBC')

let fc = pane.addFolder({ title: 'ring c' })
fc.addBinding(PARAMS.c, 'radius', { min: 1, max: width, step: 1 })
fc.addBinding(PARAMS.c, 'nodes', { min: 1, max: 100, step: 1 })
fc.addBinding(PARAMS.c, 'var', { min: 1, max: 100, step: 1 })

let fcd = pane.addFolder({ title: 'C > D' })
fcd.addBinding(PARAMS, 'nodesCD', { min: 1, max: 200, step: stepNodes })
fcd.addBinding(PARAMS, 'divCD', { min: 1, max: 200, step: stepDiv })
fcd.addBinding(PARAMS, 'drawCD')

let fd = pane.addFolder({ title: 'ring d' })
fd.addBinding(PARAMS.d, 'radius', { min: 1, max: width, step: 1 })
fd.addBinding(PARAMS.d, 'nodes', { min: 1, max: 100, step: 1 })
fd.addBinding(PARAMS.d, 'var', { min: 1, max: 100, step: 1 })

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
