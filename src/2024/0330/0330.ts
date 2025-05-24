import '~/style.css'
import createCanvas from '~/helpers/create-canvas'
import loop from '~/helpers/loop'
import { TilesEven } from './TilesEven'
import { random, shuffle } from '~/helpers/utils'

const width = window.innerWidth
const height = window.innerHeight
const { ctx } = createCanvas(width, height)
let looping: ReturnType<typeof loop>

let palettes = [
    // https://coolors.co/dc5132-a46589-7a82b8-8ad0a6-c4f0a8-a0bb07-ffcf33-ec9f05
    ['#dc5132', '#a46589', '#7a82b8', '#8ad0a6', '#c4f0a8', '#a0bb07', '#ffcf33', '#ec9f05'],
    // https://coolors.co/533a71-454a96-6184d8-50c5b7-9cec5b-f0f465-ff4a1c-ed254e
    ['#533a71', '#454a96', '#6184d8', '#50c5b7', '#9cec5b', '#f0f465', '#ff4a1c', '#ed254e'],
    // https://coolors.co/874286-856596-f9c8ce-a8d7a8-b6cccc-8aadbc-7a7eb8-fc814a
    ['#874286', '#856596', '#f9c8ce', '#a8d7a8', '#b6cccc', '#8aadbc', '#7a7eb8', '#fc814a'],
    // https://coolors.co/87425d-3c2e6b-0081af-a7d6c3-285943-8a8fbd-9a79b8-fcee49
    ['#87425d', '#3c2e6b', '#0081af', '#a7d6c3', '#285943', '#8a8fbd', '#9a79b8', '#fcee49'],
]

let size = Math.min(width, height) * 0.9
let grid = new TilesEven({
    iterations: 4,
    speedAdd: 20,
    minSize: 5,
    size,
    method: 'stack',
    palette: shuffle(random(palettes)),
})

ctx.translate((width - size) / 2, (height - size) / 2)
const draw = (t: number) => {
    let done = grid.draw(ctx, t)
    if (done) looping.stop()
}
looping = loop(draw)
