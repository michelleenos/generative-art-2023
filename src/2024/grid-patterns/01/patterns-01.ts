import '~/style.css'
import Stats from 'stats.js'
import { Pane } from 'tweakpane'
import createCanvas from '~/helpers/canvas/createCanvas'
import easings from '~/helpers/easings'
import loop from '~/helpers/loop'
import { random } from '~/helpers/utils'
import { type PatternCell } from '../pattern-cell'
import { Pattern } from '../pattern-grid'

const stats = new Stats()
document.body.appendChild(stats.dom)

class Sizes {
    width!: number
    height!: number
    grid!: number
    tx!: number
    ty!: number

    constructor(width: number, height: number) {
        this.setSizes(width, height)
    }

    setSizes = (width: number, height: number) => {
        this.width = width
        this.height = height
        this.grid = Math.min(width, height) * 0.85
        this.tx = (width - this.grid) / 2
        this.ty = (height - this.grid) / 2
    }
}

const sizes = new Sizes(window.innerWidth, window.innerHeight)
const { ctx, canvas, resizeCanvas } = createCanvas(sizes.width, sizes.height)
let looping: ReturnType<typeof loop>

let palettes = [
    // https://coolors.co/dc5132-a46589-7a82b8-8ad0a6-c4f0a8-a0bb07-ffcf33-ec9f05
    ['#533a71', '#454a96', '#6184d8', '#50c5b7', '#9cec5b', '#f0f465', '#ff4a1c', '#ed254e'],
    ['#dc5132', '#a46589', '#7a82b8', '#8ad0a6', '#c4f0a8', '#a0bb07', '#ffcf33', '#ec9f05'],
    // https://coolors.co/533a71-454a96-6184d8-50c5b7-9cec5b-f0f465-ff4a1c-ed254e
    // https://coolors.co/874286-856596-f9c8ce-a8d7a8-b6cccc-8aadbc-7a7eb8-fc814a
    ['#874286', '#856596', '#f9c8ce', '#a8d7a8', '#b6cccc', '#8aadbc', '#7a7eb8', '#fc814a'],
    // https://coolors.co/87425d-3c2e6b-0081af-a7d6c3-285943-8a8fbd-9a79b8-fcee49
    ['#87425d', '#3c2e6b', '#0081af', '#a7d6c3', '#285943', '#8a8fbd', '#9a79b8', '#fcee49'],
]

const setPane = (pane: Pane, pattern: Pattern) => {
    let f = pane.addFolder({ title: 'pattern' })
    f.expanded = false
    f.addInput(pattern, 'addPerSecond', { min: 1, max: 20, step: 1 })
    f.addInput(pattern, 'cellDuration', { min: 100, max: 2000, step: 100 })
    f.addInput(pattern, 'cellEase', {
        options: Object.keys(easings).reduce((opts, cur) => {
            return {
                ...opts,
                [cur]: cur,
            }
        }, {}),
    })
    f.addButton({ title: 'new palette' }).on('click', () => {
        pattern.setColors(random(palettes))
    })
    f.addButton({ title: 'new pattern' }).on('click', () => {
        pattern.setColors(random(palettes))
        pattern.reset()
        pattern.create()
        pattern.shuffle()
    })

    f.addButton({ title: 'restart' }).on('click', () => {
        pattern.reset()
    })

    let squareOpts: Partial<Record<PatternCell['style'], number>> = {
        triangle: 2,
        lines: 1,
        quarterCircle: 1,
        circle: 1,
        leaf: 1,
    }
    let rectOpts: Partial<Record<PatternCell['style'], number>> = {
        halfCircle: 1,
        quarterCircle: 1,
    }

    let likely = pane.addFolder({ title: 'shape likelihood' })
    likely.expanded = false
    likely.addInput(pattern, 'rectChance', { min: 0, max: 1, step: 0.1 })
    let likelySq = likely.addFolder({ title: 'square' })
    for (let key in squareOpts) {
        likelySq.addInput(squareOpts, key as keyof typeof squareOpts, { min: 0, max: 5, step: 1 })
    }
    let likelyRect = likely.addFolder({ title: 'rectangle' })
    for (let key in rectOpts) {
        likelyRect.addInput(rectOpts, key as keyof typeof rectOpts, { min: 0, max: 5, step: 1 })
    }

    likely.on('change', () => {
        pattern.squareOptions = []
        let entries = Object.entries(squareOpts)
        entries.forEach(([key, value]) => {
            for (let i = 0; i < value; i++) {
                pattern.squareOptions.push(key as PatternCell['style'])
            }
        })
        pattern.rectOptions = []
        Object.entries(rectOpts).forEach(([key, value]) => {
            for (let i = 0; i < value; i++) {
                pattern.rectOptions.push(key as PatternCell['style'])
            }
        })
    })
}

let pattern = new Pattern({
    size: sizes.grid,
    palette: random(palettes),
    rectOptions: ['halfCircle', 'quarterCircle'],
    squareOptions: ['triangle', 'triangle', 'lines', 'quarterCircle', 'circle', 'leaf'],
    addPerSecond: 50,
    cellDuration: 1000,
    sides: 10,
})

pattern.create()
pattern.shuffle()

const pane = new Pane()
setPane(pane, pattern)

window.addEventListener('resize', () => {
    sizes.setSizes(window.innerWidth, window.innerHeight)
    resizeCanvas(sizes.width, sizes.height)
    pattern.size = sizes.grid
})

const draw = (t: number) => {
    stats.begin()
    ctx.save()
    ctx.translate(sizes.tx, sizes.ty)
    let done = pattern.draw(ctx, t)
    // testDraw(ctx, width, height, t)

    ctx.restore()

    stats.end()
}
looping = loop(draw)

// @ts-ignore
window.pattern = pattern
