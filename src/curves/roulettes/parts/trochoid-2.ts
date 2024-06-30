import p5 from 'p5'
import { map, round } from '~/helpers/utils'

function simplify(num: number, denom: number) {
    let factor = gcf(num, denom)
    return { num: num / factor, denom: denom / factor }
}

function gcf(x: number, y: number) {
    let result = Math.min(x, y)
    while (result > 0) {
        if (x % result === 0 && y % result === 0) {
            break
        }
        result--
    }
    return result
}

interface TrochoidProps {
    y?: number
    lineLen?: number
    radius: number
}

export abstract class Trochoid {
    radius: number
    y: number
    lineLen: number
    points: { x: number; y: number }[] = []
    steps: { x: number; y: number; rotation: number }[] = []
    step: number = 0
    stepsPerSec: number = 60
    progress: number = 0

    constructor(opts: TrochoidProps) {
        this.radius = opts.radius
        this.y = opts.y ?? 0
        this.lineLen = opts.lineLen ?? this.radius
    }

    get circumference() {
        return 2 * Math.PI * this.radius
    }

    get current() {
        let total = this.steps.length * 2 - 2
        let current = Math.floor(this.step) % total
        if (current > this.steps.length - 1) current = total - current
        return current
    }

    abstract drawBase(p: p5): void
    abstract makeSteps(): void

    draw = (p: p5) => {
        this.drawBase(p)
        let step = this.steps[this.current]
        let point = this.points[this.current]

        if (!step) return

        p.circle(step.x, step.y, this.radius * 2)
        if (point) {
            p.line(step.x, step.y, point.x, point.y)
            p.fill(255)
            p.circle(point.x, point.y, 5)
        }

        p.noFill()

        p.beginShape()
        for (let i = 0; i <= this.current; i++) {
            let pt = this.points[i]
            if (pt) p.vertex(pt.x, pt.y)
        }
        p.endShape()
    }

    tick(delta: number) {
        this.step = this.step + delta * 0.06
    }
}

export class TrochoidOnLine extends Trochoid {
    width: number

    constructor({ radius, y = 0, lineLen = radius, width }: TrochoidProps & { width: number }) {
        super({ radius, y, lineLen })
        this.width = width

        this.makeSteps()
    }

    get stepSize() {
        return this.radius * 0.005
    }

    makeSteps() {
        this.steps = []
        this.points = []
        let x = -this.width / 2
        let rotation = Math.PI * 0.5
        let stepAmount = this.stepSize / (Math.PI * 2)
        let xChange = this.circumference * stepAmount

        while (x <= this.width / 2 + this.radius) {
            rotation += this.stepSize
            x += xChange
            let pointx = Math.cos(rotation) * this.lineLen + x
            let pointy = Math.sin(rotation) * this.lineLen + this.y
            this.steps.push({
                rotation: rotation,
                x: x,
                y: this.y,
            })
            this.points.push({
                x: pointx,
                y: pointy,
            })
        }
    }

    drawBase = (p: p5) => {
        p.push()
        p.strokeWeight(0.5)
        p.line(-p.width / 2, this.y + this.radius, p.width / 2, this.y + this.radius)
        p.pop()
    }
}

interface EpitrochoidProps {
    cx?: number
    y?: number
    lineLen?: number
}

interface EpitrochoidPropsRadius extends EpitrochoidProps {
    radius: number
    baseRadius: number
}

interface EpitrochoidPropsRatio extends EpitrochoidProps {
    ratio: number
    radius?: number
}

function isPropsRatio(object: any): object is EpitrochoidPropsRatio {
    return 'ratio' in object
}

export class Epitrochoid extends Trochoid {
    private _baseRadius: number
    cx: number
    ratio?: number

    constructor(opts: EpitrochoidPropsRadius | EpitrochoidPropsRatio) {
        let radius
        let baseRadius
        let ratio

        if (isPropsRatio(opts)) {
            radius = opts.radius ?? 30
            baseRadius = radius * opts.ratio
            ratio = opts.ratio
        } else {
            radius = opts.radius
            baseRadius = opts.baseRadius
        }

        let y = opts.y ?? 0
        let cx = opts.cx ?? 0
        let lineLen = opts.lineLen ?? radius

        super({ radius, y, lineLen })

        if (ratio) this.ratio = ratio
        this._baseRadius = baseRadius
        this.cx = cx

        this.makeSteps()
    }

