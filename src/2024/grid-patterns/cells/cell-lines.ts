import { PCell, type PatternCellProps } from './cells-base'
import { random } from '~/helpers/utils'

export class PatternCellLines extends PCell {
    style: 'lines' = 'lines'
    dir: 'h' | 'v' | 'd1' | 'd2'
    #steps: number
    #lineEach!: number
    #lineEachFraction!: number
    #stagger!: number
    #staggerPct!: number
    padding: number
    lineWidth: number = 0.05

    constructor(
        opts: PatternCellProps & {
            steps?: number
            diagSteps?: number
            each?: number
            lineWidth?: number
            dirOptions?: ('h' | 'v' | 'd1' | 'd2')[]
        }
    ) {
        super(opts)
        this.dir = random(opts.dirOptions ? opts.dirOptions : ['h', 'v', 'd1', 'd2'])
        this.#steps = this.dir.startsWith('d')
            ? opts.diagSteps || opts.steps || 10
            : opts.steps || 5
        this.lineEach = opts.each ? opts.each : this.timer.duration * 0.4
        if (opts.lineWidth) this.lineWidth = opts.lineWidth
        this.padding = this.lineWidth / 2
    }

    get lineEach() {
        return this.#lineEach
    }

    set lineEach(each: number) {
        this.#lineEach = each > this.timer.duration ? this.timer.duration : each
        this.setLineVals()
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
        if (progress === 0) return
        let { x, y, w, h } = this.getSizes(unitSize)
        ctx.save()
        ctx.beginPath()
        ctx.rect(x, y, w, h)
        ctx.clip()

        ctx.lineCap = 'square'
        let lw = w * this.lineWidth
        let pad = this.padding * w
        ctx.lineWidth = lw
        ctx.strokeStyle = this.color
        ctx.beginPath()

        let step = (w / this.#steps) * 2
        if (this.dir === 'h' || this.dir === 'v') {
            step = (w - pad * 2) / (this.#steps - 1)
        }

        for (let i = 0; i < this.#steps; i++) {
            let lineStart = this.#staggerPct * i
            if (progress < lineStart) continue

            let lineProgress = Math.min(1, (progress - lineStart) / this.#lineEachFraction)

            let x1: number, y1: number, xc: number, yc: number
            if (this.dir === 'd1') {
                ;[x1, y1, xc, yc] = [x, y + step * (i + 0.5), step * (i + 0.5), -step * (i + 0.5)]
            } else if (this.dir === 'd2') {
                ;[x1, y1, xc, yc] = [
                    x,
                    y + h - step * (i + 0.5),
                    step * (i + 0.5),
                    step * (i + 0.5),
                ]
            } else if (this.dir === 'h') {
                ;[x1, y1, xc, yc] = [x, y + step * i + pad, w, 0]
            } else {
                ;[x1, y1, xc, yc] = [x + step * i + pad, y, 0, h]
            }

            ctx.moveTo(x1, y1)
            ctx.lineTo(x1 + xc * lineProgress, y1 + yc * lineProgress)
        }
        ctx.stroke()

        ctx.restore()
    }
}
