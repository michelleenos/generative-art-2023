import { Line } from './Lines'
import type { Pt, TwoPtSide, TwoPtSidesBox } from './types'
import p5 from 'p5'

type DrawBoxProps = {
    sides: TwoPtSidesBox
    vpa: Pt
    vpb: Pt
    colors: string[]
    fill?: boolean
}

export function drawBox({ sides, vpa, vpb, colors, fill = true }: DrawBoxProps, p: p5) {
    let horizonLine = new Line(vpa, vpb)
    let { a, b, c, d } = sides
    let showTop = false
    let showBottom = false

    let horizonYAtSideA = horizonLine.y(a.x)
    let horizonYAtSideD = horizonLine.y(d.x)
    // let hAtSideB
    if (
        a.y1 > horizonYAtSideA &&
        a.y2 > horizonYAtSideA &&
        d.y1 > horizonYAtSideD &&
        d.y2 > horizonYAtSideD
    ) {
        showTop = true
    }
    if (
        a.y1 < horizonYAtSideA &&
        a.y2 < horizonYAtSideA &&
        d.y1 < horizonYAtSideD &&
        d.y2 < horizonYAtSideD
    ) {
        showBottom = true
    }

    p.push()
    p.stroke(colors[0]).strokeWeight(3)

    if (!fill) p.noFill()

    if (showTop) {
        fill && p.fill(colors[1])
        p.beginShape()
        p.vertex(a.x, a.y1)
        p.vertex(b.x, b.y1)
        p.vertex(d.x, d.y1)
        p.vertex(c.x, c.y1)
        p.endShape(p.CLOSE)
    }
    if (showBottom) {
        fill && p.fill(colors[1])
        p.beginShape()
        p.vertex(a.x, a.y2)
        p.vertex(b.x, b.y2)
        p.vertex(d.x, d.y2)
        p.vertex(c.x, c.y2)
        p.endShape(p.CLOSE)
    }

    fill && p.fill(colors[2])
    p.beginShape()
    p.vertex(a.x, a.y1)
    p.vertex(b.x, b.y1)
    p.vertex(b.x, b.y2)
    p.vertex(a.x, a.y2)
    p.endShape(p.CLOSE)

    fill && p.fill(colors[3])
    p.beginShape()
    p.vertex(a.x, a.y1)
    p.vertex(c.x, c.y1)
    p.vertex(c.x, c.y2)
    p.vertex(a.x, a.y2)
    p.endShape(p.CLOSE)

    p.pop()

    // d && p.line(d.x, d.y1, d.x, d.y2)
}
