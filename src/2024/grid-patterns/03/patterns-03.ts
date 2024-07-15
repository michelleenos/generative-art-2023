import { GUI } from 'lil-gui'
import createCanvas from '~/helpers/canvas/createCanvas'
import easings from '~/helpers/easings'
import loop from '~/helpers/loop'
import { Sizes } from '~/helpers/sizes'
import { random } from '~/helpers/utils'
import '~/style.css'
import { AnimatedPattern } from '../pattern-grid-animated'
import { PatternDataView } from '../pattern-grid-animated-data'
import { AnimatedPatternRandom } from '../pattern-grid-animated-random'

let looper: ReturnType<typeof loop>

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

const sizes = new Sizes()
const { ctx, canvas, resizeCanvas } = createCanvas(sizes.width, sizes.height, true, false)
document.getElementById('sketch')?.appendChild(canvas)

const setGui = (gui: GUI, pattern: AnimatedPatternRandom | AnimatedPattern) => {
    let easingOpts = Object.keys(easings).reduce((opts, cur) => {
        return {
            ...opts,
            [cur]: cur,
        }
    }, {})
    let f = gui.addFolder('pattern')
    f.close()
    // f.add(pattern, 'addPerSecond', 1, 100, 1)
    f.add(pattern, 'cellDuration', 100, 4000, 10)
    f.add(pattern, 'cellDurationLines', 100, 4000, 10)
    f.add(pattern, 'cellEase', { options: easingOpts })
    f.add(pattern, 'addEase', { options: easingOpts })
    f.add(pattern, 'sides', 3, 30, 1)
    // f.add(pattern, 'switchInterval', 20, 1000, 1)
    // f.add(pattern, 'inOutWait', 0, 5000, 10)
    f.add(pattern, 'cornerPattern', { wave: 'wave', circle: 'circle', none: false })
    f.add(pattern, 'order', ['circle', 'random', 'linear-x', 'linear-y', 'diag-tl', 'diag-tr'])
    f.add(pattern, 'debug')

    const btnsObj = {
        newPattern: () => {
            pattern.reset()
            pattern.create()
        },
    }
    f.add(btnsObj, 'newPattern')
}

sizes.on('resize', (width, height) => {
    resizeCanvas(width, height)
    pattern.size = Math.min(width, height) * 0.9
})

let pattern = new AnimatedPattern({
    size: Math.min(sizes.width, sizes.height) * 0.9,
    sides: 40,
    squareOptions: [
        // 'quarterCircleFill',
        'quarterCircleLines',
        'leaf',
        // 'lines',
        'triangle',
        'circle',
    ],
    cellDuration: 300,
    cellEase: 'outQuint',
    addEase: 'inSine',
    addPerSecond: 500,
    inOutWait: 500,
    rectChance: 0,
    animation: 'loop',
    order: 'linear-y',
    noisePattern: true,
    palette: random(palettes),
})

pattern.styleOpts = {
    quarterCircleFill: { innerRatio: 0, outerRatio: 1 },
    quarterCircleLines: { innerRatio: 0, outerRatio: 1, lineWidth: 0.1 },
    lines: { lineWidth: 0.05, each: 100, diagSteps: 8, steps: 5, dirOptions: ['d1', 'd2'] },
}

pattern.create()

const gui = new GUI()
setGui(gui, pattern)

const dataView = new PatternDataView(pattern)

let lastTime = 0
const draw = (t: number) => {
    ctx.save()
    ctx.clearRect(0, 0, sizes.width, sizes.height)
    // ctx.translate(sizes.tx, sizes.ty)
    ctx.translate((sizes.width - pattern.size) / 2, (sizes.height - pattern.size) / 2)

    let delta = t - lastTime
    lastTime = t
    pattern.draw(ctx, delta)

    dataView.update()
    ctx.restore()
}

looper = loop(draw)
