import GUI from 'lil-gui'
import '~/style.css'
import createCanvas from '~/helpers/create-canvas'

let width = window.innerWidth
let height = window.innerHeight

const { ctx } = createCanvas(window.innerWidth, window.innerHeight)
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

function makeGui() {
    let gui = new GUI()
    const updateGui = () => {
        if (PARAMS.mode === 'spiral') {
            spf.show()
            sunf.hide()
        } else {
            spf.hide()
            sunf.show()
        }
    }
    gui.add(PARAMS, 'mode', ['spiral', 'sunflower']).onChange(updateGui)

    let spf = gui.addFolder('spiral')
    spf.add(PARAMS.spiral, 'spiralType', [
        'archimedean',
        'hyperbolic',
        'fermat',
        'lituus',
        'logarithmic',
        'golden',
    ]).onChange((type: string) => {
        type === 'golden' ? ca.hide() : ca.show()
        type === 'logarithmic' ? ck.show() : ck.hide()
        PARAMS.spiral.a = defaults[type].a
        PARAMS.spiral.cycles = defaults[type].cycles || 10
    })
    let ca = spf.add(PARAMS.spiral, 'a', 0, 1000, 0.1).listen()
    let ck = spf.add(PARAMS.spiral, 'k', 0, 5, 0.01).listen()
    spf.add(PARAMS.spiral, 'cycles', 0, 100, 1).listen()

    let sunf = gui.addFolder('sunflower')
    sunf.add(PARAMS.sunflower, 'count', 0, 1000, 1)
    sunf.add(PARAMS.sunflower, 'maxRadius', 0, 1000, 1)
    sunf.add(PARAMS.sunflower, 'maxSize', 0, 100, 1)

    updateGui()

    gui.onChange(() => {
        setTimeout(draw)
    })
}

const spirals: { [key: string]: Function } = {
    archimedean: (a: number, t: number) => a * t,
    hyperbolic: (a: number, t: number) => a / t,
    fermat: (a: number, t: number) => a * Math.pow(t, 0.5),
    lituus: (a: number, t: number) => a * Math.pow(t, -0.5),
    logarithmic: (a: number, k: number, t: number) => a * Math.pow(Math.E, k * t),
    golden: (t: number) => Math.pow(PHI, 2 * (t / Math.PI)),
}

const defaults: { [key: string]: { [key: string]: number } } = {
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
    const count = PARAMS.sunflower.count

    for (let i = 0; i < count; i++) {
        const percent = i / count
        const size = PARAMS.sunflower.maxSize * percent
        const radius = PARAMS.sunflower.maxRadius * percent
        const t = i * Math.PI * 2 * PHI
        const x = Math.cos(t) * radius
        const y = Math.sin(t) * radius

        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
    }
}

makeGui()

function draw() {
    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.clearRect(-width / 2, -height / 2, width, height)

    ctx.strokeStyle = '#fff'
    ctx.fillStyle = '#fff'
    ctx.lineWidth = 0.5

    PARAMS.mode === 'spiral' ? spiral() : sunflower()
    ctx.restore()
}

draw()
