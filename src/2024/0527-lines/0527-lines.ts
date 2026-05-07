import { GUI } from 'lil-gui'
import createCanvas from '../../helpers/create-canvas'
import '../../style.css'
import { getPoints, getFaces } from './lines-points'
import { saveCanvasImage } from '~/helpers/canvas-save-image'

// let palette = ['#a935bb', '#f7b32b', '#f72c25', '#1c77c3']
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
}

let { ctx, canvas, resizeCanvas } = createCanvas(sizes.width, sizes.height)

window.addEventListener('resize', () => {
    if (P.useWindowSize) resize(window.innerWidth, window.innerHeight)
})

function resize(width: number, height: number) {
    sizes.width = width
    sizes.height = height
    resizeCanvas(sizes.width, sizes.height)
    draw()
}

let P = {
    blockSize: 200,
    maxWidthRatio: 0.9,
    maxHeightRatio: 0.85,
    useWindowSize: true,
    blockPadding: 80,
    edgesMax: 15,
    maxFails: 20,
    maxSegmentLen: 4,
    innerGrid: 3,
    startPoint: [1, 1] as [number, number],
    symmetry: 'reflect' as 'reflect' | 'rotate' | 'horizontal' | 'vertical',
}

let gui = new GUI().close()
let fl = gui.addFolder('layout')
fl.add(P, 'blockPadding', 0, 200, 1)
fl.add(P, 'blockSize', 10, 500, 1)
fl.add(P, 'maxWidthRatio', 0, 1, 0.01)
fl.add(P, 'maxHeightRatio', 0, 1, 0.01)
fl.add(P, 'useWindowSize').onChange((val: boolean) => {
    if (val) {
        resize(window.innerWidth, window.innerHeight)
        sf.hide()
    } else {
        sf.show()
    }
})

const sf = gui
    .addFolder('size')
    .hide()
    .onChange(() => {
        if (!P.useWindowSize) resize(sizes.width, sizes.height)
    })
sf.add(sizes, 'width', 10, 3000, 1)
sf.add(sizes, 'height', 10, 3000, 1)

let fp = gui.addFolder('lines/points')
fp.add(P, 'edgesMax', 1, 50, 1)
fp.add(P, 'maxFails', 1, 100, 1)
fp.add(P, 'maxSegmentLen', 1, 50, 1)
fp.add(P, 'innerGrid', 1, 10, 1)
fp.add(P.startPoint, '0', 0, 10, 1).name('start x')
fp.add(P.startPoint, '1', 0, 10, 1).name('start y')
fp.add(P, 'symmetry', ['reflect', 'rotate', 'horizontal', 'vertical'])
gui.add({ save: () => saveCanvasImage(canvas) }, 'save')
fp.onChange(draw)
fl.onChange(draw)
canvas.addEventListener('click', draw)

type PointsArr = ([number, number] | false)[]

function quadrant(
    points: ([number, number] | false)[],
    size: number,
    faces?: { cells: string[]; enclosed: boolean }[],
) {
    let step = size / P.innerGrid
    let breaks = 0
    ctx.strokeStyle = `#ffffff`

    for (let i = 1; i < points.length; i++) {
        let p1 = points[i - 1]
        let p2 = points[i]
        if (p1 === false || p2 === false) {
            breaks++
            continue
        }
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
    faces?: { cells: string[]; enclosed: boolean }[],
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

// function setup() {
//     points = []
//     for (let i = 0; i < P.tiles * P.tiles; i++) {
//         points.push(
//             getPoints({
//                 startPoint: P.startPoint,
//                 innerGrid: P.innerGrid,
//                 symmetry: P.symmetry,
//                 maxFails: P.maxFails,
//                 edgesMax: P.edgesMax,
//                 maxSegmentLen: P.maxSegmentLen,
//             }),
//         )
//     }
// }

function draw() {
    ctx.fillStyle = '#121212'
    ctx.fillRect(0, 0, sizes.width, sizes.height)

    let mw = sizes.width * P.maxWidthRatio
    let mh = sizes.height * P.maxHeightRatio

    let blockSize = P.blockSize
    let blocksX = Math.floor(mw / blockSize)
    let blocksY = Math.floor(mh / blockSize)
    mw = blockSize * blocksX
    mh = blockSize * blocksY
    let blockPadding = P.blockPadding

    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#fff'
    ctx.fillStyle = '#fff'

    ctx.save()
    ctx.translate((sizes.width - mw) / 2, (sizes.height - mh) / 2)
    for (let x = 0; x < blocksX; x++) {
        for (let y = 0; y < blocksY; y++) {
            ctx.save()
            ctx.translate(x * blockSize + blockPadding / 2, y * blockSize + blockPadding / 2)
            let points = getPoints({
                startPoint: P.startPoint,
                innerGrid: P.innerGrid,
                symmetry: P.symmetry,
                maxFails: P.maxFails,
                edgesMax: P.edgesMax,
                maxSegmentLen: P.maxSegmentLen,
            })
            mirroredQuadrants(points.points, blockSize - blockPadding)
            ctx.restore()
        }
    }
    ctx.restore()
}

draw()
