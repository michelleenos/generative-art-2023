import loop from '~/helpers/loop'
import { Sizes } from '~/helpers/sizes'
import { Rectangle } from '~/helpers/trig-shapes'
import { random, shuffle } from '~/helpers/utils'
import '~/style.css'
import createCanvas from '../../../helpers/create-canvas'
import { boxesHorizontal, boxesVertical } from '../patterns'
import { TreePattern } from '../tree-animation-pattern'

const sizes = new Sizes()
let { ctx, resizeCanvas } = createCanvas(sizes.width, sizes.height)
sizes.on('resize', resizeCanvas)
let m = Math.min(sizes.width, sizes.height) * 0.9

let palettes = [
    ['#081232', '#bba0ca', '#fff8e8', '#fcd581', '#d52941', '#990d35'],
    ['#fefaec', '#f398c3', '#cf3895', '#a0d28d', '#06b4b0', '#fed000', '#FF8552'],
    ['#002e2d', '#06b4b0', '#cf3895', '#fff8e8', '#f398c3', '#a0d28d', '#ffd930', '#FF8552'],
    ['#331c25', '#3c2e6b', '#0081af', '#a7d6c3', '#285943', '#8a8fbd', '#9a79b8', '#fcee49'],
]

let palette = [...random(palettes)]
let bg = palette.shift()!
palette = shuffle(palette)

let tree = new TreePattern({
    patterns: { boxesHorizontal, boxesVertical },
    bounds: new Rectangle((sizes.width - m) / 2, (sizes.height - m) / 2, m, m),
    palette,
    maxDepth: 8,
    minDepth: 6,
    thresholdChange: 0.8,
    noiseOptions: {
        freq: 0.1,
        speed: 4,
    },
    noiseOptsPattern: {
        freq: 0.64,
        speed: 1.6,
    },
    minLifeSpan: 600,
    nodeDuration: 400,
    nodeEaseEnter: 'inQuad',
    nodeEaseLeave: 'inQuad',
    divideRule: 'two-random',
})

tree.initTree()

function draw(ms: number) {
    ctx.clearRect(0, 0, sizes.width, sizes.height)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, sizes.width, sizes.height)
    tree.tick(ms, ctx)
}

loop(draw)
