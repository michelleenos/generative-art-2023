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

const arrow = (ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number) => {
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(10, 10)
    ctx.moveTo(0, 0)
    ctx.lineTo(-10, 10)
    ctx.stroke()
    ctx.restore()
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

    get duration() {
        return this._duration
    }

    set duration(d: number) {
        this._duration = d
    }

    get animating() {
        return this.stage === 'entering' || this.stage === 'leaving'
    }

    reset = () => {
        this.lastTime = null
        this.progress = 0
        this.progressVal = 0
    }

    tick = (time: number) => {
        if (this.progressVal > 1) return
        if (!this.lastTime) this.lastTime = time
        this.delta = time - this.lastTime
        this.lastTime = time
        this.progressVal = Math.min(1, this.progressVal + this.delta / this._duration)
        this.progress = easings[this.easing](this.progressVal)
        if (this.progressVal === 1) this.stage = 'show'
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

export class PatternCellQuarterCircle extends PCell {
    style: 'quarterCircle' = 'quarterCircle'
    corner: 'tl' | 'tr' | 'bl' | 'br'
    arcStart: number
    arcChange: number
    counterclockwise: boolean

    constructor({ corner, ...opts }: PatternCellProps & { corner?: 'tl' | 'tr' | 'bl' | 'br' }) {
        super(opts)
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

    draw(ctx: CanvasRenderingContext2D, unitSize: number) {
        let sizes = this.getSizes(unitSize)
        let { w, h, m } = sizes

        ctx.save()
        this.translate(ctx, sizes)

        ctx.fillStyle = this.color
        ctx.beginPath()
        if (h === w) {
            ctx.arc(m, m, m, this.arcStart, this.arcStart + this.arcChange * this.progress)
            ctx.lineTo(m, m)
        } else {
            let progressLine = this.progress >= 0.5 ? 1 : this.progress * 2
            let progressArc = this.progress < 0.5 ? 0 : (this.progress - 0.5) * 2
            if (w > h) {
                ctx.moveTo(w - m * progressLine, h)
                ctx.lineTo(w, h)
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
                }
            } else {
                ctx.moveTo(w, h - m * progressLine)
                ctx.lineTo(w, h)
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
                }
            }
        }

        ctx.fill()
        ctx.restore()
    }
}

export class PatternCellQuarterCircleLines extends PatternCellQuarterCircle {
    lineWidthRatio: number = 0.05
    #steps: number = 5
    #lineEach!: number
    #stagger!: number
    #lineEachFraction!: number
    #staggerPct!: number

    constructor({ corner, ...opts }: PatternCellProps & { corner?: 'tl' | 'tr' | 'bl' | 'br' }) {
        super({ ...opts, corner })

        this.arcStart = this.w > this.h ? Math.PI * -0.5 : Math.PI
        this.arcChange = Math.PI * 0.5 * (this.w > this.h ? -1 : 1)
        this.counterclockwise = this.w > this.h

        this.getLineVals()
    }

    get lineEach() {
        return this.#lineEach
    }

    set lineEach(each: number) {
        this.#lineEach = each > this._duration ? this._duration : each
        this.#lineEachFraction = this.#lineEach / this._duration
        this.getLineVals()
    }

    set duration(d: number) {
        this._duration = d
        this.getLineVals()
    }

    get duration() {
        return this._duration
    }

    get steps() {
        return this.#steps
    }

    set steps(newSteps: number) {
        this.#steps = newSteps
        this.getLineVals()
    }

    getLineVals = () => {
        let lineDur = Math.min(this.#lineEach, this._duration)

        this.#stagger = (this._duration - lineDur) / (this.#steps - 1)
        this.#staggerPct = this.#stagger / this._duration
    }

    draw(ctx: CanvasRenderingContext2D, unitSize: number) {
        let sizes = this.getSizes(unitSize)
        let { w, h, m } = sizes

        ctx.strokeStyle = this.color
        ctx.lineWidth = m * this.lineWidthRatio

        let stepSize = m / (this.#steps + 1)

        ctx.save()
        this.translate(ctx, sizes)
        for (let i = 0; i < this.#steps; i++) {
            let stepStart = this.#staggerPct * i
            if (this.progress < stepStart) break

            let radius = m - stepSize * i
            let stepProgress = Math.min(1, (this.progress - stepStart) / this.#lineEachFraction)
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
