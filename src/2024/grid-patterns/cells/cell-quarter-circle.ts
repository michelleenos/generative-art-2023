import { PCell, PatternCellProps } from './cells-base'
import { random } from '~/helpers/utils'
import easings from '~/helpers/easings'

type PatternCellQuarterCircleProps = PatternCellProps & {
    corner?: 'tl' | 'tr' | 'bl' | 'br'
    innerRatio?: number
    outerRatio?: number
}

export abstract class PatternCellQuarterCircle2 extends PCell {
    corner: 'tl' | 'tr' | 'bl' | 'br'
    arcStart: number
    arcChange: number
    counterclockwise: boolean
    protected _innerRatio: number
    protected _outerRatio: number

    constructor({
        corner,
        duration = 4000,
        innerRatio = 0.1,
        outerRatio = 0.9,
        ...opts
    }: PatternCellQuarterCircleProps) {
        super({ ...opts, duration })
        this.corner = corner || random(['tl', 'tr', 'bl', 'br'])

        this._innerRatio = innerRatio
        this._outerRatio = outerRatio
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
    style: 'quarterCircleFill' = 'quarterCircleFill'

    constructor({ corner, ...opts }: PatternCellQuarterCircleProps) {
        super({ ...opts, corner })
    }

    draw(ctx: CanvasRenderingContext2D, unitSize: number, progress = this.timer.progress) {
        let sizes = this.getSizes(unitSize)
        let { w, h, m } = sizes
        let innerRadius = m * this._innerRatio
        let outerRadius = m * this._outerRatio

        ctx.save()
        this.translate(ctx, sizes)

        ctx.fillStyle = this.color
        ctx.beginPath()
        if (h === w) {
            ctx.arc(m, m, outerRadius, this.arcStart, this.arcStart + this.arcChange * progress)
            ctx.arc(
                m,
                m,
                innerRadius,
                this.arcStart + this.arcChange * progress,
                this.arcStart,
                true
            )
        } else {
            let progressLine = progress >= 0.5 ? 1 : progress * 2
            let progressArc = progress < 0.5 ? 0 : (progress - 0.5) * 2
            if (w > h) {
                ctx.moveTo(w - m * progressLine, h - innerRadius)
                ctx.lineTo(w, h - innerRadius)
                ctx.lineTo(w, h - outerRadius)
                ctx.lineTo(w - m * progressLine, h - outerRadius)
                if (progressArc > 0) {
                    ctx.arc(
                        m,
                        m,
                        outerRadius,
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
                ctx.lineTo(w - outerRadius, h)
                ctx.lineTo(w - outerRadius, h - m * progressLine)
                if (progressArc > 0) {
                    ctx.arc(
                        m,
                        m,
                        outerRadius,
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
    lineWidth: number = 0.05
    #steps: number = 5
    #lineEach!: number
    #stagger!: number
    #lineEachFraction!: number
    #staggerPct!: number

    constructor({
        corner,
        ...opts
    }: PatternCellQuarterCircleProps & { steps?: number; each?: number; lineWidth?: number }) {
        super({ ...opts, corner })
        if (opts.steps) this.#steps = opts.steps
        this.lineWidth = opts.lineWidth ?? this.lineWidth

        this.lineEach = opts.each ?? this.timer.duration * 0.4

        this.setLineVals()
    }

    get lineEach() {
        return this.#lineEach
    }

    set lineEach(each: number) {
        this.#lineEach = each > this.timer.duration ? this.timer.duration : each
        this.setLineVals()
    }

    set duration(d: number) {
        this.timer.duration = d
        if (this.#lineEach > d) this.lineEach = d
        this.setLineVals()
    }

    get duration() {
        return this.timer.duration
    }

    get steps() {
        return this.#steps
    }

    set steps(newSteps: number) {
        this.#steps = newSteps
        this.setLineVals()
    }

    setLineVals = () => {
        this.#lineEachFraction = this.#lineEach / this.timer.duration

        this.#stagger = (this.timer.duration - this.#lineEach) / (this.#steps - 1)
        this.#staggerPct = this.#stagger / this.timer.duration
    }

    draw(ctx: CanvasRenderingContext2D, unitSize: number, progress = this.timer.progress) {
        let sizes = this.getSizes(unitSize)
        let { w, h, m } = sizes

        let lw = m * this.lineWidth

        ctx.strokeStyle = this.color
        ctx.lineWidth = lw

        // let stepSize = m / this.#steps
        let innerRadius = m * this._innerRatio + lw / 2
        let outerRadius = m * this._outerRatio - lw / 2
        let stepSize = (outerRadius - innerRadius) / (this.#steps - 1)

        ctx.save()
        this.translate(ctx, sizes)
        for (let i = 0; i < this.#steps; i++) {
            let stepStart = this.#staggerPct * i
            if (progress < stepStart) break

            // let radius = m - stepSize * i + m * this._innerRatio
            let radius = innerRadius + stepSize * i
            // let radius = map(i, 0, this.#steps - 1, m * this._innerRatio, m * this._outerRatio)
            let stepProgress = easings[this.timer.easing](
                Math.min(1, (progress - stepStart) / this.#lineEachFraction)
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
