import '~/style.css'
import chroma from 'chroma-js'
import createCanvas from '~/helpers/create-canvas'
import { makeRandomSeed, makeRng, Rng } from '~/helpers/prng'
import GUI from 'lil-gui'

const width = 800
const height = 800
const { ctx } = createCanvas(800, 800)

let seed: number
let rng: Rng

const config = {
    hue: 170,
    addHue: 100,
    lessSaturated: false,
    count: 12,
}

function makePalette(rng: Rng, regenerate = false) {
    const { count } = config
    // const hue = rng(170, 330)
    const hue = config.hue
    if (regenerate) {
        config.addHue = rng(100, 200)
        config.lessSaturated = rng() < 0
    } else {
        rng()
        rng()
    }

    let l1 = 0.35
    let l2 = 0.85
    let chromaVal = 0.08
    const colorAt = (amt: number) => {
        return chroma.oklch(l1 + (l2 - l1) * amt, chromaVal, hue + config.addHue * amt)
    }
    // const c1 = chroma([0.25, 0.12, hue], 'oklch')
    const c1 = chroma.oklch(l1, 0.05, hue)
    console.log(c1.oklch())
    let mixAmt = 0

    function nextColor() {
        const c = colorAt(mixAmt).set(
            'oklch.c',
            config.lessSaturated ? `*${rng(0.7, 1.5)}` : `*${rng(1.2, 2)}`,
        )
        mixAmt = (mixAmt + rng(0.5, 0.75)) % 1
        return c
    }
    const bgColor = nextColor().set('oklch.l', '0.7')
    const rowColors = Array.from({ length: count }, () => nextColor())

    return {
        bgColor,
        rowColors,
    }
}

function draw(regenerate = false) {
    const { count } = config

    seed = makeRandomSeed()
    rng = makeRng(seed)
    let palette = makePalette(rng, regenerate)

    ctx.fillStyle = palette.bgColor.css()
    ctx.fillRect(0, 0, width / 2, height)

    let step = height / count
    palette.rowColors.forEach((color, i) => {
        ctx.fillStyle = color.css()
        ctx.fillRect(width / 2, i * step, width / 2, step)
    })
}

draw(true)

const gui = new GUI()
gui.add(config, 'hue', 0, 360, 1).onChange(() => draw(false))
gui.add(config, 'addHue', 0, 250, 1)
    .listen()
    .onChange(() => draw(false))
gui.add(config, 'lessSaturated')
    .listen()
    .onChange(() => draw(false))
gui.add({ redo: () => draw(false) }, 'redo')
