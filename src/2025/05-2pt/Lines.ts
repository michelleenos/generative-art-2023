import p5 from 'p5'

type Pt = [number, number]

type VerticalLine = { lineX: number }
type HorizontalLine = { lineY: number }

export class Line {
    p1?: Pt
    p2?: Pt

    lineX?: number
    lineY?: number

    m: number
    yInt: number
    a: number
    b: number
    c: number

    constructor(p1: Pt, p2: Pt) {
        this.p1 = p1
        this.p2 = p2

        if (this.p1[0] === this.p2[0]) {
            this.lineX = this.p1[0]
            this.m = Infinity
            this.yInt = NaN
            this.a = 1
            this.b = 0
            this.c = this.p1[0]
            return
        }
        if (this.p1[1] === this.p2[1]) {
            this.lineY = this.p1[1]
            this.m = 0
            this.yInt = this.p1[1]
            this.a = 0
            this.b = 1
            this.c = this.p1[1]
            return
        }
        ;({ m: this.m, yInt: this.yInt } = this.getSlopeIntercept(p1, p2))
        ;({ a: this.a, b: this.b, c: this.c } = this.getAbc(p1, p2))
    }

    isVertical(): this is VerticalLine {
        return this.lineX !== undefined
    }

    isHorizontal(): this is HorizontalLine {
        return this.lineY !== undefined
    }

    draw(p: p5) {
        if (!this.p1 || !this.p2) return
        p.line(this.p1[0], this.p1[1], this.p2[0], this.p2[1])
    }

    getSlopeIntercept(p1: Pt, p2: Pt) {
        let denom = p2[0] - p1[0]
        if (denom === 0) throw new Error('This is a vertical line')
        let m = (p2[1] - p1[1]) / denom
        // y = mx + b
        // b = y - mx
        let yInt = p1[1] - m * p1[0]
        return { m, yInt }
    }

    getAbc(p1: Pt, p2: Pt) {
        let a = p1[1] - p2[1]
        let b = p2[0] - p1[0]
        let c = p1[0] * p2[1] - p2[0] * p1[1]
        return { a, b, c }
    }

    isEqual(other: Line, tolerance = 0.0001) {
        let mDiff = Math.abs(this.m - other.m)
        if (mDiff > tolerance) return false
        let yIntDiff = Math.abs(this.yInt - other.yInt)
        if (yIntDiff > tolerance) return false
        return true
    }

    y(x: number) {
        // line: x = 5
        // y(5) = all y
        // y(anything else) = NaN
        if (this.isVertical()) {
            if (x !== this.lineX) throw new Error(`Vertical line has no y for x ${x}`)
            else throw new Error(`Vertical line has all y for x ${x}`)
        } else if (this.isHorizontal()) {
            return this.lineY
        }
        return this.m * x + this.yInt
    }

    x(y: number) {
        if (this.isHorizontal()) {
            if (y !== this.lineY) throw new Error(`Horizontal line has no x for y ${y}`)
            else throw new Error(`Horizontal line has all x for y ${y}`)
        } else if (this.isVertical()) {
            return this.lineX
        }
        return (y - this.yInt) / this.m
    }

    drawFull(p: p5) {
        p.line(-p.width, this.y(-p.width), p.width, this.y(p.width))
    }

    getIntersection(other: Line): Pt {
        if (
            (this.isHorizontal() && other.isHorizontal()) ||
            (this.isVertical() && other.isVertical())
        ) {
            throw new Error(`Lines are parallel`)
        }

        if (other.isEqual(this)) {
            throw new Error(`Lines are the same`)
        }

        if (this.isHorizontal() && other.isVertical()) {
            return [other.lineX, this.lineY]
        }

        if (this.isVertical() && other.isHorizontal()) {
            return [this.lineX, other.lineY]
        }

        if (this.isHorizontal()) {
            return [other.x(this.lineY), this.lineY]
        }

        if (other.isHorizontal()) {
            return [this.x(other.lineY), other.lineY]
        }

        if (this.isVertical()) {
            return [this.lineX, other.y(this.lineX)]
        }

        if (other.isVertical()) {
            return [other.lineX, this.y(other.lineX)]
        }

        let denom = this.a * other.b - this.b * other.a
        if (denom === 0) {
            throw new Error(`Lines are parallel`)
        }
        let x = (this.b * other.c - this.c * other.b) / denom
        let y = (this.c * other.a - this.a * other.c) / denom
        return [x, y]
    }
}
