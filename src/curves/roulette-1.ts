import '../style.css'
import p5 from 'p5'
import { Pane, InputBindingApi } from 'tweakpane'

new p5((p: p5) => {
    class Trochoid {
        r: number
        c: number
        d: number
        y: number
        stepSize: number
        mult: number
        points: { x: number; y: number }[] = []
        lineLen: number
        steps: any[] = []
        current: number = 0

        constructor(r, y, stepSize = 0.1, lineLen = r) {
            this.r = r
            this.c = 2 * p.PI * r
            this.d = r * 2
            this.y = y
            this.stepSize = stepSize
            this.mult = 1
            this.lineLen = lineLen

            this.makeSteps()
        }

        makeSteps() {
            let steps: any[] = []
            let x = -p.width / 2
            let rotation = 0
            let stepAmount = this.stepSize / (p.PI * 2)
            let xChange = this.c * stepAmount

            while (x <= p.width / 2) {
                rotation += this.stepSize
                x += xChange
                let pointx = p.cos(rotation) * this.lineLen + x
                let pointy = p.sin(rotation) * this.lineLen + this.y
                steps.push({
                    rotation: rotation,
                    x: x,
                    y: this.y,
                })
                this.points.push({
                    x: pointx,
                    y: pointy,
                })
            }

            this.steps = steps
        }

        draw = () => {
            let step = this.steps[this.current]
            let point = this.points[this.current]
            p.circle(step.x, step.y, this.d)
            p.line(step.x, step.y, point.x, point.y)
            p.fill(255)
            p.circle(point.x, point.y, 5)
            p.noFill()

            this.current++
            if (this.current >= this.steps.length) this.current = 0

            p.beginShape()
            for (let i = 0; i <= this.current; i++) {
                let pt = this.points[i]
                p.vertex(pt.x, pt.y)
            }
            p.endShape()
        }
    }

    let circ

    const PARAMS = {
        radius: 50,
        lineLen: 40,
        distToAdd: 0.1,
    }

    type PaneEls = {
        pane: Pane
        inputRadius: InputBindingApi<unknown, number>
        inputLineLen: InputBindingApi<unknown, number>
    }
    let pane = new Pane()
    const els: PaneEls = {
        pane,
        inputRadius: pane.addInput(PARAMS, 'radius', { min: 1, max: 100, step: 1 }),
        inputLineLen: pane.addInput(PARAMS, 'lineLen', { min: 1, max: 100, step: 1 }),
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.angleMode(p.RADIANS)
        circ = new Trochoid(PARAMS.radius, -PARAMS.radius)
    }

    p.draw = function () {
        p.background('#0a0a0a')
        p.translate(p.width / 2, p.height / 2)

        p.stroke('#fff')
        p.noFill()
        p.strokeWeight(0.5)
        p.line(-p.width / 2, 0, p.width / 2, 0)

        p.strokeWeight(1)
        circ.draw()
    }
})
