import p5 from 'p5'
import { easing } from '~/helpers/easings'
import { getStagger } from '~/helpers/stagger'
import { map, random } from '~/helpers/utils'

function rotateAround(x: number, y: number, angle: number, p: p5) {
    p.translate(x, y)
    p.rotate(angle)
    p.translate(-x, -y)
}

function flipXOver(x: number, p: p5) {
    p.translate(x, 0)
    p.scale(-1, 1)
    p.translate(-x, 0)
}

function flipYOver(y: number, p: p5) {
    p.translate(0, y)
    p.scale(1, -1)
    p.translate(0, -y)
}

type TileOpts = {
    x: number
    y: number
    sz: number
    clr: string
    unit: number
    rotate?: number
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
    dur = 2000
    pr = 0
    stage: 'in' | 'out' | 'show' | 'hide' | 'delay' | 'flip' = 'delay'
    x: number
    y: number
    sz: number
    unit: number
    prevSizes?: TileSizes
    delay = 0
    delayTime = 0
    clr: string
    flipped = false
    rotate = 0
    flippedTimes = 0

    abstract tDraw(p: p5, pr: number, dir: 1 | -1): void

    constructor({ x, y, sz, clr, unit, rotate = 0, delay = 0 }: TileOpts) {
        this.x = x
        this.y = y
        this.sz = sz
        this.unit = unit
        this.clr = clr
        this.delay = delay
        this.rotate = rotate
    }

    get sizes(): TileSizes {
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
            this.pr = map(this.time, 0, this.dur, 0, 1)
            if (this.time >= this.dur) {
                this.show()
            }
            return
        }

        if (this.stage === 'out') {
            this.time += delta
            this.pr = map(this.time, 0, this.dur, 0, 1)
            if (this.time >= this.dur) {
                this.stage = 'hide'
                this.pr = 1
            }
            return
        }

        if (this.stage === 'flip') {
            this.time += delta
            this.pr = map(this.time, 0, this.dur, 0, 1)
            if (this.time >= this.dur) {
                this.stage = 'show'
                this.pr = 1
                this.flipped = !this.flipped
            }
        }
    }

    transform(p: p5, flip: boolean) {
        let { x, y, sz } = this.sizes
        if (flip) {
            if (this.rotate === 0 || this.rotate === 2) {
                flipYOver(y + (this.rotate === 0 ? -sz / 2 : sz / 2), p)
            } else {
                flipXOver(x + (this.rotate === 1 ? sz / 2 : -sz / 2), p)
            }
        }
        rotateAround(x, y, this.rotate * (p.PI / 2), p)
    }

    draw(p: p5) {
        if (this.stage === 'hide' || this.stage === 'delay') return

        p.stroke(this.clr).noFill().strokeWeight(2)

        p.push()
        this.transform(p, this.flipped)
        this.tDraw(
            p,
            this.stage === 'flip' || this.stage === 'out' ? 1 - this.pr : this.pr,
            this.stage === 'in' ? 1 : -1
        )
        p.pop()

        if (this.stage === 'flip') {
            p.push()
            this.transform(p, !this.flipped)
            this.tDraw(p, this.pr, 1)
            p.pop()
        }
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

    flip() {
        this.stage = 'flip'
        this.time = 0
        this.pr = 0
        this.flippedTimes++
    }
}

export class TileTri extends Tile {
    tDraw(p: p5, pr: number) {
        let { x, y, sz } = this.sizes
        let ht = sz * pr
        p.push()
        p.beginShape()
        p.vertex(x - sz / 2, y - sz / 2)
        p.vertex(x + sz / 2, y - sz / 2)
        p.vertex(x, y - sz / 2 + ht)
        p.endShape(p.CLOSE)
        p.pop()
    }
}

export class TileTris extends Tile {
    stagger: ReturnType<typeof getStagger>['vals']
    constructor(...args: ConstructorParameters<typeof Tile>) {
        super(...args)
        let steps = 2
        this.stagger = getStagger({ total: 1, steps, each: 0.75 })['vals']
    }