    get baseRadius() {
        if (this.ratio) {
            return this.radius * this.ratio
        } else {
            return this._baseRadius
        }
    }

    set baseRadius(n: number) {
        this._baseRadius = n
    }

    get circumferenceBase() {
        return 2 * Math.PI * this.baseRadius
    }

    makeSteps() {
        this.steps = []
        this.points = []

        let traveledOnBase = 0
        let circumferenceBase = this.circumferenceBase
        let rotation = 0

        let { denom } = simplify(this.radius, this.baseRadius)
        let max = Math.ceil(Math.PI * 2 * denom)

        let stepSize = Math.min(
            map(denom, 1, 60, this.radius * 0.1, this.radius * 0.3),
            this.radius * 0.3
        )
        let rotationStep = (stepSize / this.circumference) * Math.PI * 2

        while (rotation <= max) {
            traveledOnBase += stepSize
            let baseAngle = (traveledOnBase / circumferenceBase) * Math.PI * 2
            rotation += rotationStep

            let outerCx = Math.cos(baseAngle) * (this.radius + this.baseRadius)
            let outerCy = Math.sin(baseAngle) * (this.radius + this.baseRadius)

            let x = outerCx - Math.cos(baseAngle + rotation) * this.lineLen
            let y = outerCy - Math.sin(baseAngle + rotation) * this.lineLen

            this.points.push({ x, y })
            this.steps.push({
                rotation,
                x: outerCx,
                y: outerCy,
            })
        }
    }

    drawBase = (p: p5) => {
        p.push()
        p.strokeWeight(0.5)
        p.noFill()
        p.circle(this.cx, this.y, this.baseRadius * 2)
        p.pop()
    }
}

interface HypotrochoidProps extends TrochoidProps {
    cx?: number
    baseRadius?: number
}

export class Hypotrochoid extends Trochoid {
    baseRadius: number
    cx: number

    constructor(opts: HypotrochoidProps) {
        let radius = opts.radius
        let baseRadius = opts.baseRadius ?? radius
        let y = opts.y ?? 0
        let cx = opts.cx ?? 0
        let lineLen = opts.lineLen ?? radius

        super({ radius, y, lineLen })

        this.baseRadius = baseRadius
        this.cx = cx

        this.makeSteps()
    }

    get circumferenceBase() {
        return 2 * Math.PI * this.baseRadius
    }

    makeSteps() {
        this.steps = []
        this.points = []

        let traveledOnBase = 0
        let cBase = this.circumferenceBase
        let rotation = 0

        let { denom } = simplify(this.radius, this.baseRadius)
        let max = Math.ceil(Math.PI * 2 * denom)

        let stepSize = Math.min(
            map(denom, 1, 60, this.radius * 0.1, this.radius * 0.3),
            this.radius * 0.3
        )
        let rotationStep = (stepSize / this.circumference) * Math.PI * 2

        while (rotation >= max * -1) {
            traveledOnBase += stepSize
            let baseAngle = (traveledOnBase / cBase) * Math.PI * 2
            rotation -= rotationStep

            let movingCx = Math.cos(baseAngle) * (this.baseRadius - this.radius)
            let movingCy = Math.sin(baseAngle) * (this.baseRadius - this.radius)

            let x = movingCx + Math.cos(baseAngle + rotation) * this.lineLen
            let y = movingCy + Math.sin(baseAngle + rotation) * this.lineLen

            this.points.push({ x, y })
            this.steps.push({
                rotation,
                x: movingCx,
                y: movingCy,
            })
        }
    }

    drawBase = (p: p5) => {
        p.push()
        p.strokeWeight(0.5)
        p.noFill()
        p.circle(this.cx, this.y, this.baseRadius * 2)
        p.pop()
    }
}
