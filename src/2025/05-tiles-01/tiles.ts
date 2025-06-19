import p5 from 'p5'
import { easing } from '~/helpers/easings'
import { getStagger } from '~/helpers/stagger'
import { map, shuffle } from '~/helpers/utils'

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
    stagger: ReturnType<typeof getStagger>['vals']

    rotateProgress = 0
    shrinkProgress = 0
    curSize = 0
    alpha = 255

    constructor(...args: ConstructorParameters<typeof Tile>) {
        super(...args)
        this.stagger = getStagger({ total: 1, steps: this.rectCount, each: 0.7 }).vals
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
