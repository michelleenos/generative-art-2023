import { map, random } from '~/helpers/utils'
import easings, { type Easing } from '~/helpers/easings'

export interface PatternCellProps {
    nx: number
    ny: number
    w: number
    h: number
    color: string
    duration?: number
    easing?: Easing
}

export abstract class PCell {
    nx: number
    ny: number
    w: number
    h: number
    color: string
    progress: number = 0
    progressVal: number = 0
    stage: 'entering' | 'show' | 'leaving' | 'none' = 'none'
    lastTime: number | null = null
    delta = 0
    easing: Easing = 'outCubic'
    protected _duration: number = 1000

    constructor({ nx, ny, w, h, color, duration, easing }: PatternCellProps) {
        this.nx = nx
        this.ny = ny
        this.w = w
        this.h = h
        this.color = color
        if (duration) this._duration = duration
        if (easing) this.easing = easing
    }

    get animating() {
        return this.stage === 'entering' || this.stage === 'leaving'
    }

    get duration() {
        return this._duration
    }

    set duration(d: number) {
        this._duration = d
    }

    reset = () => {
        this.lastTime = null
        this.progress = 0
        this.progressVal = 0
    }

    tick = (time: number) => {
        if (this.progressVal >= 1) {
            this.stage = 'show'
            return
        }
        if (!this.lastTime) this.lastTime = time
        this.delta = time - this.lastTime
        this.lastTime = time
        this.progressVal = Math.min(1, this.progressVal + this.delta / this._duration)
        this.progress = easings[this.easing](this.progressVal)
    }

    getSizes = (size: number) => {
        return {
            x: this.nx * size,
            y: this.ny * size,
            w: this.w * size,
            h: this.h * size,
            m: Math.min(this.w, this.h) * size,
        }
    }

    enter = () => {
        this.stage = 'entering'
    }
}

export class PatternCellTriangle extends PCell {
    style: 'triangle' = 'triangle'
    corner: 'tl' | 'tr' | 'bl' | 'br'

    constructor({ corner, ...opts }: PatternCellProps & { corner?: 'tl' | 'tr' | 'bl' | 'br' }) {
        super(opts)
        this.corner = corner || random(['tl', 'tr', 'bl', 'br'])
    }

    draw(ctx: CanvasRenderingContext2D, unitSize: number) {
        let { x, y, w, h } = this.getSizes(unitSize)
        ctx.fillStyle = this.color
        ctx.beginPath()
        if (this.corner === 'bl') {
            ctx.moveTo(x, y + h)
            ctx.lineTo(x, y + h - h * this.progress)
            ctx.lineTo(x + w * this.progress, y + h)
        } else if (this.corner === 'br') {
            ctx.moveTo(x + w, y + h)
            ctx.lineTo(x + w - w * this.progress, y + h)
            ctx.lineTo(x + w, y + h - h * this.progress)
        } else if (this.corner === 'tr') {
            ctx.moveTo(x + w, y)
            ctx.lineTo(x + w - w * this.progress, y)
            ctx.lineTo(x + w, y + h * this.progress)
        } else if (this.corner === 'tl') {
            ctx.moveTo(x, y)
            ctx.lineTo(x, y + h * this.progress)
            ctx.lineTo(x + w * this.progress, y)
        }
        ctx.fill()
    }
}

export class PatternCellHalfCircle extends PCell {
    style: 'halfCircle' = 'halfCircle'
    dir: 'up' | 'down' | 'left' | 'right'

    constructor(opts: PatternCellProps) {
        super(opts)
        this.dir = opts.w > opts.h ? random(['up', 'down']) : random(['left', 'right'])
    }

    draw(ctx: CanvasRenderingContext2D, unitSize: number) {
        let { x, y, w, h } = this.getSizes(unitSize)
        let radius = ((w > h ? w : h) / 2) * this.progress

        ctx.fillStyle = this.color
        ctx.beginPath()
        if (this.dir === 'up') {
            ctx.arc(x + w / 2, y + h, radius, Math.PI, 0)
        } else if (this.dir === 'down') {
            ctx.arc(x + w / 2, y, radius, 0, Math.PI)
        } else if (this.dir === 'left') {
            ctx.arc(x + w, y + h / 2, radius, Math.PI * 0.5, Math.PI * 1.5)
        } else if (this.dir === 'right') {
            ctx.arc(x, y + h / 2, radius, Math.PI * 1.5, Math.PI * 0.5)
        }

        ctx.fill()
    }
}

