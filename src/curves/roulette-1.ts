import '../style.css'
import p5 from 'p5'
import { Pane, InputBindingApi } from 'tweakpane'

class RefreshContainer {
    private readonly pane: Pane
    private refreshing_ = false

    constructor(pane: Pane) {
        this.pane = pane
    }

    get refreshing(): boolean {
        return this.refreshing_
    }

    public refresh(): void {
        this.refreshing_ = true
        this.pane.refresh()
        this.refreshing_ = false
    }
}

new p5((p: p5) => {
    class Trochoid {
        radius: number
        y: number
        stepSize: number
        mult: number
        points: { x: number; y: number }[] = []
        lineLen: number
        steps: any[] = []
        current: number = 0

        constructor(r, y, stepSize = 0.1, lineLen = r) {
            this.radius = r
            this.y = y
            this.stepSize = stepSize
            this.mult = 1
            this.lineLen = lineLen

            this.makeSteps()
        }

        get circumference() {
            return 2 * p.PI * this.radius
        }

        makeSteps() {
            let steps: any[] = []
            let points: any[] = []
            let x = -p.width / 2
            let rotation = p.PI * 0.5
            let stepAmount = this.stepSize / (p.PI * 2)
            let xChange = this.circumference * stepAmount

            while (x <= p.width / 2 + this.radius) {
                rotation += this.stepSize
                x += xChange
                let pointx = p.cos(rotation) * this.lineLen + x
                let pointy = p.sin(rotation) * this.lineLen + this.y
                steps.push({
                    rotation: rotation,
                    x: x,
                    y: this.y,
                })
                points.push({
                    x: pointx,
                    y: pointy,
                })
            }

            this.steps = steps
            this.points = points
        }

        draw = () => {
            let total = this.steps.length * 2 - 2
            let current = p.frameCount % total
            if (current > this.steps.length - 1) current = total - current
            let step = this.steps[current]
            let point = this.points[current]
            p.circle(step.x, step.y, this.radius * 2)
            p.line(step.x, step.y, point.x, point.y)
            p.fill(255)
            p.circle(point.x, point.y, 5)
            p.noFill()

            p.beginShape()
            for (let i = 0; i <= current; i++) {
                let pt = this.points[i]
                p.vertex(pt.x, pt.y)
            }
            p.endShape()
        }
    }

    let circ

    const PARAMS = {
        radius: 50,
        type: 'cycloid',
    }

    let pane = new Pane()
    let rc = new RefreshContainer(pane)
    let inputRadius, inputLineLen

    function makeInput(value, opts?) {
        if (!opts) opts = { min: 1, max: 100, step: 1 }
        let input = pane.addInput(circ, value, opts)
        input.on('change', function (e) {
            circ.makeSteps()
            if (circ.radius > circ.lineLen) {
                PARAMS.type = 'curtate'
            } else if (circ.radius < circ.lineLen) {
                PARAMS.type = 'prolate'
            } else {
                PARAMS.type = 'cycloid'
            }

            rc.refresh()
        })
        return input
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.angleMode(p.RADIANS)
        circ = new Trochoid(PARAMS.radius, -PARAMS.radius)
        inputRadius = makeInput('radius')
        inputLineLen = makeInput('lineLen')

        pane.addInput(PARAMS, 'type', {
            options: {
                cycloid: 'cycloid',
                'prolate trochoid': 'prolate',
                'curtate trochoid': 'curtate',
            },
        }).on('change', (e) => {
            if (rc.refreshing) return
            if (PARAMS.type === 'curtate') {
                circ.lineLen = Math.floor(circ.radius * 0.65)
            } else if (PARAMS.type === 'prolate') {
                circ.lineLen = Math.floor(circ.radius * 1.4)
            } else if (PARAMS.type === 'cycloid') {
                circ.lineLen = circ.radius
            }
            rc.refresh()
        })
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
