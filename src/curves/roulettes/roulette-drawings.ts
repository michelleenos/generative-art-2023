import p5 from 'p5'
import { simplify } from '~/helpers/utils'

interface RouletteProps {
    cy?: number
    lineLen: number
    speed?: number
    movingRadius: number
}

export abstract class Roulette {
    protected _movingRadius: number
    cy: number
    lineLen: number
    steps: { cx: number; cy: number; pointX: number; pointY: number }[] = []
    time: number = 0
    speed = 0.06
    animate = true
    showBase = true
    showMoving = true

    constructor(opts: RouletteProps) {
        this._movingRadius = opts.movingRadius
        this.cy = opts.cy ?? 0
        this.lineLen = opts.lineLen
        this.speed = opts.speed ?? 0.06
    }

    get circumference() {
        return 2 * Math.PI * this._movingRadius
    }

    get movingRadius() {
        return this._movingRadius
    }

    set movingRadius(n: number) {
        this._movingRadius = n
        this.makeSteps()
    }

    get current() {
        let total = this.steps.length * 2 - 2
        let current = Math.floor(this.time) % total
        if (current > this.steps.length - 1) current = total - current
        return current
    }

    abstract drawBase(p: p5): void
    abstract makeSteps(): void

    drawFull = (p: p5) => {
        if (this.showBase) this.drawBase(p)
        p.beginShape()
        for (let i = 0; i < this.steps.length; i++) {
            let step = this.steps[i]
            if (step) p.vertex(step.pointX, step.pointY)
        }
        p.endShape()
    }

    draw = (p: p5) => {
        if (!this.animate) return this.drawFull(p)
        if (this.showBase) this.drawBase(p)
        let step = this.steps[this.current]

        if (!step) return

        if (this.showMoving) {
            p.stroke(255).strokeWeight(1)
            p.circle(step.cx, step.cy, this._movingRadius * 2)
            p.line(step.cx, step.cy, step.pointX, step.pointY)
            p.fill(255).noStroke()
            p.circle(step.pointX, step.pointY, 5)
        }

        p.noFill().stroke(255).strokeWeight(1)

        p.beginShape()
        for (let i = 0; i <= this.current; i++) {
            let step = this.steps[i]
            if (step) p.vertex(step.pointX, step.pointY)
        }
        p.endShape()

        // p.fill(255)
        // p.text(this.current, 10, 20)
    }

    tick(delta: number) {
        if (!this.animate) return
        this.time = this.time + delta * this.speed
    }

    restart() {
        this.time = 0
    }
}

export class Trochoid extends Roulette {
    width: number

    constructor({
        movingRadius,
        cy = 0,
        lineLen = movingRadius,
        width,
    }: RouletteProps & { width: number }) {
        super({ cy, lineLen, movingRadius })
        this.width = width

        this.makeSteps()
    }

    // x = a * θ - b * sin(θ)
    // y = a - b * cos(θ)
    // a = moving radius, b = line length
    makeSteps() {
        this.steps = []
        let xStep = 2
        let thetaStep = Math.PI * 2 * (xStep / this.circumference)

        let theta = Math.PI * 0.5
        let cx = -this.width / 2
        let pointX = Math.cos(theta) * this.lineLen + cx

        // let rotations = this.width / this.circumference
        // let thetaEnd = rotations * Math.PI * 2

        while (cx < this.width / 2 + this.lineLen) {
            theta += thetaStep
            cx += xStep

            pointX = Math.cos(theta) * this.lineLen + cx
            let pointY = Math.sin(theta) * this.lineLen + this.cy

            this.steps.push({
                cx,
                cy: this.cy,
                pointX,
                pointY,
            })
        }
    }

    drawBase = (p: p5) => {
        p.push()
        p.strokeWeight(0.5)
        p.line(-p.width / 2, this.cy + this.movingRadius, p.width / 2, this.cy + this.movingRadius)
        p.pop()
    }
}

