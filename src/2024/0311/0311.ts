import '~/style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import loop from '~/helpers/loop'
import { TilesEven, TilesDraw, type Tile } from './TilesEven'
import { random, shuffle } from '~/helpers/utils'

// const width = window.innerWidth
const width = 1200
const height = window.innerHeight
const { ctx, canvas } = createCanvas(width, height)
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

let grid = new TilesEven({
    iterations: 3,
    minSize: 30,
    size: width * 0.32,
    palette: shuffle(random(palettes)),
})
let tilesDraw = new TilesDraw(grid)

tilesDraw.drawTree(ctx, tilesDraw.tilesWithTree)
tilesDraw.methodIn = 'push'
tilesDraw.methodOut = 'shift'
const draw = (t: number) => {
    let done = tilesDraw.drawWithoutGrow(ctx, t)
    if (done) looping.stop()
}
looping = loop(draw)
