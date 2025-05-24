import { GUI } from 'lil-gui'
import createCanvas from '../../helpers/create-canvas'
import '../../style.css'
import { getPoints } from './lines-points'

// let palette = ['#a935bb', '#f7b32b', '#f72c25', '#1c77c3']

let width = window.innerWidth
let height = window.innerHeight
let { ctx, canvas } = createCanvas(width, height)
let P = {
    tiles: 3,
    padding: 0.15,
    edgesMax: 15,
    edgesAttempts: 20,
    edgesBreak: 4,
    innerGrid: 3,
    startPoint: [1, 1] as [number, number],
    symmetry: 'reflect' as 'reflect' | 'rotate' | 'horizontal' | 'vertical',
}

let gui = new GUI().close()
gui.add(P, 'tiles', 1, 10, 1)
gui.add(P, 'padding', 0, 0.5, 0.01)
gui.add(P, 'edgesMax', 1, 50, 1)
gui.add(P, 'edgesAttempts', 1, 50, 1)
gui.add(P, 'edgesBreak', 1, 50, 1)
gui.add(P, 'innerGrid', 1, 10, 1)
gui.add(P.startPoint, '0', 0, 10, 1).name('start x')
gui.add(P.startPoint, '1', 0, 10, 1).name('start y')
gui.add(P, 'symmetry', ['reflect', 'rotate', 'horizontal', 'vertical'])
gui.onChange(() => {
    setup()
    draw()
})
canvas.addEventListener('click', () => {
    setup()
    draw()
})

type PointsArr = ([number, number] | false)[]
let points: ReturnType<typeof getPoints>[] = []

function quadrant(
    points: ([number, number] | false)[],
    size: number,
    faces?: { cells: string[]; enclosed: boolean }[]
) {
    let step = size / P.innerGrid
    for (let i = 1; i < points.length; i++) {
        let p1 = points[i - 1]
        let p2 = points[i]
        if (p1 === false || p2 === false) continue
        let [x1, y1] = p1
        let [x2, y2] = p2
        ctx.beginPath()
        ctx.moveTo(x1 * step, y1 * step)
        ctx.lineTo(x2 * step, y2 * step)
        ctx.stroke()
    }

    if (faces) {
        quadrantFaces(faces, size)
    }
}

function quadrantFaces(faces: { cells: string[]; enclosed: boolean }[], size: number) {
    let step = size / P.innerGrid
    faces.forEach((facePoints) => {
        let enclosed = facePoints.enclosed
        if (enclosed) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)'
        } else {
            ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 50%, 0.1)`
        }
        facePoints.cells.forEach((pt) => {
            let arr = pt.split('-')
            let x = parseInt(arr[0])
            let y = parseInt(arr[1])
            ctx.fillRect(x * step, y * step, step, step)
        })
    })
}

function mirroredQuadrants(
    points: PointsArr,
    size: number,
    faces?: { cells: string[]; enclosed: boolean }[]
) {
    let step = size / 2
    ctx.save()
    if (P.symmetry === 'reflect') {
        ctx.translate(step, step)
        ctx.scale(1, -1)
        quadrant(points, step, faces)
        ctx.scale(1, -1)
        quadrant(points, step, faces)
        ctx.scale(-1, 1)
        quadrant(points, step, faces)
        ctx.scale(1, -1)
        quadrant(points, step, faces)
    } else if (P.symmetry === 'rotate') {
        ctx.translate(step, step)
        quadrant(points, step, faces)
        ctx.rotate(Math.PI / 2)
        quadrant(points, step, faces)
        ctx.rotate(Math.PI / 2)
        quadrant(points, step, faces)
        ctx.rotate(Math.PI / 2)
        quadrant(points, step, faces)
    } else if (P.symmetry === 'horizontal') {
        ctx.translate(0, step)
        quadrant(points, step)
        ctx.scale(1, -1)
        quadrant(points, step)
    } else if (P.symmetry === 'vertical') {
        ctx.translate(step, 0)
        quadrant(points, step)
        ctx.scale(-1, 1)
        quadrant(points, step)
    }
    ctx.restore()
}

function setup() {
    points = []
    for (let i = 0; i < P.tiles * P.tiles; i++) {
        points.push(
            getPoints({
                startPoint: P.startPoint,
                innerGrid: P.innerGrid,
                symmetry: P.symmetry,
                edgesAttempts: P.edgesAttempts,
                edgesMax: P.edgesMax,
                edgesBreak: P.edgesBreak,
            })
        )
    }
}

function draw() {
    ctx.fillStyle = '#121212'
    ctx.fillRect(0, 0, width, height)
    let m = Math.min(width, height) * 0.85

    ctx.save()
    ctx.translate((width - m) / 2, (height - m) / 2)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#fff'
    ctx.fillStyle = '#fff'

    let blockStep = m / P.tiles
    let padding = blockStep * P.padding
    let blockSize = blockStep - padding * 2

    points.forEach(({ points: pointsArr }, i) => {
        let x = i % P.tiles
        let y = Math.floor(i / P.tiles)
        ctx.save()
        ctx.translate(x * blockStep + padding, y * blockStep + padding)
        // let faces = getFaces(edges, 3)
        mirroredQuadrants(pointsArr, blockSize)

        ctx.restore()
    })

    ctx.restore()
}

setup()
draw()
