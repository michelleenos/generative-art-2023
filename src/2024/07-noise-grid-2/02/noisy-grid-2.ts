import { GUI } from 'lil-gui'
import loop from '~/helpers/loop'
import { Rectangle } from '~/helpers/trig-shapes'
import '~/style.css'
import createCanvas from '../../../helpers/canvas/createCanvas'

import { GuiWithLocalStorage } from '~/helpers/debug/gui-local-storage'
import easing from '~/helpers/easings'
import { Sizes } from '~/helpers/sizes'
import { random, shuffle } from '~/helpers/utils'
import { boxesHorizontal, boxesVertical, circle, circleOutlines, eqTriangle } from '../patterns'
import { TreePattern } from '../tree-animation-pattern'

const patterns = {
    circleOutlines,
    circle,
    eqTriangle,
    boxesHorizontal,
    boxesVertical,
}
const sizes = new Sizes()
let { ctx, resizeCanvas } = createCanvas(sizes.width, sizes.height)
sizes.on('resize', resizeCanvas)

let palettes = [
    ['#081232', '#bba0ca', '#fff8e8', '#fcd581', '#d52941', '#990d35'],
    ['#fefaec', '#f398c3', '#cf3895', '#a0d28d', '#06b4b0', '#fed000', '#FF8552'],
    ['#002e2d', '#06b4b0', '#cf3895', '#fff8e8', '#f398c3', '#a0d28d', '#ffd930', '#FF8552'],
    ['#331c25', '#3c2e6b', '#0081af', '#a7d6c3', '#285943', '#8a8fbd', '#9a79b8', '#fcee49'],
]
let m = Math.min(sizes.width, sizes.height) * 0.9
let palette = [...random(palettes)]
let bg = palette.shift()!
palette = shuffle(palette)

let tree = new TreePattern({
    bounds: new Rectangle((sizes.width - m) / 2, (sizes.height - m) / 2, m, m),
    palette,
    patterns,
})

tree.initTree()

const makeGui = (tree: TreePattern) => {
    let gui = new GUI().close()
    let gls = new GuiWithLocalStorage('tree', gui)

    gls.add(tree, 'nodeDuration', [100, 2000, 1])
    gls.add(tree, 'maxDepth', [1, 20, 1])
    gls.add(tree, 'minDepth', [1, 20, 1])
    gls.add(tree, 'divideRule', [
        ['half', 'random', 'thirds-row', 'two-thirds', 'quarters-grid', 'quarters-random'],
    ]).onChange(tree.initTree)

    gls.add(tree, 'noiseSpeed1', [0, 2, 0.001])
    gls.add(tree, 'noiseSpeed2', [0, 2, 0.001])
    gls.add(tree, 'minLifeSpan', [100, 10000, 10])
    gls.add(tree, 'noiseVarColor', [[1, 2]])
    gls.add(tree, 'noiseVarPattern', [[1, 2]])
    gls.add(tree, 'noiseVarChange', [[1, 2]])
    gls.add(tree, 'thresholdChange', [0, 1, 0.01])
    gls.add(tree, 'nodeEaseEnter', [Object.keys(easing)])
    gls.add(tree, 'nodeEaseLeave', [Object.keys(easing)])
    gui.add(tree, 'initTree').name('re init tree')
    gui.add(gls, 'resetVals')

    return gui
}

makeGui(tree)

function draw(ms: number) {
    ctx.clearRect(0, 0, sizes.width, sizes.height)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, sizes.width, sizes.height)
    tree.tick(ms, ctx)
}

loop(draw)
