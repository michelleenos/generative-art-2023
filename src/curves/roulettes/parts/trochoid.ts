import p5 from 'p5'

function gcf(x, y) {
    let result = Math.min(x, y)
    while (result > 0) {
        if (x % result === 0 && y % result === 0) {
            break
        }
        result--
    }
    return result
}

function simplify(num, denom) {
    let factor = gcf(num, denom)
    return { num: num / factor, denom: denom / factor }
}

type TrochoidPoints = { x: number; y: number }[]
type TrochoidSteps = { x: number; y: number; rotation: number }[]

export default function f(p: p5) {
    interface TrochoidProps {
        y?: number
        lineLen?: number
        radius: number
    }
    class Trochoid {
        radius: number
        y: number
        lineLen: number
        points: TrochoidPoints = []
        steps: TrochoidSteps = []

        constructor(opts: TrochoidProps) {
            this.radius = opts.radius
            this.y = opts.y ?? 0
            this.lineLen = opts.lineLen ?? this.radius
        }

        get circumference() {
            return 2 * p.PI * this.radius
        }

        get current() {
            let total = this.steps.length * 2 - 2
            let current = p.frameCount % total
            if (current > this.steps.length - 1) current = total - current
            return current
        }

        draw = () => {
            this.drawBase()

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

        drawBase = () => {}
    }

    let TrochoidOnLine = class extends Trochoid {
        constructor({ radius, y = 0, lineLen = radius }: TrochoidProps) {
            super({ radius, y, lineLen })

            this.makeSteps()
        }

        get stepSize() {
            return this.radius * 0.005
        }

        makeSteps() {
            this.steps = []
            this.points = []
            let x = -p.width / 2
            let rotation = p.PI * 0.5
            let stepAmount = this.stepSize / (p.PI * 2)
            let xChange = this.circumference * stepAmount

            while (x <= p.width / 2 + this.radius) {
                rotation += this.stepSize
                x += xChange
                let pointx = p.cos(rotation) * this.lineLen + x
                let pointy = p.sin(rotation) * this.lineLen + this.y
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

        drawBase = () => {
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

    let Epitrochoid = class extends Trochoid {
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
            return 2 * p.PI * this.baseRadius
        }

        makeSteps() {
            this.steps = []
            this.points = []

            let traveledOnBase = 0
            let circumferenceBase = this.circumferenceBase
            let rotation = 0

            let { denom } = simplify(this.radius, this.baseRadius)
            let max = Math.ceil(Math.PI * 2 * denom)

            let stepSize = p.min(
                p.map(denom, 1, 60, this.radius * 0.1, this.radius * 0.3),
                this.radius * 0.3
            )
            let rotationStep = (stepSize / this.circumference) * p.PI * 2

            while (rotation <= max) {
                traveledOnBase += stepSize
                let baseAngle = (traveledOnBase / circumferenceBase) * p.PI * 2
                rotation += rotationStep

                let outerCx = p.cos(baseAngle) * (this.radius + this.baseRadius)
                let outerCy = p.sin(baseAngle) * (this.radius + this.baseRadius)

                let x = outerCx - p.cos(baseAngle + rotation) * this.lineLen
                let y = outerCy - p.sin(baseAngle + rotation) * this.lineLen

                this.points.push({ x, y })
                this.steps.push({
                    rotation,
                    x: outerCx,
                    y: outerCy,
                })
            }
        }

        drawBase = () => {
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

    let Hypotrochoid = class extends Trochoid {
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
            return 2 * p.PI * this.baseRadius
        }

        makeSteps() {
            this.steps = []
            this.points = []

            let traveledOnBase = 0
            let cBase = this.circumferenceBase
            let rotation = 0

            let { denom } = simplify(this.radius, this.baseRadius)
            let max = Math.ceil(Math.PI * 2 * denom)

            let stepSize = p.min(
                p.map(denom, 1, 60, this.radius * 0.1, this.radius * 0.3),
                this.radius * 0.3
            )
            let rotationStep = (stepSize / this.circumference) * p.PI * 2

            while (rotation >= max * -1) {
                traveledOnBase += stepSize
                let baseAngle = (traveledOnBase / cBase) * p.PI * 2
                rotation -= rotationStep

                let movingCx = p.cos(baseAngle) * (this.baseRadius - this.radius)
                let movingCy = p.sin(baseAngle) * (this.baseRadius - this.radius)

                let x = movingCx + p.cos(baseAngle + rotation) * this.lineLen
                let y = movingCy + p.sin(baseAngle + rotation) * this.lineLen

                this.points.push({ x, y })
                this.steps.push({
                    rotation,
                    x: movingCx,
                    y: movingCy,
                })
            }
        }

        drawBase = () => {
            p.push()
            p.strokeWeight(0.5)
            p.noFill()
            p.circle(this.cx, this.y, this.baseRadius * 2)
            p.pop()
        }
    }

    return { TrochoidOnLine, Epitrochoid, Hypotrochoid }
}
