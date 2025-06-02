import p5 from 'p5'
import { easing, type Easing } from '~/helpers/easings'
import { clamp, lerp, map, random, shuffle } from '~/helpers/utils'

type StaggerOpts = {
    total: number
    steps: number
    each: number
    start?: number
    ease?: Easing
}

function stagger({ total, steps, each, ease, start = 0 }: StaggerOpts) {
    let space = total - each
    let vals = []

    for (let i = 0; i < steps; i++) {
        let dec = i / steps
        if (ease) dec = easing[ease](dec)

        let startVal = space * dec + start
        vals.push({ start: startVal, duration: each, end: startVal + each })
    }

    return vals
}

function findCircleLineIntersections(
    r: number,
    h: number,
    k: number,
    m: number,
    n: number,
    opt: 1 | 2 = 1
) {
    // circle: (x - h)^2 + (y - k)^2 = r^2
    // line: y = m * x + n
    // r: circle radius
    // h: x value of circle centre
    // k: y value of circle centre
    // m: slope
    // n: y-intercept

    // get a, b, c values
    var a = 1 + m * m
    var b = -h * 2 + m * (n - k) * 2
    var c = h * h + (n - k) * (n - k) - r * r

    // get discriminant
    var d = b * b - 4 * a * c
    if (d >= 0) {
        // insert into quadratic formula
        if (opt === 1) {
            let x = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a)
            let y = m * x + n
            return [x, y]
        } else {
            let x = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a)
            let y = m * x + n
            return [x, y]
        }
    }

    return []
}

export class Tile {
    time = 0
    t1: number = 3000
    t2: number = 4500
    t3: number = 6000
    x: number
    y: number
    sz: number
    delay = 0
    delayTime = 0
    clrs: string[]
    done = false

    constructor(x: number, y: number, sz: number, clrs: string[], timeStart = 0) {
        this.x = x
        this.y = y
        this.sz = sz
        this.clrs = shuffle([...clrs])
        this.time = timeStart
    }

    update(delta: number) {
        if (this.delayTime <= this.delay) {
            this.delayTime += delta
            return
        }

        this.time += delta

        if (this.time >= this.t3) {
            this.time = this.t3
            this.done = true
        }
    }

    draw(_p: p5) {}

    restart() {
        this.time = -(this.t3 - this.t2)
        // this.delayTime = 0
    }
}

export class TileSquares extends Tile {
    rectCount = 3
    stagger: ReturnType<typeof stagger>

    rotateProgress = 0
    shrinkProgress = 0
    curSize = 0
    alpha = 255

    constructor(...args: ConstructorParameters<typeof Tile>) {
        super(...args)
        this.stagger = stagger({ total: 1, steps: this.rectCount, each: 0.7 })
        // this.t1 = 3000
        // this.t2 = this.t1 + Math.floor(random(1000, 5000))
        // this.t3 = this.t2 + 2000
    }

    update(delta: number) {
        super.update(delta)
        this.alpha = 255
        this.rotateProgress = 0
        this.shrinkProgress = 0

        if (this.time > 0 && this.time < this.t1 * (2 / 3)) {
            let prGrow = map(this.time, 0, this.t1 * (2 / 3), 0, 1)
            this.curSize = this.sz * easing.inCubic(prGrow)
        } else if (this.time >= this.t1 * (2 / 3)) {
            this.curSize = this.sz
        }

        if (this.time >= this.t1 / 3 && this.time < this.t1) {
            this.rotateProgress = map(this.time, this.t1 / 3, this.t1, 0, 1)
        }

        if (this.time > this.t2) {
            let pr = map(this.time, this.t2, this.t3, 0, 1)
            this.shrinkProgress = easing.inOutSine(pr)
            this.curSize = this.sz * 0.5 + this.sz * 0.5 * (1 - pr)
        }
    }

    restart() {
        super.restart()
        this.curSize = 0
        this.shrinkProgress = 0
        this.rotateProgress = 0
    }

