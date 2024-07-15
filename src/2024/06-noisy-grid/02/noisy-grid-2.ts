import { GUI } from 'lil-gui'
import loop from '~/helpers/loop'
import { Rectangle } from '~/helpers/trig-shapes'
import '~/style.css'
import createCanvas from '../../../helpers/canvas/createCanvas'
import { Tree } from './tree-animation'
import { DataView, DataViewSection } from '~/helpers/debug/data-view'
import Stats from 'stats.js'
import { Sizes } from '~/helpers/sizes'
import { GuiWithLocalStorage } from '~/helpers/debug/gui-local-storage'
import { shuffle } from '~/helpers/utils'
import easing from '~/helpers/easings'

let stats = new Stats()
document.body.appendChild(stats.dom)

const sizes = new Sizes()
let { ctx, resizeCanvas } = createCanvas(sizes.width, sizes.height)
sizes.on('resize', resizeCanvas)

let palettes = [
    ['#fc440f', '#b4e33d', '#1effbc', '#7c9299', '#1f01b9'],
    ['#2e294e', '#d7263d', '#f46036', '#1b998b', '#c5d86d'],
    ['#bba0ca', '#fff8e8', '#fcd581', '#d52941', '#990d35'],
]
let m = Math.min(sizes.width, sizes.height) * 0.9
let tree = new Tree({
    bounds: new Rectangle((sizes.width - m) / 2, (sizes.height - m) / 2, m, m),
    palette: shuffle(palettes[1]),
})

tree.initTree()
// window.tree = tree

const makeGui = (gui: GUI, dv: DataViewSection) => {
    let gls = new GuiWithLocalStorage('tree', gui)

    gls.add(tree, 'nodeDuration', [100, 2000, 1])
    gls.add(tree.initTreeParams, 'count', [10, 1000, 1]).name('init count')
    gls.add(tree.initTreeParams, 'biasX', [0, 1, 0.01]).name('init biasX')
    gls.add(tree.initTreeParams, 'biasY', [0, 1, 0.01]).name('init biasY')
    gls.add(tree.initTreeParams, 'influence', [0, 1, 0.01]).name('init influence')
    gls.add(tree, 'maxDepth', [1, 20, 1])
    gls.add(tree, 'minDepth', [1, 20, 1])
    gls.add(tree, 'divideRule', [
        ['half', 'random', 'thirds-row', 'two-thirds', 'quarters-grid', 'quarters-random'],
    ]).onChange(tree.initTree)

    gls.add(tree.noiseFreq1, 'x', [0, 5, 0.01], 'freq1x').name('noiseFreq1.x')
    gls.add(tree.noiseFreq1, 'y', [0, 5, 0.01], 'freq1y').name('noiseFreq1.y')
    gls.add(tree.noiseFreq2, 'x', [0, 5, 0.01], 'freq2x').name('noiseFreq2.x')
    gls.add(tree.noiseFreq2, 'y', [0, 5, 0.01], 'freq2y').name('noiseFreq2.y')
    gls.add(tree, 'noiseSpeed1', [0, 2, 0.001])
    gls.add(tree, 'noiseSpeed2', [0, 2, 0.001])
    gls.add(tree, 'minLifeSpan', [100, 10000, 10])
    gls.add(tree, 'noiseVarColor', [[1, 2]])
    gls.add(tree, 'noiseVarRot', [[1, 2]])
    gls.add(tree, 'noiseVarPattern', [[1, 2]]).onChange(tree.getNewData)
    gls.add(tree, 'noiseVarChange', [[1, 2]])
    gls.add(tree, 'thresholdChange', [0, 1, 0.01])

    gls.add(tree, 'nodeEaseEnter', [Object.keys(easing)])
    gls.add(tree, 'nodeEaseLeave', [Object.keys(easing)])

    gui.add(tree, 'initTree').name('re init tree')
    gui.add(gls, 'resetVals')

    dv.add(tree, 'currentMaxDepth', 0)
    dv.add(tree, 'tickCalculationsAvg', 0)
    dv.add(tree, 'leavesCountsAvg', 0)
}

let gui = new GUI().close()
let dv = new DataView().createSection('Tree')
makeGui(gui, dv)

// window.addEventListener('click', (e: MouseEvent) => {
//     if (!clicked) {
//         let x = e.clientX
//         let y = e.clientY

//         // x -= (sizes.width - m) / 2
//         // y -= (sizes.height - m) / 2

//         mouseX = x
//         mouseY = y

//         let leaf = tree.leaves.find((leaf) => leaf.bounds.contains(x, y))
//         if (leaf) {
//             console.log(leaf, leaf.nodeId)
//             tree.divide(leaf)
//             leaf.timer.log = true
//             // ctx.strokeStyle = '#fff'
//             // ctx.lineWidth = 2
//             // ctx.strokeRect(leaf.bounds.x, leaf.bounds.y, leaf.bounds.width, leaf.bounds.height)
//             dv.add(leaf.timer, 'progress')
//             dv.add(leaf.timer, 'linearProgress')
//         }
//         clicked = true
//         clickedTime = lastTime
//     } else {
//         clickUpdates++

//         ctx.clearRect(0, 0, sizes.width, sizes.height)
//         tree.tick(clickedTime + clickUpdates * 50, ctx)

//         ctx.fillStyle = '#fff'
//         ctx.arc(mouseX, mouseY, 5, 0, Math.PI * 2)
//         ctx.fill()
//         dv.update()
//     }
// })

// tree.outlines = true

function draw(ms: number) {
    ctx.clearRect(0, 0, sizes.width, sizes.height)
    tree.tick(ms, ctx)
    dv.update()
}

loop(draw)
