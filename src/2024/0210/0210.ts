import { hexToRgb } from '~/helpers/color-utils'
import loop from '~/helpers/loop'
import { random, shuffle } from '~/helpers/utils'
import '~/style.css'
import { RandomLines } from './random-lines'
import { Blur, Smear, SmearOpts } from './smear-pixels'

let palettes = [
    ['#241e4e', '#960200', '#ce6c47', '#00635D', '#7a4656'],
    ['#020887', '#334195', '#00635D', '#ff715b', '#77cf63'],
    ['#861657', '#a64253', '#d56aa0', '#247ba0', '#011638'],
]

const size = 500

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')!
let sketch = document.getElementById('sketch')
sketch ? sketch.appendChild(canvas) : document.body.appendChild(canvas)
let pixelDensity = Math.min(window.devicePixelRatio, 2)

canvas.width = size * pixelDensity
canvas.height = size * pixelDensity
canvas.style.width = size + 'px'
canvas.style.height = size + 'px'
ctx.scale(pixelDensity, pixelDensity)

let palette: string[]
let lines: RandomLines
let smear: Smear

const getDirection = (lines: RandomLines): SmearOpts['direction'] => {
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

const setup = () => {
    palette = random(palettes)
    shuffle(palette)

    lines = new RandomLines({
        palette,
        width: size,
        height: size,
        pixelDensity,
        maxLines: 100,
        stepRate: 10000,
        weight: 2,
    })

    smear = new Smear({
        direction: getDirection(lines),
        width: size,
        height: size,
        palette: palette.map(hexToRgb),
        pixelDensity,
    })

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = random(palette)
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, size, size)
}

let timeLast = 0
const draw = (t: number) => {
    let dt = t - timeLast
    timeLast = t
    if (!lines.done) {
        lines.update(ctx, dt)
    } else if (!smear.done) {
        smear.update(ctx, dt)
    }
}

setup()
loop(draw)

document.body.addEventListener('click', () => {
    setup()
})
