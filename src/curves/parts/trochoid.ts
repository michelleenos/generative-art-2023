import p5 from 'p5'

type TrochoidPoints = { x: number; y: number }[]
type TrochoidSteps = { x: number; y: number; rotation: number }[]

export default function f(p: p5) {
    class Trochoid {
        radius: number
        y: number
        stepSize: number
        lineLen: number
        points: TrochoidPoints = []
        steps: TrochoidSteps = []

        constructor(radius, y, stepSize = 0.1, lineLen = radius) {
            this.radius = radius
            this.y = y
            this.stepSize = stepSize
            this.lineLen = lineLen
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
        constructor(radius, y, stepSize = 0.1, lineLen = radius) {
            super(radius, y, stepSize, lineLen)

            this.makeSteps()
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
        y?: number
        lineLen?: number
        stepSize?: number
        cx?: number
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
            let stepSize = opts.stepSize ?? radius * 0.1
            let lineLen = opts.lineLen ?? radius

            super(radius, y, stepSize, lineLen)

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
            let rotationStep = (this.stepSize / this.circumference) * p.PI * 2

            while (traveledOnBase <= circumferenceBase) {
                traveledOnBase += this.stepSize
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

            console.log(this.steps, this.circumferenceBase)
        }

        draw = () => {
            this.drawBase()

            let step = this.steps[this.current]
            let point = this.points[this.current]

            if (!step) return

            p.circle(step.x, step.y, this.radius * 2)
            p.line(step.x, step.y, point.x, point.y)

            p.beginShape()
            for (let i = 0; i < this.current; i++) {
                let pt = this.points[i]
                p.vertex(pt.x, pt.y)
            }
            p.endShape()
        }

        drawBase = () => {
            p.push()
            p.strokeWeight(0.5)
            p.noFill()
            p.circle(this.cx, this.y, this.baseRadius * 2)
            p.pop()
        }
    }

    return { TrochoidOnLine, Epitrochoid }
}
