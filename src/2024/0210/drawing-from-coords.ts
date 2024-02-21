import p5 from 'p5'
import { mountains } from './mountains'

type Coords = [number, number][]

// https://stackoverflow.com/questions/1878907/how-can-i-find-the-smallest-difference-between-two-angles-around-a-point
const angleDiff = (a1: number, a2: number) => {
    let diff = a1 - a2
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    return Math.abs(diff)
}

function getLineSegments(coords: number[][], p: p5) {
    let segment: p5.Vector[] = []
    let segments: (typeof segment)[] = []
    let coord = p.createVector(coords[0][0], coords[0][1])
    let angle
    let i = 1
    while (i < coords.length) {
        let next = p.createVector(coords[i][0], coords[i][1])

        let nextAngle = coord.copy().sub(next).heading()
        if (!angle) angle = nextAngle
        if (angleDiff(nextAngle, angle) > 180 || p.dist(coord.x, coord.y, next.x, next.y) > 10) {
            if (segment.length > 1) segments.push(segment)
            segment = []
            angle = null
        } else {
            segment.push(next)
            angle = nextAngle
        }
        coord = next
        i++
    }

    if (segment.length) segments.push(segment)
    return segments
}

new p5((p: p5) => {
    let coords: Coords
    let segments: p5.Vector[][]
    let palette
    let done = false
    function setup() {
        coords = mountains

        let xvals = coords.map((c) => c[0])
        let yvals = coords.map((c) => c[1])
        let xmin = Math.min(...xvals)
        let xmax = Math.max(...xvals)
        let ymin = Math.min(...yvals)
        let ymax = Math.max(...yvals)

        p.angleMode(p.DEGREES)

        // scale the coordinates to fit the canvas
        coords = coords.map((c) => [
            p.round(p.map(c[0], xmin, xmax, 40, p.width - 40), 2),
            p.round(p.map(c[1], ymin, ymax, 40, p.height - 40), 2),
        ])
        segments = getLineSegments(coords, p)
    }

    p.setup = () => {
        p.createCanvas(500, 500)
        // p.pixelDensity(1)
        p.background('#fff')
        p.colorMode(p.HSL, 360, 100, 100, 1)
        setup()
    }

    p.draw = () => {
        if (done) return
        p.loadPixels()
        baseDrawing()
    }

    let currentSegment = 0
    let currentPoint = 0
    function baseDrawing() {
        p.strokeWeight(2)
        let i = 0
        while (i < 10 && !done) {
            let segment = segments[currentSegment]
            let point = segment[currentPoint]
            let nextPoint = segment[currentPoint + 1]
            p.line(point.x, point.y, nextPoint.x, nextPoint.y)

            currentPoint++
            if (currentPoint >= segment.length - 1) {
                currentPoint = 0
                currentSegment++
            }

            if (currentSegment >= segments.length) {
                done = true
            }

            i++
        }
    }
})