export class PatternCellQuarterCircle extends PCell {
    style: 'quarterCircle' = 'quarterCircle'
    corner: 'tl' | 'tr' | 'bl' | 'br'
    pattern: 'fill' | 'lines'
    lineWidthRatio: number = 0.05

    constructor({
        corner,
        pattern,
        ...opts
    }: PatternCellProps & { corner?: 'tl' | 'tr' | 'bl' | 'br'; pattern?: 'fill' | 'lines' }) {
        super(opts)
        this.corner = corner || random(['tl', 'tr', 'bl', 'br'])
        this.pattern = pattern || random(['fill', 'lines'])
    }

    drawCurve(ctx: CanvasRenderingContext2D, unitSize: number, inset: number = 0) {
        let { x, y, w, h, m } = this.getSizes(unitSize)
        let radius = Math.max(m * this.progress - inset, 0)

        if (this.pattern === 'lines') {
            ctx.strokeStyle = this.color
            let lw = m * this.lineWidthRatio
            ctx.lineWidth = lw
            inset += lw / 2
        } else {
            ctx.fillStyle = this.color
        }

        ctx.beginPath()

        let xl = x
        let xr = x + w
        let yt = y
        let yb = y + h

        if (this.corner.endsWith('l')) xl = Math.min(x + w - this.progress * w + inset, x + w)
        if (this.corner.endsWith('r')) xr = Math.max(x + this.progress * w - inset, x)
        if (this.corner.startsWith('t')) yt = Math.min(y + h - this.progress * h + inset, y + h)
        if (this.corner.startsWith('b')) yb = Math.max(y + this.progress * h - inset, y)

        let points = [
            [xl, yb],
            [xl, yt],
            [xr, yt],
            [xr, yb],
        ]
        let start =
            this.corner === 'tl' ? 0 : this.corner === 'tr' ? 1 : this.corner === 'br' ? 2 : 3

        let p1 = points[start]
        let p2 = points[(start + 1) % 4]
        let p3 = points[(start + 2) % 4]
        let p4 = points[(start + 3) % 4]

        ctx.moveTo(p1[0], p1[1])
        ctx.arcTo(p2[0], p2[1], p3[0], p3[1], radius)
        ctx.lineTo(p3[0], p3[1])

        if (this.pattern === 'fill') {
            ctx.lineTo(p4[0], p4[1])
            ctx.closePath()
            ctx.fill()
        } else {
            ctx.stroke()
        }
    }

    draw(ctx: CanvasRenderingContext2D, unitSize: number) {
        let { m, x, y, w, h } = this.getSizes(unitSize)
        ctx.save()
        ctx.beginPath()
        ctx.rect(x, y, w, h)
        ctx.clip()

        if (this.pattern === 'fill') {
            this.drawCurve(ctx, unitSize)
        } else {
            let steps = 5
            let stepSize = m / (steps + 1)
            for (let i = 0; i < steps; i++) {
                this.drawCurve(ctx, unitSize, stepSize * i)
            }
        }

        ctx.restore()
    }
}

export class PatternCellLeaf extends PCell {
    style: 'leaf' = 'leaf'
    corner: 'tl' | 'tr' | 'bl' | 'br'
    constructor({ corner, ...opts }: PatternCellProps & { corner?: 'tl' | 'tr' | 'bl' | 'br' }) {
        super(opts)
        this.corner = corner || random(['tl', 'tr', 'bl', 'br'])
        this.corner = 'br'
    }

    draw(ctx: CanvasRenderingContext2D, unitSize: number) {
        let { x, y, w, h, m } = this.getSizes(unitSize)
        let radius = m * 0.5
        let startX = this.corner === 'tr' || this.corner === 'br' ? x + w : x
        let startY = this.corner === 'bl' || this.corner === 'br' ? y + h : y
        let cx = x + m / 2
        let cy = y + m / 2
        let toCX = cx - startX
        let toCY = cy - startY
        let arcStart =
            this.corner === 'br' ? 0.5 : this.corner === 'bl' ? 1 : this.corner === 'tl' ? 1.5 : 0

        ctx.save()
        ctx.beginPath()
        ctx.rect(x, y, w, h)
        ctx.clip()

        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(
            startX + toCX * this.progress,
            startY + toCY * this.progress,
            radius * this.progress,
            Math.PI * arcStart,
            Math.PI * (arcStart + 1.5)
        )
        ctx.lineTo(startX, startY)
        ctx.fill()
        ctx.restore()
    }
}

export class PatternCellLines extends PCell {
    style: 'lines' = 'lines'
    dir: 'h' | 'v' | 'd1' | 'd2'
    steps: number
    lineDur: number
    stagger: number

