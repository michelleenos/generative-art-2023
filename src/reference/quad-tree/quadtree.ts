import createCanvas from '~/helpers/create-canvas'
import { QuadTree } from '~/helpers/quadtree-2'
import { Rectangle } from '~/helpers/trig-shapes'
import { random } from '~/helpers/utils'

const width = 800
const height = 800
const cnvs = createCanvas(width, height)

const bounds = new Rectangle(0, 0, width, height)
const qt = new QuadTree(bounds)

function drawQt() {
    const trees = qt.getLeafNodes()

    const { ctx } = cnvs
    ctx.strokeStyle = '#000000'
    trees.forEach((t) => {
        let { bounds } = t
        ctx.beginPath()
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    })
}

function drawPoints() {
    const pts = qt.getAllPoints()
    const { ctx } = cnvs

    ctx.fillStyle = '#6d3fdf'
    pts.forEach(([x, y]) => {
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fill()
    })
}

function draw() {
    drawQt()
    drawPoints()
}

const { canvas } = cnvs
canvas.addEventListener('click', (e) => {
    let x = e.clientX
    let y = e.clientY

    let rect = canvas.getBoundingClientRect()

    x -= rect.left
    y -= rect.top

    let point = [x, y] as [number, number]
    qt.insert(point)

    draw()
})
;(window as any).qt = qt
