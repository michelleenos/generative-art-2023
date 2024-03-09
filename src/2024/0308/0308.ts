import createCanvas from '~/helpers/canvas/createCanvas'
import loop from '~/helpers/loop'
import { shuffle } from '~/helpers/utils'
import '~/style.css'
import { Grid } from './Grid'

const width = window.innerWidth
const height = window.innerHeight
const { ctx, canvas } = createCanvas(width, height)

// '#717ec3',
let palette = ['#fcab30', '#ff626a', '#4C1E4F', '#496ddb', '#FFC4EB']

palette = shuffle(palette)

let grid = new Grid({ palette, steps: 30, size: Math.min(width, height) })

grid.makeSquares()

function draw(t: number) {
    let done = grid.drawSquaresAnimate(ctx, t)
    if (done) stop()
}
let { stop } = loop(draw)