    constructor(opts: PatternCellProps) {
        super(opts)
        this.dir = random(['h', 'v', 'd1', 'd2'])
        this.steps = this.dir.startsWith('d') ? 10 : 5

        this.lineDur = 0.4
        this.stagger = 0.6 / (this.steps - 1)
    }

    draw(ctx: CanvasRenderingContext2D, unitSize: number) {
        if (this.progress === 0) return
        let { x, y, w, h } = this.getSizes(unitSize)
        ctx.save()
        ctx.beginPath()
        ctx.rect(x, y, w, h)
        ctx.clip()

        ctx.lineCap = 'square'
        ctx.lineWidth = w / 20
        ctx.strokeStyle = this.color
        ctx.beginPath()

        for (let i = 0; i < this.steps; i++) {
            let lineStart = this.stagger * i
            if (this.progress < lineStart) continue

            let lineProgress = Math.min(1, (this.progress - lineStart) / this.lineDur)
            let step = w * ((i + 0.5) / (this.steps / 2))
            let x1: number, y1: number, xc: number, yc: number
            if (this.dir === 'd1') {
                ;[x1, y1, xc, yc] = [x, y + step, step, -step]
            } else if (this.dir === 'd2') {
                ;[x1, y1, xc, yc] = [x + step, y, -step, step]
            } else if (this.dir === 'h') {
                ;[x1, y1, xc, yc] = [x, y + step / 2, w, 0]
            } else {
                ;[x1, y1, xc, yc] = [x + step / 2, y, 0, h]
            }

            ctx.moveTo(x1, y1)
            ctx.lineTo(x1 + xc * lineProgress, y1 + yc * lineProgress)
        }
        ctx.stroke()
        ctx.restore()
    }
}

export class PatternCellCircle extends PCell {
    style: 'circle' = 'circle'

    draw(ctx: CanvasRenderingContext2D, unitSize: number) {
        let { x, y, w, h } = this.getSizes(unitSize)
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(x + w / 2, y + h / 2, (w / 2) * this.progress, 0, Math.PI * 2)
        ctx.fill()
    }
}

class PatternCellQuarterCircle2 extends PCell {
    corner: 'tl' | 'tr' | 'bl' | 'br'
    arcStart: number
    arcChange: number
    counterclockwise: boolean

    constructor({
        corner,
        duration = 4000,
        ...opts
    }: PatternCellProps & { corner?: 'tl' | 'tr' | 'bl' | 'br' }) {
        super({ ...opts, duration })
        this.corner = corner || random(['tl', 'tr', 'bl', 'br'])

        this.arcStart = this.w > this.h ? Math.PI * -0.5 : Math.PI
        this.arcChange = Math.PI * 0.5 * (this.w > this.h ? -1 : 1)
        this.counterclockwise = this.w > this.h
    }

    translate(ctx: CanvasRenderingContext2D, sizes: ReturnType<PCell['getSizes']>) {
        let { x, y, w, h } = sizes
        ctx.translate(x, y)
        if (this.corner === 'tr') {
            ctx.scale(-1, 1)
            ctx.translate(-w, 0)
        } else if (this.corner === 'bl') {
            ctx.scale(1, -1)
            ctx.translate(0, -h)
        } else if (this.corner === 'br') {
            ctx.scale(-1, -1)
            ctx.translate(-w, -h)
        }
    }
}

export class PatternCellQuarterCircleFill extends PatternCellQuarterCircle2 {
    #innerRatio: number = 1 / 5 - 0.05
    style: 'quarterCircleFill' = 'quarterCircleFill'

    constructor({ corner, ...opts }: PatternCellProps & { corner?: 'tl' | 'tr' | 'bl' | 'br' }) {
        super({ ...opts, corner })
    }

