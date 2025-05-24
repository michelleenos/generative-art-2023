import { GUI } from 'lil-gui'
import { createNoise3D } from 'simplex-noise'
import easing from '~/helpers/easings'
import loop from '~/helpers/loop'
import { QuadTree } from '~/helpers/quadtree'
import { leaf } from '~/helpers/shapes'
import { Sizes } from '~/helpers/sizes'
import { Rectangle } from '~/helpers/trig-shapes'
import { clamp, map, randomBias } from '~/helpers/utils'
import '~/style.css'
import createCanvas from '../../../helpers/create-canvas'

let noise3d = createNoise3D()

const sizes = new Sizes()
let { ctx, canvas, resizeCanvas } = createCanvas(sizes.width, sizes.height)
const gui = new GUI()
let gridSize = Math.min(sizes.width, sizes.height) * 0.9
let p1 = ['#25ced1', '#2c4251', '#b288c0']
let p2 = ['#f17300', '#2c4251', '#25ced1']

let points: [number, number][] = []
let quadTree: QuadTree<[number, number]> = new QuadTree(
    new Rectangle(0, 0, sizes.width, sizes.height),
    4
)
// let rects: { rect: Rectangle; depth: number }[] = []
let trees: QuadTree<[number, number]>[] = []
let maxDepth: number

const P = {
    influence: 0.5,
    biasX: 0.9,
    biasY: 0.5,
    count: 1000,
    drawThreshold: 0,
    reduceSize: 0.3,
    reducePower: 3,
    noiseSpeed: 0.3,
    noiseFreq1: 0.7,
    noiseFreq2: 1,
    stepSeconds: 1.4,
    stepChangeDuration: 0.5,
    stepChangeEase: 'outQuart' as keyof typeof easing,
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

canvas.addEventListener('click', (e) => {
    let leftOffset = (sizes.width - gridSize) / 2
    let topOffset = (sizes.height - gridSize) / 2

    let x = (e.clientX - leftOffset) / gridSize
    let y = (e.clientY - topOffset) / gridSize

    P.biasX = x
    P.biasY = y
    getData()
})

function draw(ms: number) {
    let gap = (gridSize / Math.pow(2, maxDepth)) * 0.1
    let t = ms / P.stepSeconds / 1000
    let tRemainder = t % 1
    let tInteger = Math.floor(t)
    if (tRemainder > 1 - P.stepChangeDuration) {
        t = tInteger + easing[P.stepChangeEase](map(tRemainder, 1 - P.stepChangeDuration, 1, 0, 1))
    } else {
        t = tInteger
    }
    // t = tRemainder > 0.5 ? tInteger + easing.inQuad(map(tRemainder, 0.5, 1, 0, 1)) : tInteger

    ctx.clearRect(0, 0, sizes.width, sizes.height)
    ctx.fillStyle = '#fffbf4'
    ctx.fillRect(0, 0, sizes.width, sizes.height)

    ctx.save()
    ctx.translate((sizes.width - gridSize) / 2, (sizes.height - gridSize) / 2)
    ctx.strokeStyle = '#121212'
    ctx.lineWidth = 3
    ctx.strokeRect(-1.5, -1.5, gridSize + 3, gridSize + 3)

    trees.forEach((tree, i) => {
        let rect = tree.bounds
        let cx = rect.x + rect.width / 2
        let cy = rect.y + rect.height / 2

        let fx = cx / gridSize
        let fy = cy / gridSize
        let noiseval1 = noise3d(fx * P.noiseFreq1, fy * P.noiseFreq2, t * P.noiseSpeed)
        let noiseval2 = noise3d(fx * P.noiseFreq2, fy * P.noiseFreq1, t * -P.noiseSpeed)
        let noiseVal = Math.max(noiseval1, noiseval2)
        if (noiseVal > P.drawThreshold) {
            let progress = map(noiseVal, P.drawThreshold + P.reduceSize, P.drawThreshold, 1, 0)
            progress = clamp(progress, 0, 1)
            progress = Math.pow(progress, P.reducePower)

            if (rect.width < gap || rect.height < gap) return

            let cornerX = noise3d(fx * P.noiseFreq1, fy * P.noiseFreq2, 0) > 0 ? 'l' : 'r'
            let cornerY = noise3d(fx * P.noiseFreq2, fy * P.noiseFreq1, 0) > 0 ? 't' : 'b'
            let corner = (cornerY + cornerX) as 'tl' | 'tr' | 'bl' | 'br'
            ctx.fillStyle = p1[i % p1.length]
            ctx.save()
            ctx.translate(rect.x + gap / 2, rect.y + gap / 2)
            leaf(ctx, {
                w: rect.width - gap,
                h: rect.height - gap,
                corner,
                progress,
            })
            ctx.fill()
            ctx.restore()
        } else {
            let progress = map(noiseVal, P.drawThreshold, P.drawThreshold - P.reduceSize, 0, 1)
            progress = clamp(progress, 0, 1)
            progress = Math.pow(progress, P.reducePower)

            if (rect.width < gap || rect.height < gap) return

            ctx.fillStyle = p2[i % p2.length]
            ctx.save()
            ctx.translate(cx + gap / 2, cy + gap / 2)
            ctx.beginPath()
            ctx.arc(0, 0, (rect.width - gap) * 0.5 * progress, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
        }
    })

    let c = quadTree.count
    ctx.fillStyle = '#121212'
    ctx.fillText(`Count: ${c}`, 10, 20)

    ctx.restore()
}

function getData() {
    quadTree.clear()
    quadTree.bounds = new Rectangle(0, 0, gridSize, gridSize)
    points = getPoints()
    points.forEach((point) => quadTree.insert(point))
    trees = quadTree.getLeafNodes()
    maxDepth = quadTree.maxDepth
}

sizes.on('resize', (width, height) => {
    resizeCanvas(width, height)
    gridSize = Math.min(width, height) * 0.9
    getData()
})

let qtreeFolder = gui.addFolder('quadtree points')
qtreeFolder.add(P, 'influence', 0, 2).step(0.01)
qtreeFolder.add(P, 'biasX', 0, 1).step(0.01).listen()
qtreeFolder.add(P, 'biasY', 0, 1).step(0.01).listen()
qtreeFolder.add(P, 'count', 1, 4000).step(1)
qtreeFolder.onChange(getData)

let guimain = gui.addFolder('shapes')
guimain.add(P, 'reduceSize', 0, 1).step(0.01)
guimain.add(P, 'drawThreshold', -1, 1).step(0.01)
guimain.add(P, 'reducePower', 0.01, 10).step(0.01)
guimain.add(P, 'noiseSpeed', 0.01, 1).step(0.01)
guimain.add(P, 'noiseFreq1', 0.1, 4).step(0.01)
guimain.add(P, 'noiseFreq2', 0.1, 4).step(0.01)
guimain.add(P, 'stepSeconds', 0.1, 10).step(0.1)
guimain.add(P, 'stepChangeDuration', 0.1, 1).step(0.1)
guimain.add(P, 'stepChangeEase', Object.keys(easing))

getData()
loop(draw)
