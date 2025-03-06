import '~/style.css'
import Stats from 'stats.js'
import createCanvas from '~/helpers/canvas/createCanvas'
import easings from '~/helpers/easings'
import loop from '~/helpers/loop'
import { random, shuffle } from '~/helpers/utils'
import { type PatternCell } from '../cells/pattern-cell'
import { AnimatedPattern } from '../pattern-grid-animated'
import { GUI } from 'lil-gui'
import { Sizes } from '~/helpers/sizes'
import { PatternDataView } from '../pattern-grid-animated-data'

const getGridSizes = (sizes: Sizes) => {
    let grid = Math.min(sizes.width, sizes.height) * 0.85
    return {
        grid,
        tx: (sizes.width - grid) / 2,
        ty: (sizes.height - grid) / 2,
    }
}

const sizes = new Sizes()
let gridSizes = getGridSizes(sizes)
const { ctx, resizeCanvas } = createCanvas(sizes.width, sizes.height)

const stats = new Stats()
document.body.appendChild(stats.dom)

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

const setGui = (gui: GUI, pattern: AnimatedPattern) => {
    let easeOpts = Object.keys(easings)
    gui.close()
    gui.add(pattern, 'addPerSecond', 1, 40, 1)
    gui.add(pattern, 'cellDuration', 100, 2000, 100)
    gui.add(pattern, 'cellEase', easeOpts)
    gui.add(pattern, 'addEase', easeOpts)

    const btns = {
        newPalette: () => {
            pattern.setColors(random(palettes))
        },
        newPattern: () => {
            pattern.setColors(random(palettes))
            pattern.reset()
            pattern.create()
        },
        restart: () => {
            pattern.reset()
        },
    }

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

    let likely = gui.addFolder('shape likelihood')
    likely.close()
    likely.add(pattern, 'rectChance', 0, 5, 0.1)
    let likelySq = likely.addFolder('square')
    for (let key in squareOpts) {
        likelySq.add(squareOpts, key as keyof typeof squareOpts, 0, 5, 1)
    }
    let likelyRect = likely.addFolder('rectangle')
    for (let key in rectOpts) {
        likelyRect.add(rectOpts, key as keyof typeof rectOpts, 0, 5, 1)
    }

    likely.onChange(() => {
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

    gui.add(btns, 'newPalette')
    gui.add(btns, 'newPattern')
    gui.add(btns, 'restart')
}

let palette = shuffle([...random(palettes)])
let bg = palette.shift()!
let pattern = new AnimatedPattern({
    size: gridSizes.grid,
    palette,
    rectOptions: ['halfCircle'],
    squareOptions: ['leaf', 'quarterCircle'],
    addPerSecond: 20,
    cellDuration: 500,
    sides: 8,
    rectChance: 0.5,
    cornerPattern: 'circle',
    inOutWait: 500,
    animation: 'loop',
})

pattern.create()

const gui = new GUI({ title: 'pattern controls' })
setGui(gui, pattern)

let dataView = new PatternDataView(pattern)

window.addEventListener('resize', () => {
    gridSizes = getGridSizes(sizes)
    resizeCanvas(sizes.width, sizes.height)
    pattern.size = gridSizes.grid
})

let looping: ReturnType<typeof loop>
let lastTime = 0
const draw = (t: number) => {
    ctx.save()
    ctx.translate(gridSizes.tx, gridSizes.ty)

    ctx.fillStyle = bg
    ctx.fillRect(0, 0, gridSizes.grid, gridSizes.grid)
    let delta = t - lastTime
    lastTime = t
    pattern.draw(ctx, delta)
    dataView.update()

    ctx.restore()
}
looping = loop(draw)

// @ts-ignore
window.pattern = pattern
