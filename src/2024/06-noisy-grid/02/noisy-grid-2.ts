import { GUI } from 'lil-gui'
import loop from '~/helpers/loop'
import { AnimatedTree } from './animated-tree'

import { Sizes } from '~/helpers/sizes'
import { Rectangle } from '~/helpers/trig-shapes'
import { random, randomBias } from '~/helpers/utils'
import '~/style.css'
import createCanvas from '../../../helpers/canvas/createCanvas'

const sizes = new Sizes()
let { ctx, canvas, resizeCanvas } = createCanvas(sizes.width, sizes.height)
let gridSize = Math.min(sizes.width, sizes.height) * 0.9
let palette = ['#1b998b', '#2e294e', '#f46036', '#c5d86d', '#d7263d']

let points: [number, number][] = []
let tree = new AnimatedTree(new Rectangle(0, 0, sizes.width, sizes.height), 1)

const P = {
    influence: 0.5,
    biasX: Math.random(),
    biasY: Math.random(),
    count: 30,
}

function getPoints() {
    let points: [number, number][] = []
    for (let i = 0; i < P.count; i++) {
        let x = randomBias(0, gridSize, gridSize * P.biasX, P.influence)
        let y = randomBias(0, gridSize, gridSize * P.biasY, P.influence)
        points.push([x, y])
    }

    return points
}

// canvas.addEventListener('click', (e) => {
//     let leftOffset = (sizes.width - gridSize) / 2
//     let topOffset = (sizes.height - gridSize) / 2

//     let x = e.clientX - leftOffset
//     let y = e.clientY - topOffset

//     // points.push([x, y])
//     // quadTree.insert([x, y])
//     updateRects()
// })

let lastTime = 0
let lastDivide = 0
let lastCollapse = 0
function draw(ms: number) {
    let delta = ms - lastTime
    lastTime = ms
    tree.tick(delta)

    let leaves = tree.getLeaves()
    let nodes = tree.getAllNodes()

    // if (ms - lastDivide > 1000) {
    //     let leaf = random(leaves)
    //     leaf.setWillDivide()
    //     lastDivide = ms
    // }

    if (ms - lastCollapse > 2000) {
        let node = random(nodes)
        node.setWillCollapse()
        lastCollapse = ms
    }

    ctx.clearRect(0, 0, sizes.width, sizes.height)
    ctx.fillStyle = '#fffbf4'
    ctx.fillRect(0, 0, sizes.width, sizes.height)

    ctx.save()
    ctx.translate((sizes.width - gridSize) / 2, (sizes.height - gridSize) / 2)
    ctx.strokeStyle = '#121212'
    ctx.lineWidth = 3
    ctx.strokeRect(-1.5, -1.5, gridSize + 3, gridSize + 3)

    leaves.forEach((node, i) => {
        let progress = 1
        if (node.timer) {
            if (node.entering) {
                progress = node.timer.progress
            } else {
                progress = 1 - node.timer.progress
            }
        }
        // node.tick(delta)

        ctx.fillStyle = palette[0]
        ctx.beginPath()
        ctx.arc(
            node.bounds.x + node.bounds.width / 2,
            node.bounds.y + node.bounds.height / 2,
            Math.min(node.bounds.width, node.bounds.height) * 0.48 * progress,
            0,
            Math.PI * 2
        )
        ctx.fill()

        ctx.strokeStyle = '#121212'
        ctx.lineWidth = 1
        ctx.strokeRect(node.bounds.x, node.bounds.y, node.bounds.width, node.bounds.height)

        // if (node instanceof AnimatedTree && node.willDivide) {
        //     ctx.strokeStyle = palette[2]
        //     ctx.lineWidth = 3
        //     ctx.strokeRect(node.bounds.x, node.bounds.y, node.bounds.width, node.bounds.height)
        // }
    })

    ctx.restore()
}

function getData() {
    tree.clear()
    tree.bounds = new Rectangle(0, 0, gridSize, gridSize)
    points = getPoints()
    points.forEach((point) => {
        tree.insert(point)
    })
    // updateRects()
}

// function updateRects() {
//     leaves = tree.getLeaves()
// }

sizes.on('resize', (width, height) => {
    resizeCanvas(width, height)
    gridSize = Math.min(width, height) * 0.9
    getData()
})

getData()
loop(draw)
