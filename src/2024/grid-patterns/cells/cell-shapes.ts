import { PCell, type PatternCellProps } from './cells-base'
import { random } from '~/helpers/utils'
import { type Direction, type Corner } from '../grid-stuff'

export class PatternCellTriangle extends PCell {
    style: 'triangle' = 'triangle'
    corner: Corner

    constructor({ corner, ...opts }: PatternCellProps & { corner?: Corner }) {
        super(opts)
        this.corner = corner || random(['tl', 'tr', 'bl', 'br'])
    }

    draw = (ctx: CanvasRenderingContext2D, unitSize: number, progress = this.timer.progress) => {
        let { x, y, w, h } = this.getSizes(unitSize)
        ctx.fillStyle = this.color
        ctx.beginPath()
        if (this.corner === 'bl') {
            ctx.moveTo(x, y + h)
            ctx.lineTo(x, y + h - h * progress)
            ctx.lineTo(x + w * progress, y + h)
        } else if (this.corner === 'br') {
            ctx.moveTo(x + w, y + h)
            ctx.lineTo(x + w - w * progress, y + h)
            ctx.lineTo(x + w, y + h - h * progress)
        } else if (this.corner === 'tr') {
            ctx.moveTo(x + w, y)
            ctx.lineTo(x + w - w * progress, y)
            ctx.lineTo(x + w, y + h * progress)
        } else if (this.corner === 'tl') {
            ctx.moveTo(x, y)
            ctx.lineTo(x, y + h * progress)
            ctx.lineTo(x + w * progress, y)
        }
        ctx.fill()
    }
}

export class PatternCellHalfCircle extends PCell {
    style: 'halfCircle' = 'halfCircle'
    dir: Direction

    constructor({ direction, ...opts }: PatternCellProps & { direction?: Direction }) {
        super(opts)

        this.dir = direction
            ? direction
            : opts.w > opts.h
            ? random(['up', 'down'])
            : random(['left', 'right'])
    }

    draw = (ctx: CanvasRenderingContext2D, unitSize: number, progress = this.timer.progress) => {
        let { x, y, w, h } = this.getSizes(unitSize)
        let radius = ((w > h ? w : h) / 2) * progress

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
    corner: Corner
    pattern: 'fill' | 'lines'
    lineWidthRatio: number = 0.05

    constructor({
        corner,
        pattern,
        ...opts
    }: PatternCellProps & { corner?: Corner; pattern?: 'fill' | 'lines' }) {
        super(opts)
        this.corner = corner || random(['tl', 'tr', 'bl', 'br'])
        this.pattern = pattern || random(['fill', 'lines'])
    }

    drawCurve(
        ctx: CanvasRenderingContext2D,
        unitSize: number,
        inset: number = 0,
        progress = this.timer.progress
    ) {
        let { x, y, w, h, m } = this.getSizes(unitSize)
        let radius = Math.max(m * progress - inset, 0)

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

        if (this.corner.endsWith('l')) xl = Math.min(x + w - progress * w + inset, x + w)
        if (this.corner.endsWith('r')) xr = Math.max(x + progress * w - inset, x)
        if (this.corner.startsWith('t')) yt = Math.min(y + h - progress * h + inset, y + h)
        if (this.corner.startsWith('b')) yb = Math.max(y + progress * h - inset, y)

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

    draw(ctx: CanvasRenderingContext2D, unitSize: number, progress = this.timer.progress) {
        let { m, x, y, w, h } = this.getSizes(unitSize)
        ctx.save()
        ctx.beginPath()
        ctx.rect(x, y, w, h)
        ctx.clip()

        if (this.pattern === 'fill') {
            this.drawCurve(ctx, unitSize, 0, progress)
        } else {
            let steps = 5
            let stepSize = m / (steps + 1)
            for (let i = 0; i < steps; i++) {
                this.drawCurve(ctx, unitSize, stepSize * i, progress)
            }
        }

        ctx.restore()
    }
}

export class PatternCellLeaf extends PCell {
    style: 'leaf' = 'leaf'
    corner: Corner
    constructor({ corner, ...opts }: PatternCellProps & { corner?: Corner }) {
        super(opts)
        this.corner = corner || random(['tl', 'tr', 'bl', 'br'])
    }

    draw(ctx: CanvasRenderingContext2D, unitSize: number, progress = this.timer.progress) {
        let { x, y, w, h, m } = this.getSizes(unitSize)
        let radius = m * 0.5
        let startX = this.corner === 'bl' || this.corner === 'tl' ? x + w : x
        let startY = this.corner === 'tr' || this.corner === 'tl' ? y + h : y
        let cx = x + m / 2
        let cy = y + m / 2
        let toCX = cx - startX
        let toCY = cy - startY
        let arcStart =
            this.corner === 'tl' ? 0.5 : this.corner === 'tr' ? 1 : this.corner === 'br' ? 1.5 : 0

        ctx.save()
        ctx.beginPath()
        ctx.rect(x, y, w, h)
        ctx.clip()

        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(
            startX + toCX * progress,
            startY + toCY * progress,
            radius * progress,
            Math.PI * arcStart,
            Math.PI * (arcStart + 1.5)
        )
        ctx.lineTo(startX, startY)
        ctx.fill()
        ctx.restore()
    }
}

export class PatternCellCircle extends PCell {
    style: 'circle' = 'circle'

    draw(ctx: CanvasRenderingContext2D, unitSize: number, progress = this.timer.progress) {
        let { x, y, w, h } = this.getSizes(unitSize)
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(x + w / 2, y + h / 2, (w / 2) * progress, 0, Math.PI * 2)
        ctx.fill()
    }
}
