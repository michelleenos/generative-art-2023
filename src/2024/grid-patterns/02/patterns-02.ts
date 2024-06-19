import '~/style.css'
import Stats from 'stats.js'
import { GUI } from 'lil-gui'
import createCanvas from '~/helpers/canvas/createCanvas'
import easings, { easing } from '~/helpers/easings'
import loop from '~/helpers/loop'
import { AnimatedPattern } from '../pattern-grid-animated'
import makeImages from '~/helpers/canvas-images'
import { random } from '~/helpers/utils'
import { PatternDataView } from '../pattern-grid-animated-data'

const stats = new Stats()
let looper: ReturnType<typeof loop>
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

class Sizes {
    width!: number
    height!: number
    grid!: number
    tx!: number
    ty!: number
    gridPercent: number

    constructor(width: number, height: number, gridPercent = 0.85) {
        this.gridPercent = gridPercent
        this.setSizes(width, height)
    }

    setSizes = (width: number, height: number) => {
        this.width = width
        this.height = height
        this.grid = Math.min(width, height) * this.gridPercent
        this.tx = (width - this.grid) / 2
        this.ty = (height - this.grid) / 2
    }
}
let size = Math.min(window.innerWidth, window.innerHeight) * 0.9
const sizes = new Sizes(size, size, 1)
const { ctx, canvas, resizeCanvas } = createCanvas(sizes.width, sizes.height, true, false)
document.getElementById('sketch')?.appendChild(canvas)
const { getImage, downloadZip } = makeImages(canvas)

const setGui = (gui: GUI, pattern: AnimatedPattern) => {
    let easingOpts = Object.keys(easings).reduce((opts, cur) => {
        return {
            ...opts,
            [cur]: cur,
        }
    }, {})
    let f = gui.addFolder('pattern')
    f.close()
    f.add(pattern, 'addPerSecond', 1, 100, 1)
    f.add(pattern, 'cellDuration', 100, 4000, 10)
    f.add(pattern, 'rectChance', 0, 1, 0.01)
    f.add(pattern, 'cellDurationLines', 100, 4000, 10)
    f.add(pattern, 'cellEase', easingOpts)
    f.add(pattern, 'addEase', easingOpts)
    f.add(pattern, 'sides', 3, 30, 1)
    f.add(pattern, 'inOutWait', 0, 5000, 10)
    f.add(pattern, 'cornerPattern', ['wave', 'circle', false])
    f.add(pattern, 'order', ['circle', 'random', 'linear-x', 'linear-y', 'diag-tl', 'diag-tr'])

    const btnsObj = {
        newPattern: () => {
            pattern.reset()
            pattern.create()
        },
        makeImages: () => {
            if (looper.isLooping()) looper.stop()
            pattern.reset()
            startImagesLoop()
        },
    }
    f.add(btnsObj, 'newPattern')
    f.add(btnsObj, 'makeImages')
}

let pattern = new AnimatedPattern({
    size: sizes.grid,
    sides: 8,
    rectOptions: ['quarterCircleLines', 'quarterCircleFill'],
    squareOptions: ['quarterCircleFill', 'triangle', 'triangle'],
    cellDuration: 500,
    cellEase: 'inOutQuad',
    addEase: 'outSine',
    addPerSecond: 24,
    inOutWait: 50,
    rectChance: 0,
    cornerPattern: 'wave',
    animation: 'loop',
    order: 'circle',
    palette: random(palettes),
})
pattern.create()

const gui = new GUI()
setGui(gui, pattern)

const dataView = new PatternDataView(pattern)

window.addEventListener('resize', () => {
    let size = Math.min(window.innerWidth, window.innerHeight) * 0.9
    sizes.setSizes(size, size)
    resizeCanvas(sizes.width, sizes.height)
    pattern.size = sizes.grid
})

let lastTime = 0
const draw = (t: number) => {
    stats.begin()
    ctx.save()
    ctx.clearRect(0, 0, sizes.width, sizes.height)
    ctx.translate(sizes.tx, sizes.ty)

    let delta = t - lastTime
    lastTime = t
    pattern.draw(ctx, delta)

    dataView.update()
    ctx.restore()

    stats.end()
}

// ffmpeg -f image2 -r 60 -i image-%d.png -filter_complex "fps=60,scale=320:-1:flags=lanczos,"

const startImagesLoop = () => {
    pattern.reset()
    let t = 0

    const step = (t: number) => {
        ctx.save()
        ctx.clearRect(0, 0, sizes.width, sizes.height)
        ctx.translate(sizes.tx, sizes.ty)

        pattern.draw(ctx, t)
        dataView.update()
        ctx.restore()

        getImage().then(() => {
            t += 1000 / 60
            console.log(t)
            if (t >= pattern.addDuration * 2 + pattern.inOutWait * 2 + 500) {
                downloadZip()
            } else {
                step(t)
            }
        })
    }

    step(t)
}

looper = loop(draw)

// @ts-ignore
window.pattern = pattern
