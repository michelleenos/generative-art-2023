import '../../style.css'
import createCanvas from '../../helpers/canvas/createCanvas'
import { randomBias } from '~/helpers/utils'
import { QuadTree } from '~/helpers/quadtree'
import { Rectangle } from '~/helpers/trig-shapes'
import { Sizes } from '~/helpers/sizes'
import { GUI } from 'lil-gui'

const sizes = new Sizes()
let { ctx, canvas, resizeCanvas } = createCanvas(sizes.width, sizes.height)
const gui = new GUI()

let points: [number, number][] = []
let quadTree: QuadTree<[number, number]> = new QuadTree(
    new Rectangle(0, 0, sizes.width, sizes.height),
    4
)
let rects: Rectangle[] = []

const P = {
    influence: 0.5,
    biasX: 0.5,
    biasY: 0.5,
    count: 30,
}

function getPoints() {
    let points: [number, number][] = []
    for (let i = 0; i < P.count; i++) {
        let x = randomBias(0, sizes.width, sizes.width * P.biasX, P.influence)
        let y = randomBias(0, sizes.height, sizes.height * P.biasY, P.influence)
        points.push([x, y])
    }

    return points
}

canvas.addEventListener('click', (e) => {
    let x = e.clientX / sizes.width
    let y = e.clientY / sizes.height
    P.biasX = x
    P.biasY = y
    getData()
    draw()
})

function draw() {
    ctx.clearRect(0, 0, sizes.width, sizes.height)

    for (let rect of rects) {
        ctx.strokeStyle = 'white'
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    }

    for (let [x, y] of points) {
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
    }
}

function getData() {
    quadTree.clear()
    quadTree.bounds = new Rectangle(0, 0, sizes.width, sizes.height)
    points = getPoints()
    points.forEach((point) => quadTree.insert(point))
    rects = quadTree.getAllRects()
}

function getDataAndDraw() {
    getData()
    draw()
}
sizes.on('resize', (width, height) => {
    resizeCanvas(width, height)
    getDataAndDraw()
})

gui.add(P, 'influence', 0, 1).step(0.01)
gui.add(P, 'biasX', 0, 1).step(0.01).listen()
gui.add(P, 'biasY', 0, 1).step(0.01).listen()
gui.add(P, 'count', 1, 100).step(1)
gui.onChange(getDataAndDraw)

getDataAndDraw()
