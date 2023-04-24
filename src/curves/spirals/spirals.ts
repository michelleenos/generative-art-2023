import '../../style.css'
import { Pane } from 'tweakpane'
import RefreshContainer from '~/helpers/refresh-container'

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

let width = window.innerWidth
let height = window.innerHeight

let { ctx } = createCanvas(window.innerWidth, window.innerHeight)

const PHI = (1 + Math.sqrt(5)) / 2

const PARAMS = {
    mode: 'spiral',
    spiral: {
        spiralType: 'archimedean',
        a: 5,
        k: 0.1,
        cycles: 10,
    },
    sunflower: {
        count: 300,
        maxRadius: width * 0.4,
        maxSize: width * 0.02,
    },
}

let pane = new Pane()
let rc = new RefreshContainer(pane)
let inpType = pane
    .addInput(PARAMS.spiral, 'spiralType', {
        options: {
            archimedean: 'archimedean',
            hyperbolic: 'hyperbolic',
            fermat: 'fermat',
            lituus: 'lituus',
            logarithmic: 'logarithmic',
            golden: 'golden',
        },
    })
    .on('change', function () {
        let type = PARAMS.spiral.spiralType
        inpA.hidden = type === 'golden' ? true : false
        inpK.hidden = type === 'logarithmic' ? false : true
        PARAMS.spiral.a = defaults[type].a
        rc.refresh()
    })
let inpA = pane.addInput(PARAMS.spiral, 'a', { min: 0, max: 1000, step: 0.1 })
let inpK = pane.addInput(PARAMS.spiral, 'k', { min: 0, max: 5, step: 0.01 })
let inpCycles = pane.addInput(PARAMS.spiral, 'cycles', {
    min: 0,
    max: 100,
    step: 1,
})
let inpCount = pane.addInput(PARAMS.sunflower, 'count', {
    min: 0,
    max: 1000,
    step: 1,
})
let inpMaxRadius = pane.addInput(PARAMS.sunflower, 'maxRadius', {
    min: 0,
    max: 1000,
    step: 1,
})
let inpMaxSize = pane.addInput(PARAMS.sunflower, 'maxSize', {
    min: 0,
    max: 100,
    step: 1,
})

function setMode() {
    if (rc.refreshing) return
    if (PARAMS.mode === 'spiral') {
        inpType.hidden = false
        inpA.hidden = PARAMS.spiral.spiralType === 'golden' ? true : false
        inpK.hidden = PARAMS.spiral.spiralType === 'logarithmic' ? false : true
        inpCycles.hidden = false
        inpCount.hidden = true
        inpMaxRadius.hidden = true
        inpMaxSize.hidden = true
    } else {
        inpType.hidden = true
        inpA.hidden = true
        inpK.hidden = true
        inpCycles.hidden = true
        inpCount.hidden = false
        inpMaxRadius.hidden = false
        inpMaxSize.hidden = false
    }
}

pane.addInput(PARAMS, 'mode', {
    options: { spiral: 'spiral', sunflower: 'sunflower' },
})

pane.on('change', () => {
    setMode()
    ctx.clearRect(-width / 2, -height / 2, width, height)
    draw()
})

const spirals = {
    archimedean: (a, t) => a * t,
    hyperbolic: (a, t) => a / t,
    fermat: (a, t) => a * Math.pow(t, 0.5),
    lituus: (a, t) => a * Math.pow(t, -0.5),
    logarithmic: (a, k, t) => a * Math.pow(Math.E, k * t),
    golden: (t) => Math.pow(PHI, 2 * (t / Math.PI)),
}

const defaults = {
    archimedean: { a: 5, cycles: 10 },
    hyperbolic: { a: 1000, cycles: 30 },
    fermat: { a: 20, cycles: 20 },
    lituus: { a: 500, cycles: 20 },
    logarithmic: { a: 0.5, k: 0.05, cycles: 10 },
    golden: { cycles: 3 },
}

function spiral() {
    let t = 0
    let res = 0.01
    let cycles = PARAMS.spiral.cycles
    let type = PARAMS.spiral.spiralType
    ctx.beginPath()
    for (t = res; t < cycles * 2 * Math.PI; t += res) {
        let radius =
            type === 'logarithmic'
                ? spirals[type](PARAMS.spiral.a, PARAMS.spiral.k, t)
                : type === 'golden'
                ? spirals[type](t)
                : spirals[type](PARAMS.spiral.a, t)
        let x = Math.cos(t) * radius
        let y = Math.sin(t) * radius
        ctx.lineTo(x, y)
    }
    ctx.stroke()
}

function sunflower() {
    let count = PARAMS.sunflower.count
    for (let i = 0; i < count; i++) {
        let percent = i / count
        let size = PARAMS.sunflower.maxSize * percent
        let radius = PARAMS.sunflower.maxRadius * percent
        let t = i * Math.PI * 2 * PHI
        let x = Math.cos(t) * radius
        let y = Math.sin(t) * radius

        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
    }
}

setMode()

function draw() {
    PARAMS.mode === 'spiral' ? spiral() : sunflower()
}

ctx.translate(width / 2, height / 2)
ctx.strokeStyle = '#fff'
ctx.fillStyle = '#fff'
ctx.lineWidth = 0.5

draw()
