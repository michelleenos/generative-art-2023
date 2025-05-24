import '../../style.css'
import { Pane } from 'tweakpane'
import createCanvas from '~/helpers/create-canvas'
import RefreshContainer from '~/helpers/refresh-container'

let width = window.innerWidth
let height = window.innerHeight
let min = Math.min(width, height)

let { ctx } = createCanvas(width, height)

const PARAMS = {
    size: min * 0.4,
    numerator: 5,
    denominator: 1,
    res: 0.01,
    step: 49,
    special: 'none',
    mode: 'normal',
    iterations: 360,
}

const pane = new Pane()
const rc = new RefreshContainer(pane)
pane.addInput(PARAMS, 'size', { min: 10, max: min * 0.8, step: 1 })
pane.addInput(PARAMS, 'numerator', { min: 1, max: 100, step: 1 })
pane.addInput(PARAMS, 'denominator', { min: 1, max: 100, step: 1 })
let inpRes = pane.addInput(PARAMS, 'res', { min: 0.001, max: 0.1, step: 0.001 })
let inpStep = pane.addInput(PARAMS, 'step', { min: 1, max: 360, step: 1 })
let inpIterations = pane.addInput(PARAMS, 'iterations', {
    min: 100,
    max: 1000,
    step: 1,
})
pane.addInput(PARAMS, 'special', {
    options: {
        'limaçon trisectrix (1:3)': 'trisectrix',
        'dürer folium (1:2)': 'durer',
        'quadrifolium (2:1)': 'quadrifolium',
        'trifolium (3:1)': 'trifolium',
        none: 'none',
    },
}).on('change', () => {
    if (rc.refreshing) return
    setSpecial()
    rc.refresh()
})

pane.addInput(PARAMS, 'mode', {
    options: {
        normal: 'normal',
        maurer: 'maurer',
    },
}).on('change', () => {
    if (rc.refreshing) return
    setMode()
    rc.refresh()
})

function setMode() {
    if (PARAMS.mode === 'maurer') {
        inpRes.hidden = true
        inpStep.hidden = false
        inpIterations.hidden = false
    } else {
        inpRes.hidden = false
        inpStep.hidden = true
        inpIterations.hidden = true
    }
}

function setSpecial() {
    if (PARAMS.special === 'trisectrix') {
        PARAMS.numerator = 1
        PARAMS.denominator = 3
    } else if (PARAMS.special === 'durer') {
        PARAMS.numerator = 1
        PARAMS.denominator = 2
    } else if (PARAMS.special === 'quadrifolium') {
        PARAMS.numerator = 2
        PARAMS.denominator = 1
    } else if (PARAMS.special === 'trifolium') {
        PARAMS.numerator = 3
        PARAMS.denominator = 1
    }
}

function checkSpecial() {
    let special = 'none'
    if (PARAMS.numerator === 1 && PARAMS.denominator === 3) special = 'trisectrix'
    if (PARAMS.numerator === 1 && PARAMS.denominator === 2) special = 'durer'
    if (PARAMS.numerator === 2 && PARAMS.denominator === 1) special = 'quadrifolium'
    if (PARAMS.numerator === 3 && PARAMS.denominator === 1) special = 'trifolium'
    PARAMS.special = special
    rc.refresh()
}

pane.on('change', () => {
    if (rc.refreshing) return
    draw()
})

function draw() {
    checkSpecial()
    ctx.clearRect(-width / 2, -height / 2, width, height)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = PARAMS.mode === 'maurer' ? 0.5 : 1
    if (PARAMS.mode === 'maurer') {
        maurer(
            0,
            0,
            PARAMS.size,
            PARAMS.numerator,
            PARAMS.denominator,
            PARAMS.step,
            PARAMS.iterations
        )
    } else {
        rose(0, 0, PARAMS.size, PARAMS.numerator, PARAMS.denominator, PARAMS.res)
    }
    ctx.stroke()
}

function rose(x: number, y: number, size: number, nNum: number, nDenom: number, res = 0.01) {
    ctx.beginPath()

    let m = (nDenom * nNum) % 2 === 0 ? 2 : 1
    let limit = Math.PI * nDenom * m
    for (let t = 0; t <= limit; t += res) {
        // let r = size * Math.cos((nNum / nDenom) * t)
        let r = size * Math.sin((nNum / nDenom) * t)
        let px = x + r * Math.cos(t)
        let py = y + r * Math.sin(t)
        ctx.lineTo(px, py)
    }
}

// traditional num of iterations is 360
function maurer(
    x: number,
    y: number,
    size: number,
    nNum: number,
    nDenom: number,
    step = 49,
    iterations = 360
) {
    ctx.beginPath()
    for (let i = 0; i < iterations; i++) {
        let degrees = i * step
        // convert degrees to radians
        let radians = (degrees * Math.PI) / 180
        let r = size * Math.sin((nNum / nDenom) * radians)
        let px = x + r * Math.cos(radians)
        let py = y + r * Math.sin(radians)
        ctx.lineTo(px, py)
    }
}

ctx.strokeStyle = '#fff'
ctx.translate(width / 2, height / 2)
ctx.scale(1, -1)
setMode()
draw()
