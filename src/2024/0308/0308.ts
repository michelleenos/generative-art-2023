// p5 version: https://openprocessing.org/sketch/2202948

import createCanvas from '~/helpers/canvas/createCanvas'
import loop from '~/helpers/loop'
import { random, shuffle } from '~/helpers/utils'
import '~/style.css'
import { Grid } from './Grid'

const sizes = { width: window.innerWidth, height: window.innerHeight }
const { ctx, resizeCanvas } = createCanvas(sizes.width, sizes.height)

let m: number
let palettes = [
    ['#fcab30', '#ff626a', '#4C1E4F', '#496ddb', '#FFC4EB'],
    ['#4c1e4f', '#07beb8', '#fee1c7', '#fb7232', '#f44174'],
    ['#f75c03', '#d90368', '#e5beed', '#820263', '#291720', '#04a777'],
]
let grid: Grid
let looper: ReturnType<typeof loop>

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    resizeCanvas(sizes.width, sizes.height)
    m = Math.min(sizes.width, sizes.height) * 0.9
    grid.resize(m)

    ctx.save()
    ctx.translate((sizes.width - m) / 2, (sizes.height - m) / 2)
    grid.drawSquares(ctx)
    ctx.restore()
})

function draw(t: number) {
    ctx.save()
    ctx.translate((sizes.width - m) / 2, (sizes.height - m) / 2)
    let done = grid.drawSquaresAnimate(ctx, t)
    if (done) looper.stop()

    ctx.restore()
}

function startDrawing() {
    ctx.clearRect(0, 0, sizes.width, sizes.height)
    m = Math.min(sizes.width, sizes.height) * 0.9
    let palette = shuffle(random(palettes))
    grid = new Grid({ palette, steps: 30, size: m })
    grid.makeSquares()

    if (!looper || looper.isStopped()) {
        looper = loop(draw)
    }
}

window.addEventListener('click', startDrawing)

startDrawing()