    drawTri(progress: number, p: p5) {
        let { sz } = this.sizes
        let y = (sz / this.stagger.length) * progress
        let x = (sz / 2) * progress
        p.beginShape()
        p.vertex(0, 0)
        p.vertex(-x, y)
        p.vertex(x, y)
        p.endShape(p.CLOSE)
    }
    tDraw(p: p5, pr: number) {
        let { x, y, sz } = this.sizes
        p.push()
        p.translate(x, y)

        let translateStep = sz / this.stagger.length

        pr = easing.inOutCubic(pr)

        p.translate(0, -sz / 2)
        this.stagger.forEach((s) => {
            let tripr = p.constrain(p.norm(pr, s.start, s.end), 0, 1)
            // tripr = easing.inOutQuart(tripr)
            if (tripr > 0) this.drawTri(tripr, p)
            p.translate(0, translateStep)
        })
        p.pop()
    }
}

export class TileTriSquare extends Tile {
    constructor(...args: ConstructorParameters<typeof Tile>) {
        super(...args)
    }

    tDraw(p: p5, pr: number) {
        p.stroke(this.clr).fill(`${this.clr}20`)
        let { sz, left, right, top, bottom } = this.sizes

        let prease = easing.inOutCubic(pr)
        let curSize = sz * p.constrain(p.norm(prease, 0, 0.45), 0, 1)

        let x = p.lerp(left, right, prease)
        let y = p.lerp(top, bottom, prease)
        p.beginShape()
        p.vertex(left, top + curSize)
        p.vertex(left, top)
        p.vertex(left + curSize, top)
        p.vertex(x, y)
        p.endShape(p.CLOSE)
    }
}

export class TileLines extends Tile {
    lineCount: number
    lineSpacing: number
    lineStagger: ReturnType<typeof getStagger>['vals']
    linesProgress = 0

    constructor(...args: ConstructorParameters<typeof Tile>) {
        super(...args)
        this.lineCount = random([9, 5])
        this.lineStagger = getStagger({
            total: 1,
            steps: this.lineCount,
            each: 0.5,
        }).vals

        this.lineSpacing = this.sz / (this.lineCount - 1)
    }

    updateLineVals() {
        this.lineSpacing = this.sz / (this.lineCount - 1)
        this.lineStagger = getStagger({ total: 1, steps: this.lineCount, each: 0.5 }).vals
    }

    tDraw(p: p5, pr: number) {
        let { sz, top, left } = this.sizes
        let space = sz / (this.lineCount - 1)
        let y1 = top

        this.lineStagger.forEach((line, i) => {
            if (pr < line.start) return
            let lp = p.constrain(p.norm(pr, line.start, line.end), 0, 1)
            lp = easing.inOutCubic(lp)

            let linex = left + space * i
            let y2 = y1 + sz * lp
            p.line(linex, y1, linex, y2)
        })
    }
}

export class TileArc extends Tile {
    arcSizeMin = 0.25
    stagger: ReturnType<typeof getStagger>['vals']
    constructor(...args: ConstructorParameters<typeof Tile>) {
        super(...args)

        this.stagger = getStagger({ total: 1, steps: 4, each: 0.5 })['vals']
    }

    tDraw(p: p5, pr: number) {
        let { top, left, x, y, sz } = this.sizes
        let sizeStep = (1 - this.arcSizeMin) / (this.stagger.length - 1)
        // pr = easing.inOutQuart(pr)

        this.stagger.forEach((s, i) => {
            if (pr <= s.start) return
            let r = sz - sz * sizeStep * i
            let pri = p.constrain(p.norm(pr, s.start, s.end), 0, 1)
            pri = easing.inOutQuart(pri)
            let angle = (Math.PI / 2) * pri

            if (angle < 0.00001) angle = 0 //https://github.com/processing/p5.js/blob/ca92fc457ff836e293916df06964e85f83182368/src/core/shape/2d_primitives.js#L43

            p.arc(left, top, r * 2, r * 2, 0, angle)
        })

        // this.stagger.forEach((s, i) => {
        //     if (pr < s.start) return
        //     let pri = p.constrain(p.norm(pr, s.start, s.end), 0, 1)
        //     pri = easing.outCubic(pri)
        //     let dia = sz * (this.arcSizeMin + sizeStep * (this.stagger.length - 1 - i)) * pri

        //     p.arc(top, left, dia * 2, dia * 2, 0, p.HALF_PI)
        // })
    }
}
