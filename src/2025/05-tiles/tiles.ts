import p5 from 'p5'
import { easing, type Easing } from '~/helpers/easings'
import { clamp, lerp, map, random, shuffle } from '~/helpers/utils'
import { getStagger, StaggerVals } from '~/helpers/stagger'

type StaggerOpts = {
    total: number
    steps: number
    each: number
    start?: number
    ease?: Easing
}

// function stagger({ total, steps, each, ease, start = 0 }: StaggerOpts) {
//     let space = total - each
//     let vals = []

//     for (let i = 0; i < steps; i++) {
//         let dec = i / (steps - 1)
//         if (ease) dec = easing[ease](dec)

//         let startVal = space * dec + start
//         vals.push({ start: startVal, duration: each, end: startVal + each })
//     }

//     return vals
// }

type TileOpts = {
    x: number
    y: number
    sz: number
    clr: string
    unit: number
    delay?: number
}

type TileSizes = {
    x: number
    y: number
    sz: number
    top: number
    bottom: number
    left: number
    right: number
    unit: number
}

export abstract class Tile {
    time = 0
    t = { in: 3000, out: 2000 }
    pr = 0
    stage: 'in' | 'out' | 'show' | 'hide' | 'delay' = 'delay'
    x: number
    y: number
    sz: number
    unit: number
    prevSizes?: TileSizes
    delay = 0
    delayTime = 0
    rotate = 0
    clr: string

    abstract tDraw(p: p5): void

    constructor({ x, y, sz, clr, unit, delay = 0 }: TileOpts) {
        this.x = x
        this.y = y
        this.sz = sz
        this.unit = unit
        this.clr = clr
        this.rotate = random([0, 1, 2, 3])
        this.delay = delay
        // this.prevSizes
    }

    get sizes() {
        if (this.prevSizes && this.prevSizes.unit === this.unit) return this.prevSizes
        let x = this.x * this.unit
        let y = this.y * this.unit
        let sz = this.sz * this.unit
        return {
            x,
            y,
            sz,
            top: y - sz / 2,
            bottom: y + sz / 2,
            left: x - sz / 2,
            right: x + sz / 2,
            unit: this.unit,
        }
    }

    update(delta: number) {
        if (this.stage === 'delay') {
            this.delayTime += delta
            if (this.delayTime >= this.delay) {
                this.enter()
            }
            return
        }

        if (this.stage === 'in') {
            this.time += delta
            this.pr = map(this.time, 0, this.t.in, 0, 1)
            if (this.time >= this.t.in) {
                this.show()
            }
            return
        }

        if (this.stage === 'out') {
            this.time += delta
            this.pr = map(this.time, 0, this.t.out, 0, 1)
            if (this.time >= this.t.out) {
                this.stage = 'hide'
                this.pr = 1
            }
            return
        }
    }

    draw(p: p5) {
        if (this.stage === 'hide' || this.stage === 'delay') return

        let { x, y } = this.sizes
        p.push()
        p.translate(x, y)
        p.rotate((this.rotate * p.PI) / 2)
        p.translate(-x, -y)
        p.stroke(this.clr).noFill()
        this.tDraw(p)
        p.pop()
    }

    show() {
        this.stage = 'show'
        this.pr = 1
    }

    leave() {
        this.stage = 'out'
        this.time = 0
        this.pr = 0
    }

    enter() {
        this.stage = 'in'
        this.time = 0
        this.pr = 0
    }
}

export class TileCircle extends Tile {
    circsCount = 3
    circSizeMin = 0.6
    stagger: StaggerVals
    constructor(...args: ConstructorParameters<typeof Tile>) {
        super(...args)

        this.stagger = getStagger({ total: 1, steps: this.circsCount, each: 0.7 }).vals
    }

    tDraw(p: p5) {
        let { x, y, sz } = this.sizes
        let pr = this.stage === 'out' ? 1 - this.pr : this.pr
        let sizeStep = (1 - this.circSizeMin) / (this.circsCount - 1)

        p.stroke(this.clr).noFill()
        this.stagger.forEach((s, i) => {
            if (pr < s.start) return
            let pri = p.constrain(p.norm(pr, s.start, s.end), 0, 1)
            pri = easing.outCubic(pri)
            let dia = sz * (this.circSizeMin + sizeStep * (this.stagger.length - 1 - i)) * pri

            p.ellipse(x, y, dia)
        })
    }
}

