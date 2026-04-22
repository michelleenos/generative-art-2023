import p5 from 'p5'
import { random } from '~/helpers/utils'

type NumOrMinMax = number | [min: number, max: number]

export interface MoveOpts {
    // distMin?: number
    dist?: NumOrMinMax
    // distMax?: number
    moveToIndex?: number
}

export interface ShapeOpts {
    scale?: NumOrMinMax
    rotate?: boolean
}

export interface TrisOpts {
    // scale?: number | [number, number]
    scaleBase?: number
    scaleAlt?: number
    scaleAltChance?: number
    num?: number
    translate?: NumOrMinMax | false
    colorFn?: () => void
}

export interface CirclesOpts {
    radius?: number | (() => number)
    num?: number
    colorFn?: () => void
    translate?: false | number
}

export interface LinesOpts {
    num?: number
}

const midpoint = (a: p5.Vector, b: p5.Vector) => new p5.Vector((a.x + b.x) / 2, (a.y + b.y) / 2)

export class HexelsUtils {
    p: p5
    pts: p5.Vector[]
    palette: string[]
    constructor(p: p5, pts: p5.Vector[], palette: string[]) {
        this.p = p
        this.pts = pts
        this.palette = palette
    }

    colorFromIndex(index: number) {
        return this.palette[index % this.palette.length]
    }

    fillOrStroke(index = -1, weight = 2) {
        const col = index > -1 ? this.colorFromIndex(index) : random(this.palette)
        if (random() < 0.5) {
            this.p.noFill()
            this.p.stroke(col)
            this.p.strokeWeight(weight)
        } else {
            this.p.noStroke()
            this.p.fill(col)
        }
        return this
    }

    stroke(index: number = -1, weight = 2) {
        this.p.noFill()
        this.p.stroke(index > -1 ? this.colorFromIndex(index) : random(this.palette))
        this.p.strokeWeight(weight)
        return this
    }

    fill(index: number = -1) {
        this.p.noStroke()
        this.p.fill(index > -1 ? this.colorFromIndex(index) : random(this.palette))
        return this
    }

    strokeFill(iStroke: number = -1, iFill: number = -1, weight = 2) {
        if (iStroke === -1) iStroke = Math.floor(random(this.palette.length))
        this.p.stroke(this.palette[iStroke])
        if (iFill === -1) iFill = (iStroke + 1) % this.palette.length
        this.p.fill(this.palette[iFill])
        this.p.strokeWeight(weight)
        return this
    }

    moveCenter({ moveToIndex, dist = [0.2, 0.8] }: MoveOpts = {}) {
        const move = (typeof moveToIndex === 'number' ? this.pts[moveToIndex] : random(this.pts))
            .copy()
            .mult(typeof dist === 'number' ? dist : random(...dist))
        this.p.translate(move.x, move.y)
    }

    shape(pts: p5.Vector[], shapeOpts?: ShapeOpts, moveCenterOpts?: MoveOpts): void
    shape(shapeOpts?: ShapeOpts, moveCenterOpts?: MoveOpts): void
    shape(p1?: p5.Vector[] | ShapeOpts, p2?: ShapeOpts | MoveOpts, p3?: MoveOpts) {
        let pts: p5.Vector[]
        let shapeOpts: ShapeOpts
        let moveCenterOpts: MoveOpts | undefined
        if (Array.isArray(p1)) {
            pts = p1
            shapeOpts = { rotate: false, ...(p2 || {}) }
            moveCenterOpts = p3
        } else {
            pts = this.pts
            shapeOpts = { rotate: false, ...(p1 || {}) }
            moveCenterOpts = p3
        }

        const { rotate, scale } = shapeOpts
        this.p.push()
        if (moveCenterOpts) this.moveCenter(moveCenterOpts)
        rotate && this.p.rotate(Math.PI / 2)
        let shapePts = [...pts]
        if (scale) {
            let scaleAmt = typeof scale === 'number' ? scale : random(...scale)
            shapePts = shapePts.map((pt) => pt.copy().mult(scaleAmt))
        }
        this.p.beginShape()
        shapePts.forEach((pt) => this.p.vertex(pt.x, pt.y))
        this.p.vertex(shapePts[0].x, shapePts[0].y)
        this.p.endShape()
        this.p.pop()
    }

    trisRound(
        {
            translate = 0.3,
            num = 3,
            scaleBase = 0.5,
            scaleAlt,
            scaleAltChance = 0.5,
            colorFn = undefined,
        }: TrisOpts = {},
        moveOpts?: MoveOpts,
    ) {
        this.p.push()
        if (moveOpts) this.moveCenter({ ...moveOpts })
        let indexes = this.pts.map((_, i) => i)
        this.p.shuffle(indexes, true)
        if (!num) num = this.p.floor(this.p.random(indexes.length))

        let len = indexes.length

        for (let i = 0; i < Math.min(num, len); i++) {
            let ind = indexes[i]
            let pt1 = this.pts[ind]
            let pt2 = this.pts[(ind + 1) % len]

            let scale = scaleBase
            if (typeof scaleAlt === 'number' && typeof scaleAltChance === 'number') {
                scale = this.p.random() < scaleAltChance ? scaleAlt : scale
            }

            this.p.push()
            if (translate) {
                let tr = typeof translate === 'number' ? translate : this.p.random(...translate)
                let trans = midpoint(pt1, pt2).mult(tr)
                this.p.translate(trans.x, trans.y)
            }

            pt1 = pt1.copy().mult(scale)
            pt2 = pt2.copy().mult(scale)

            if (colorFn) colorFn()
            this.shape([new p5.Vector(0, 0), pt1, pt2])
            this.p.pop()
        }

        this.p.pop()
    }

    lines({ num = 0 }: LinesOpts = {}, moveOpts?: MoveOpts) {
        this.p.push()
        if (moveOpts) this.moveCenter(moveOpts)
        let ptsCopy = this.pts.map((pt) => pt)
        this.p.shuffle(ptsCopy, true)
        if (!num) num = Math.floor(random(ptsCopy.length))

        for (let i = 0; i < Math.min(num, ptsCopy.length - 1); i++) {
            this.p.line(ptsCopy[i].x, ptsCopy[i].y, 0, 0)
        }

        this.p.pop()
    }

    circles(
        { radius = 7, num, translate = 0.5, colorFn = undefined }: CirclesOpts = {},
        moveOpts?: MoveOpts,
    ) {
        let ptsCopy = this.pts.map((pt) => pt)
        this.p.shuffle(ptsCopy, true)
        if (!num) num = Math.ceil(random(ptsCopy.length))

        this.p.push()
        if (moveOpts) this.moveCenter(moveOpts)

        for (let i = 0; i < Math.min(num, ptsCopy.length); i++) {
            let pt = ptsCopy[i]
            this.p.push()
            if (translate) {
                let trans = pt.copy().mult(translate)
                this.p.translate(trans.x, trans.y)
            }
            let r = typeof radius === 'function' ? radius() : radius
            if (colorFn) colorFn()

            this.p.circle(0, 0, r)
            this.p.pop()
        }

        this.p.pop()
    }
}
