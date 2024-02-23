import { hexToRgb } from '~/helpers/color-utils'
import loop from '~/helpers/loop'
import { random, shuffle } from '~/helpers/utils'
import '~/style.css'
import { RandomLines } from './random-lines'
import { Blur, Smudge } from './pixels'
import { ButtonApi, Pane } from 'tweakpane'
import { createElement } from '~/helpers/dom'

let palettes = [
    ['#241e4e', '#960200', '#ce6c47', '#00635D', '#7a4656'],
    ['#020887', '#334195', '#00635D', '#ff715b', '#77cf63'],
    ['#861657', '#a64253', '#d56aa0', '#247ba0', '#011638'],
]

const size = 500

const pixelDensity = Math.min(2, window.devicePixelRatio)
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')!
let sketch = document.getElementById('sketch')
sketch ? sketch.appendChild(canvas) : document.body.appendChild(canvas)

canvas.width = size * pixelDensity
canvas.height = size * pixelDensity
canvas.style.width = size + 'px'
canvas.style.height = size + 'px'
ctx.scale(pixelDensity, pixelDensity)

let lines: RandomLines
let smudge: Smudge
let blur: Blur | undefined
let palette: string[]

const pane = new Pane()
let btnRestart: ButtonApi
let btnBlur: ButtonApi

const setupInfo = () => {
    const infoLines = createElement('span')
    const infoLinesStep = createElement('span')
    const infoBlur = createElement('span')

    const lines = createElement('div', [
        createElement('strong', 'lines: '),
        infoLines,
        createElement('div', [createElement('strong', 'stepMult: '), infoLinesStep]),
    ])
    const info = createElement('div', { class: 'info' }, [lines, createElement('div', infoBlur)])

    document.body.appendChild(info)

    return { info, infoLines, infoLinesStep, infoBlur }
}

const { infoLines, infoLinesStep, infoBlur } = setupInfo()

type Direction = 'up' | 'down' | 'left' | 'right'

const getSmudgeDirection = (lines: RandomLines): Direction => {
    const horizontal = lines.isHorizontal()
    const vertical = lines.isVertical()
    if ((horizontal && vertical) || (!horizontal && !vertical)) {
        return random(['down', 'up', 'left', 'right'])
    } else if (horizontal) {
        return random(['down', 'up'])
    } else {
        return random(['left', 'right'])
    }
}

const oppositeDirections: Record<Direction, Direction> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
}

const setup = () => {
    shuffle(palettes)
    palette = palettes[0]
    btnBlur.disabled = true
    infoBlur.innerHTML = ''

    let stepMult = random([1, 2, 3, 5, 8])
    let maxLines = stepMult >= 4 ? Math.floor(random(20, 80)) : Math.floor(random(50, 150))

    let stepRate = Math.max(3200 - (stepMult - 1) * 500, 800)

    lines = new RandomLines({
        palette,
        width: size,
        height: size,
        pixelDensity,
        maxLines,
        stepRate,
        weight: 3,
        stepMult,
    })

    smudge = new Smudge({
        direction: getSmudgeDirection(lines),
        width: size,
        height: size,
        palette: palette.map(hexToRgb),
        pixelDensity,
        stepRate: 150,
    })
    smudge.init()

    infoLines.textContent = `${lines.maxLines}`
    infoLinesStep.textContent = `${lines.stepMult}`

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = random(palette)
}

const addBlur = () => {
    let pointsCount = random([1, 2, 3, 4])
    let points: [number, number][] = []
    for (let i = 0; i < pointsCount; i++) {
        points.push([Math.floor(random(-10, 10)), Math.floor(random(-10, 10))])
    }
    blur = new Blur({
        direction: oppositeDirections[smudge.direction],
        width: size,
        height: size,
        pixelDensity,
        blurDirections: points,
    })
    blur.init()
    btnBlur.disabled = true

    infoBlur.innerHTML = points.reduce(
        (content, [x, y], i) => `${content}[${x}, ${y}]${i === points.length - 1 ? '' : ', '}`,
        '<strong>blur points: </strong><br/>'
    )
}

let timeLast = 0
const draw = (t: number) => {
    let dt = t - timeLast
    timeLast = t
    if (!lines.done) {
        lines.update(ctx, dt)
        infoLines.innerHTML = `${lines.linesDrawn} of ${lines.maxLines}`
    } else if (!smudge.done) {
        smudge.update(ctx, dt)
        if (!blur) {
            btnBlur.disabled = false
        }
    } else if (blur && !blur.done) {
        blur.update(ctx, dt)
    }
}

btnRestart = pane.addButton({ title: 'restart' }).on('click', setup)
btnBlur = pane.addButton({ title: 'add blur' }).on('click', addBlur)

setup()
loop(draw)

// document.body.addEventListener('click', () => {
//     setup()
// })