export class TileLines extends Tile {
    lineCount = 9
    lineSpacing: number
    lineStagger: ReturnType<typeof getStagger>
    linesProgress = 0

    constructor(...args: ConstructorParameters<typeof Tile>) {
        super(...args)
        this.lineCount = random([11])
        this.lineStagger = getStagger({ total: 1, steps: this.lineCount, each: 0.5 })

        this.t.in = 2000
        this.lineSpacing = this.sz / (this.lineCount - 1)
    }

    updateLineVals() {
        this.lineSpacing = this.sz / (this.lineCount - 1)
        this.lineStagger = getStagger({ total: 1, steps: this.lineCount, each: 0.5 })
    }

    tDraw(p: p5) {
        let pr = this.stage === 'out' ? 1 - this.pr : this.pr
        let { sz, top, left } = this.sizes
        let space = sz / (this.lineCount - 1)
        p.stroke(this.clr).strokeWeight(1)
        let y1 = top

        this.lineStagger.vals.forEach((line, i) => {
            if (pr < line.start) return
            // let lp = p.constrain(p.norm(pr, line.start, line.end), 0, 1)
            let lp = this.lineStagger.getProgress(pr, i)

            let linex = left + space * i
            let y2 = y1 + sz * lp
            p.line(linex, y1, linex, y2)
        })
    }
}

export class TileTriSquare extends Tile {
    constructor(...args: ConstructorParameters<typeof Tile>) {
        super(...args)
        // this.left = this.x - this.sz / 2
        // this.right = this.x + this.sz / 2
        // this.top = this.y - this.sz / 2
        // this.bottom = this.y + this.sz / 2
    }

    tDraw(p: p5) {
        p.stroke(this.clr).noFill()
        let { sz, left, right, top, bottom } = this.sizes

        if (this.stage === 'in') {
            let pr = easing.inOutCubic(this.pr)
            let curSize = sz * p.constrain(p.norm(pr, 0, 0.45), 0, 1)
            let x = p.lerp(left, right, pr)
            let y = p.lerp(top, bottom, pr)
            p.beginShape()
            p.vertex(left, top + curSize)
            p.vertex(left, top)
            p.vertex(left + curSize, top)
            p.vertex(x, y)
            p.endShape(p.CLOSE)
        } else if (this.stage === 'show') {
            p.beginShape()
            p.vertex(left, bottom)
            p.vertex(left, top)
            p.vertex(right, top)
            p.vertex(right, bottom)
            p.endShape(p.CLOSE)
        } else if (this.stage === 'out') {
            let pr = easing.inOutCubic(1 - this.pr)
            let curSize = sz * p.constrain(p.norm(pr, 0, 0.5), 0, 1)

            let x = p.lerp(left, right, 1 - pr)
            let y = p.lerp(top, bottom, 1 - pr)

            p.beginShape()
            p.vertex(right, bottom - curSize)
            p.vertex(right, bottom)
            p.vertex(right - curSize, bottom)
            p.vertex(x, y)
            p.endShape(p.CLOSE)
        }
    }
}

// export class TileNestedTriSquare extends Tile {
//     innerTiles: TileTriSquare[]
//     stagger: ReturnType<typeof stagger>
//     constructor(...args: ConstructorParameters<typeof Tile>) {
//         super(...args)

//         this.stagger = stagger({ total: 1, steps: 4, each: 0.7 })

//         let isz = this.sz * 0.5 - 2
//         let step = this.sz * 0.25 + 1

//         this.innerTiles = [
//             new TileTriSquare({ x: this.x - step, y: this.y - step, sz: isz, clrs: this.clrs }),
//             new TileTriSquare({ x: this.x + step, y: this.y - step, sz: isz, clrs: this.clrs }),
//             new TileTriSquare({ x: this.x + step, y: this.y + step, sz: isz, clrs: this.clrs }),
//             new TileTriSquare({ x: this.x - step, y: this.y + step, sz: isz, clrs: this.clrs }),
//         ]
//         this.innerTiles.forEach((tri, i) => {
//             tri.rotate = i
//             tri.clrs = this.clrs
//         })
//     }

//     update(delta: number) {
//         super.update(delta)
//     }

//     enter() {
//         super.enter()
//         this.innerTiles.forEach((tri) => tri.enter())
//     }

//     leave() {
//         super.leave()
//         this.innerTiles.forEach((tri) => tri.leave())
//     }