type CircleRouletteProps = RouletteProps & { cx?: number; baseRadius: number }
export class CircleRoulette extends Roulette {
    cx: number
    _baseRadius: number
    _ratio: number
    maxAngle: number
    stepSize = 0.05
    type: 'hypotrochoid' | 'epitrochoid' = 'hypotrochoid'
    fixRatio = false
    fixLineLen = false

    constructor({
        cy = 0,
        cx = 0,
        movingRadius,
        baseRadius = movingRadius,
        lineLen = movingRadius,
    }: CircleRouletteProps) {
        super({ movingRadius, cy, lineLen })
        this._baseRadius = baseRadius
        this.cx = cx

        this._ratio = this._baseRadius / this.movingRadius
        let { denom } = simplify(this._baseRadius, this.movingRadius)
        this.maxAngle = Math.PI * 2 * denom
    }

    get movingRadius() {
        return this._movingRadius
    }

    set movingRadius(n: number) {
        this._movingRadius = n
        if (this.fixLineLen) {
            this.lineLen = n
        }
        if (this.fixRatio) {
            this._baseRadius = n * this._ratio
        } else {
            this._ratio = this._baseRadius / this.movingRadius
        }
        this.makeSteps()
    }

    set baseRadius(n: number) {
        this._baseRadius = n
        if (this.fixRatio) {
            this._movingRadius = n / this._ratio
        } else {
            this._ratio = this._baseRadius / this.movingRadius
        }
        this.makeSteps()
    }

    get baseRadius() {
        return this._baseRadius
    }

    set ratio(n: number) {
        this._ratio = n
        this._baseRadius = this.movingRadius * n
        this.makeSteps()
    }

    get ratio() {
        return this._ratio
    }

    // hypotrochoid
    // x(θ) = (R - r)cos(θ) + d * cos(((R - r) / r)θ)
    // y(θ) = (R - r)sin(θ) - d * sin(((R - r) / r)θ)

    // epitrochoid
    // x(θ) = (R + r) * cos(θ) - d * cos(((R + r) / r) * θ)
    // y(θ) = (R + r) * sin(θ) - d * sin(((R + r) / r) * θ)
    makeSteps() {
        this.steps = []
        let baseRadius = this._baseRadius

        // denom is the number of rotations of the moving circle
        // num is the number of times the moving circle goes around the base circle
        let { denom, num } = simplify(baseRadius, this.movingRadius)
        this.maxAngle = Math.PI * 2 * denom

        let rounds = denom
        let steps = Math.ceil(200 * rounds)
        this.stepSize = this.maxAngle / steps
        let theta = 0

        while (theta <= this.maxAngle + this.stepSize) {
            theta += this.stepSize

            if (this.type === 'hypotrochoid') {
                let cx = (baseRadius - this.movingRadius) * Math.cos(theta)
                let cy = (baseRadius - this.movingRadius) * Math.sin(theta)

                let px =
                    cx +
                    this.lineLen *
                        Math.cos(((baseRadius - this.movingRadius) / this.movingRadius) * theta)
                let py =
                    cy -
                    this.lineLen *
                        Math.sin(((baseRadius - this.movingRadius) / this.movingRadius) * theta)

                this.steps.push({ cx, cy, pointX: px, pointY: py })
            } else {
                let cx = (baseRadius + this.movingRadius) * Math.cos(theta)
                let cy = (baseRadius + this.movingRadius) * Math.sin(theta)

                let px =
                    cx -
                    this.lineLen *
                        Math.cos(((baseRadius + this.movingRadius) / this.movingRadius) * theta)
                let py =
                    cy -
                    this.lineLen *
                        Math.sin(((baseRadius + this.movingRadius) / this.movingRadius) * theta)
                this.steps.push({ cx, cy, pointX: px, pointY: py })
            }
        }
    }

    drawBase = (p: p5) => {
        p.push()
        p.stroke(255).strokeWeight(0.5).noFill()
        p.circle(this.cx, this.cy, this._baseRadius * 2)
        p.pop()
    }
}
