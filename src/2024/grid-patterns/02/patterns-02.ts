import '~/style.css'
import Stats from 'stats.js'
import { Pane } from 'tweakpane'
import createCanvas from '~/helpers/canvas/createCanvas'
import easings from '~/helpers/easings'
import loop from '~/helpers/loop'
import { random } from '~/helpers/utils'
import { Pattern } from '../pattern-grid'
import { PatternCellQuarterCircleFill } from '../pattern-cell'

const stats = new Stats()
document.body.appendChild(stats.dom)

let width = window.innerWidth
let height = window.innerHeight
const { ctx, canvas, resizeCanvas } = createCanvas(width, height)
let looping: ReturnType<typeof loop>

let palettes = [
    // https://coolors.co/dc5132-a46589-7a82b8-8ad0a6-c4f0a8-a0bb07-ffcf33-ec9f05
    // ['#533a71', '#454a96', '#6184d8', '#50c5b7', '#9cec5b', '#f0f465', '#ff4a1c', '#ed254e'],
    // ['#dc5132', '#a46589', '#7a82b8', '#8ad0a6', '#c4f0a8', '#a0bb07', '#ffcf33', '#ec9f05'],
    // https://coolors.co/533a71-454a96-6184d8-50c5b7-9cec5b-f0f465-ff4a1c-ed254e
    // https://coolors.co/874286-856596-f9c8ce-a8d7a8-b6cccc-8aadbc-7a7eb8-fc814a
    // ['#874286', '#856596', '#f9c8ce', '#a8d7a8', '#b6cccc', '#8aadbc', '#7a7eb8', '#fc814a'],
    // https://coolors.co/87425d-3c2e6b-0081af-a7d6c3-285943-8a8fbd-9a79b8-fcee49
    // ['#87425d', '#3c2e6b', '#0081af', '#a7d6c3', '#285943', '#8a8fbd', '#9a79b8', '#fcee49'],
    // https://coolors.co/d00000-3c2e6b-0081af-a7d6c3-ef476f-fcee49
    ['#d00000', '#3c2e6b', '#0081af', '#93ECC8', '#FF70A9', '#fcee49'],
]

const setPane = (pane: Pane, pattern: Pattern) => {
    let f = pane.addFolder({ title: 'pattern' })
    f.expanded = false
    f.addInput(pattern, 'addPerSecond', { min: 1, max: 20, step: 1 })
    f.addInput(pattern, 'cellDuration', { min: 500, max: 50000, step: 100 })
    f.addInput(pattern, 'cellEase', {
        options: Object.keys(easings).reduce((opts, cur) => {
            return {
                ...opts,
                [cur]: cur,
            }
        }, {}),
    })
    f.addInput(pattern, 'sides', { min: 3, max: 20, step: 1 })
    f.addButton({ title: 'new pattern' }).on('click', () => {
        // pattern.palette = random(palettes)
        pattern.reset()
        pattern.create()
        pattern.shuffle()
    })

    f.addButton({ title: 'restart' }).on('click', () => {
        pattern.reset()
    })
}

let size = Math.min(width, height) * 0.8
let pattern = new Pattern({ size })
pattern.sides = 10
pattern.rectOptions = ['quarterCircleLines', 'quarterCircleFill']
pattern.squareOptions = ['quarterCircleFill', 'quarterCircleLines']
// pattern.rectChance = 1
pattern.cellDuration = 2000
pattern.cellEase = 'inOutCubic'
pattern.create()
pattern.shuffle()
pattern.addPerSecond = 10

const pane = new Pane()
setPane(pane, pattern)

window.addEventListener('resize', () => {
    width = window.innerWidth
    height = window.innerHeight
    resizeCanvas(width, height)
    size = Math.min(width, height) * 0.8
    pattern.size = size
})

const draw = (t: number) => {
    stats.begin()
    ctx.save()
    ctx.clearRect(0, 0, width, height)
    ctx.translate((width - size) / 2, (height - size) / 2)

    let done = pattern.draw(ctx, t)
    // ctx.strokeStyle = '#fff'
    // ctx.strokeRect(0, 0, size, size / 2)
    // cell.tick(t)
    // cell.draw(ctx, size / 2)
    ctx.restore()

    stats.end()
}
looping = loop(draw)

// @ts-ignore
window.pattern = pattern