    draw(ctx: CanvasRenderingContext2D, unitSize: number) {
        let sizes = this.getSizes(unitSize)
        let { w, h, m } = sizes
        let innerRadius = m * this.#innerRatio

        ctx.save()
        this.translate(ctx, sizes)

        ctx.fillStyle = this.color
        ctx.beginPath()
        if (h === w) {
            ctx.arc(m, m, m, this.arcStart, this.arcStart + this.arcChange * this.progress)
            ctx.arc(
                m,
                m,
                innerRadius,
                this.arcStart + this.arcChange * this.progress,
                this.arcStart,
                true
            )
        } else {
            let progressLine = this.progress >= 0.5 ? 1 : this.progress * 2
            let progressArc = this.progress < 0.5 ? 0 : (this.progress - 0.5) * 2
            if (w > h) {
                ctx.moveTo(w - m * progressLine, h - innerRadius)
                ctx.lineTo(w, h - innerRadius)
                ctx.lineTo(w, 0)
                ctx.lineTo(w - m * progressLine, 0)
                if (progressArc > 0) {
                    ctx.arc(
                        m,
                        m,
                        m,
                        this.arcStart,
                        this.arcStart + this.arcChange * progressArc,
                        this.counterclockwise
                    )
                    ctx.arc(
                        m,
                        m,
                        innerRadius,
                        this.arcStart + this.arcChange * progressArc,
                        this.arcStart,
                        !this.counterclockwise
                    )
                }
            } else {
                ctx.moveTo(w - innerRadius, h - m * progressLine)
                ctx.lineTo(w - innerRadius, h)
                ctx.lineTo(0, h)
                ctx.lineTo(0, h - m * progressLine)
                if (progressArc > 0) {
                    ctx.arc(
                        m,
                        m,
                        m,
                        this.arcStart,
                        this.arcStart + this.arcChange * progressArc,
                        this.counterclockwise
                    )
                    ctx.arc(
                        m,
                        m,
                        innerRadius,
                        this.arcStart + this.arcChange * progressArc,
                        this.arcStart,
                        !this.counterclockwise
                    )
                }
            }
        }

        ctx.fill()
        ctx.restore()
    }
}

export class PatternCellQuarterCircleLines extends PatternCellQuarterCircle2 {
    style: 'quarterCircleLines' = 'quarterCircleLines'
    lineWidthRatio: number = 0.05
    #steps: number = 5
    #lineEach!: number
    #stagger!: number
    #lineEachFraction!: number
    #staggerPct!: number

    constructor({ corner, ...opts }: PatternCellProps & { corner?: 'tl' | 'tr' | 'bl' | 'br' }) {
        super({ ...opts, corner })

        this.lineEach = this._duration * 0.4

        this.setLineVals()
    }

    get lineEach() {
        return this.#lineEach
    }

    set lineEach(each: number) {
        this.#lineEach = each > this._duration ? this._duration : each
        this.setLineVals()
    }

    set duration(d: number) {
        this._duration = d
        if (this.#lineEach > d) this.lineEach = d
        this.setLineVals()
    }

    get duration() {
        return this._duration
    }

    get steps() {
        return this.#steps
    }

    set steps(newSteps: number) {
        this.#steps = newSteps
        this.setLineVals()
    }

    setLineVals = () => {
        this.#lineEachFraction = this.#lineEach / this._duration

        this.#stagger = (this._duration - this.#lineEach) / (this.#steps - 1)
        this.#staggerPct = this.#stagger / this._duration
    }

    draw(ctx: CanvasRenderingContext2D, unitSize: number) {
        let sizes = this.getSizes(unitSize)
        let { w, h, m } = sizes

        let lw = m * this.lineWidthRatio

        ctx.strokeStyle = this.color
        ctx.lineWidth = lw

        let stepSize = m / this.#steps

        ctx.save()
        this.translate(ctx, sizes)
        for (let i = 0; i < this.#steps; i++) {
            let stepStart = this.#staggerPct * i
            if (this.progressVal < stepStart) break

            let radius = m - stepSize * i - lw / 2
            let stepProgress = easings[this.easing](
                Math.min(1, (this.progressVal - stepStart) / this.#lineEachFraction)
            )
            let [lx, ly] = w > h ? [w, m - radius] : [m - radius, h]

            ctx.beginPath()
            if (h === w) {
                ctx.arc(m, m, radius, this.arcStart, this.arcStart + stepProgress * this.arcChange)
            } else {
                let progressLine = stepProgress >= 0.5 ? 1 : stepProgress * 2
                let progressArc = stepProgress < 0.5 ? 0 : (stepProgress - 0.5) * 2
                ctx.moveTo(lx, ly)
                if (w > h) {
                    ctx.lineTo(lx - m * progressLine, ly)
                } else {
                    ctx.lineTo(lx, ly - m * progressLine)
                }
                if (progressArc > 0) {
                    ctx.arc(
                        m,
                        m,
                        radius,
                        this.arcStart,
                        this.arcStart + this.arcChange * progressArc,
                        this.counterclockwise
                    )
                }
            }

            ctx.stroke()
        }

        ctx.restore()
    }
}

export type PatternCell =
    | PatternCellTriangle
    | PatternCellHalfCircle
    | PatternCellQuarterCircle
    | PatternCellLines
    | PatternCellCircle
    | PatternCellLeaf
    | PatternCellQuarterCircleFill
    | PatternCellQuarterCircleLines