    draw(p: p5) {
        let color = p.color(this.clrs[0])
        color.setAlpha(this.alpha)
        p.stroke(color).noFill()

        this.stagger.forEach((s) => {
            let pr = p.constrain(p.norm(this.rotateProgress, s.start, s.end), 0, 1)
            pr = easing.inCubic(pr)

            let ps = p.constrain(p.norm(this.shrinkProgress, s.start, s.end), 0, 1)
            ps = easing.outQuart(1 - ps)

            let size = this.curSize * ps

            p.push()
            p.translate(this.x, this.y)
            p.rotate(p.PI * 0.5 * pr)
            p.translate(-this.x, -this.y)
            p.rect(this.x, this.y, size, size)
            p.pop()
        })
    }
}

export class TileCircSquare extends Tile {
    stagger: ReturnType<typeof stagger>
    linesCountSide = 6
    linesProgress = 0
    arcProgress = 0
    sqSizeRatio = 0.2
    alpha = 255

    constructor(...args: ConstructorParameters<typeof Tile>) {
        super(...args)

        this.stagger = stagger({
            steps: this.linesCountSide * 4,
            total: 1,
            each: 0.5,
        })

        // this.t1 = 3000
        // this.t2 = this.t1 + Math.floor(random(1000, 5000))
        // this.t3 = this.t2 + 2000
    }

    update(delta: number) {
        super.update(delta)

        if (this.time <= 0) return
        if (this.time < this.t1 * 0.7) {
            this.arcProgress = easing.inCubic(this.time / (this.t1 * 0.7))
        } else {
            this.arcProgress = 1
        }

        if (this.time >= this.t1 * 0.3 && this.time < this.t1) {
            this.linesProgress = map(this.time, this.t1 * 0.3, this.t1, 0, 1)
        }

        if (this.time >= this.t2) {
            let pr = map(this.time, this.t2, this.t3, 0, 1)
            this.sqSizeRatio = 0.2 + easing.inQuart(pr) * 0.5
            // this.alpha = 255 * (1 - pr)
        }
    }

    restart() {
        super.restart()
        this.arcProgress = 0
        this.linesProgress = 0
        this.alpha = 255
        this.sqSizeRatio = 0.2
    }

    draw(p: p5) {
        let color = p.color(this.clrs[0])
        color.setAlpha(this.alpha)
        p.stroke(color).noFill().strokeWeight(1)

        p.push()
        p.translate(this.x, this.y)
        if (this.arcProgress > 0.001) {
            p.arc(0, 0, this.sz, this.sz, p.PI * 0.5, p.PI * 0.5 + p.PI * 2 * this.arcProgress)
        }
        let sqSize = this.sz * this.sqSizeRatio

        let x1 = -sqSize / 2
        let x2 = sqSize / 2
        let y1 = -sqSize / 2
        let y2 = sqSize / 2

        let pts = [
            [x1, y1],
            [x2, y1],
            [x2, y2],
            [x1, y2],
        ]
        let step = (Math.PI * 0.5) / this.linesCountSide

        let num = 0
        pts.forEach((pt, pti) => {
            for (let i = 0; i < this.linesCountSide; i++) {
                let { start, end } = this.stagger[num]
                let pr = p.constrain(p.norm(this.linesProgress, start, end), 0, 1)
                pr = easing.outCubic(pr)

                let a = step * i + Math.PI * 0.5 * (pti % 2 === 0 ? 1 : 0) + 0.01 // adding 0.01 to avoid straight vertical lines which mess up the calculations
                let slope = Math.tan(a)
                let yInt = pt[1] - slope * pt[0]
                let [x1, y1] = findCircleLineIntersections(
                    pr * this.sz * 0.5,
                    0,
                    0,
                    slope,
                    yInt,
                    pti >= 2 ? 2 : 1
                )
                p.line(pt[0], pt[1], x1, y1)
                num++
            }
        })

        p.pop()
    }
}
