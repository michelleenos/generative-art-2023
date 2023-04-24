import '../style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import easings from '~/helpers/easings'
import { Pane } from 'tweakpane'
import {
    Point,
    getRandomPoints,
    reflectPoints,
    drawPoints,
    drawPoint,
} from './parts/points'
import quadLoop from '~/helpers/canvas/quadLoop'
import loop from '~/helpers/loop'
import { map } from '~/helpers/utils'

const easeOpts = Object.keys(easings).reduce(
    (acc, key) => ({ ...acc, [key]: key }),
    {}
)

const PARAMS = {
    showPoints: false,
    showOrigin: true,
    pointsReflection: true,
    easing: 'outCubic',
    lines: 15,
    scaleMin: 0.6,
    pointsN: 10,
}

const pane = new Pane()
function setPane() {
    pane.addInput(PARAMS, 'easing', { options: easeOpts, label: 'lines ease' })
    pane.addInput(PARAMS, 'showPoints')
    pane.addInput(PARAMS, 'showOrigin')
    pane.addInput(PARAMS, 'lines', { min: 1, max: 25, step: 1 })
    pane.addInput(PARAMS, 'scaleMin', { min: 0, max: 1, step: 0.01 })

    let folderPoints = pane.addFolder({ title: 'points' })
    let pointsInput = folderPoints.addInput(PARAMS, 'pointsN', {
        min: 3,
        max: 25,
        step: 1,
    })
    const btn = folderPoints.addButton({
        title: `generate new shape with ${PARAMS.pointsN} points`,
    })
    pointsInput.on('change', () => {
        btn.title = `generate new shape with ${PARAMS.pointsN} points`
    })
    btn.on('click', setup)
}

let width = window.innerWidth
let height = window.innerHeight
let { ctx } = createCanvas(width, height)
ctx.translate(width / 2, height / 2)

let points1: Point[] = []
let points2: Point[] = []
let timing: { x: (t: number) => number; y: (t: number) => number }[] = []

function scaledLoop(origin, scale, points) {
    ctx.save()
    ctx.translate(origin.x, origin.y)
    ctx.scale(scale, scale)
    ctx.translate(-origin.x, -origin.y)

    quadLoop(ctx, points)
    ctx.restore()
}

function drawing(t) {
    ctx.clearRect(-width / 2, -height / 2, width, height)

    let points: Point[] = []
    for (let i = 0; i < points1.length; i++) {
        let x = timing[i].x(t)
        let y = timing[i].y(t)
        points.push({ x, y })
    }

    let origin = {
        x: points.reduce((acc, cur) => acc + cur.x, 0) / points.length,
        y: points.reduce((acc, cur) => acc + cur.y, 0) / points.length,
    }

    if (PARAMS.showPoints) drawPoints(ctx, points)
    if (PARAMS.showOrigin) drawPoint(ctx, origin, 15, '#f00')

    ctx.strokeStyle = '#fff'

    for (let iScale = 0; iScale < PARAMS.lines; iScale++) {
        let val = easings[PARAMS.easing](iScale / PARAMS.lines)
        let scale = map(val, 0, 1, PARAMS.scaleMin, 1)
        scaledLoop(origin, scale, points)
        ctx.stroke()
    }
}

function setup() {
    points1 = getRandomPoints(PARAMS.pointsN, width, height)
    points1 = points1.sort(
        (a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x)
    )
    // the line above is to sort the points in a clockwise order

    points2 = PARAMS.pointsReflection
        ? reflectPoints(points1)
        : getRandomPoints(PARAMS.pointsN, width, height)

    let timingVariation = 2000
    let speedMult = 2.5
    for (let i = 0; i < PARAMS.pointsN; i++) {
        let x = Math.floor(Math.random() * timingVariation) + 1500
        let y = Math.floor(Math.random() * timingVariation) + 1500

        timing.push({
            x: (t) => {
                return map(
                    Math.cos((t * speedMult) / x),
                    -1,
                    1,
                    points1[i].x,
                    points2[i].x
                )
            },
            y: (t) => {
                return map(
                    Math.sin((t * speedMult) / y),
                    -1,
                    1,
                    points1[i].y,
                    points2[i].y
                )
            },
        })
    }
}

ctx.strokeStyle = '#fff'
ctx.fillStyle = '#fff'

setup()
setPane()
loop(drawing)