//     show() {
//         super.show()
//         this.innerTiles.forEach((tri) => tri.show())
//     }

//     tDraw(p: p5) {
//         this.innerTiles.forEach((t, i) => {
//             let s = this.stagger[i]
//             t.pr = p.constrain(p.norm(this.pr, s.start, s.end), 0, 1)
//         })
//         this.innerTiles.forEach((tri) => {
//             tri.draw(p)
//         })
//     }
// }

export class TileDiag extends Tile {
    stagger: StaggerVals

    constructor(...args: ConstructorParameters<typeof Tile>) {
        super(...args)
        let steps = random([5, 9])
        this.stagger = getStagger({ total: 1, steps, each: 0.5 }).vals
        console.log(this.stagger)
        this.rotate = 0
    }

    tDraw(p: p5) {
        let { x, y, left, bottom, right, top, sz } = this.sizes

        let pr = this.stage === 'out' ? 1 - this.pr : this.pr

        let stepSide = sz / this.stagger.length
        let side2Step = 0

        this.stagger.forEach((s, i) => {
            if (pr < s.start) return
            if (pr >= s.end) side2Step = i
            let pri = p.constrain(p.norm(pr, s.start, s.end), 0, 1)
            // pri = easing.inCubic(pri)

            // let amt = p.lerp(0, sz, pri)
            let x1 = left
            let y1 = top + stepSide * (i + 1)
            let x2 = left + stepSide * (i + 1)
            let y2 = top

            x2 = p.lerp(x1, x2, pri)
            y2 = p.lerp(y1, y2, pri)

            p.line(x1, y1, x2, y2)
        })

        let last = this.stagger[this.stagger.length - 1]
        let side1Pr = p.constrain(p.norm(pr, 0, last.start), 0, 1)
        let side2Pr = p.constrain(p.norm(pr, 0, last.end), 0, 1)
        p.line(left, top, left, top + sz * side1Pr)
    }
}

export class TileTris extends Tile {
    // stagger: StaggerVals
    stagger: ReturnType<typeof getStagger>
    constructor(...args: ConstructorParameters<typeof Tile>) {
        super(...args)
        // let steps = random([2, 3])
        let steps = 2
        this.stagger = getStagger({ total: 1, steps, each: 0.75 })
    }

    drawTri(progress: number, p: p5) {
        let { sz } = this.sizes
        let y = (sz / this.stagger.vals.length) * progress
        let x = (sz / 2) * progress
        p.beginShape()
        p.vertex(0, 0)
        p.vertex(-x, y)
        p.vertex(x, y)
        p.endShape(p.CLOSE)
    }
    tDraw(p: p5) {
        let { x, y, sz } = this.sizes
        p.push()
        p.translate(x, y)

        p.stroke(this.clr).noFill()
        let pr = this.stage === 'out' ? 1 - this.pr : this.pr

        p.translate(0, -sz / 2)

        let translateStep = sz / this.stagger.vals.length

        this.stagger.vals.forEach((_s, i) => {
            // let tripr = p.constrain(p.norm(pr, s.start, s.end), 0, 1)
            let tripr = this.stagger.getProgress(pr, i)
            tripr = easing.inOutCubic(tripr)
            if (tripr > 0) this.drawTri(tripr, p)
            p.translate(0, translateStep)
        })

        p.pop()
    }
}

export class TileSquares extends Tile {
    stagger: StaggerVals
    constructor(...args: ConstructorParameters<typeof Tile>) {
        super(...args)
        this.stagger = getStagger({ total: 1, steps: 5, each: 0.75 }).vals
    }

    tDraw(p: p5) {
        let ir = this.sz * 0.2
        let mv = this.sz * 0.5 - ir

        p.stroke(this.clr).noFill()
        let points = [
            [-mv, -mv],
            [mv, -mv],
            [mv, mv],
            [-mv, mv],
            [0, 0],
        ]

        let pr = this.stage === 'out' ? 1 - this.pr : this.pr

        points.forEach(([mx, my], i) => {
            let s = this.stagger[i]
            let sqpr = p.constrain(p.norm(pr, s.start, s.end), 0, 1)
            sqpr = easing.inOutCubic(sqpr)
            if (sqpr > 0) p.rect(this.x + mx, this.y + my, ir * 2 * sqpr, ir * 2 * sqpr)
        })
    }
}
