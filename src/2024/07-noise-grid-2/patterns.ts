import { equilateralTriangle } from '~/helpers/shapes'
import { Rectangle } from '~/helpers/trig-shapes'
import { clamp, map } from '~/helpers/utils'

const mapProgress = (progress: number, progressMin = 0, progressMax = 1) => {
    return clamp(map(progress, progressMin, progressMax, 0, 1), 0, 1)
}

export type PatternOptions = {
    bounds: Rectangle
    c1: string
    c2: string
    progress?: number
}

export type PatternFn = (ctx: CanvasRenderingContext2D, options: PatternOptions) => void

export const circleSquares: PatternFn = (ctx, { bounds, c1, c2, progress = 1 }) => {
    let { x, y, width, height } = bounds
    let m = Math.max(Math.min(width, height) - 8, 0)
    ctx.save()
    ctx.translate(x + (width - m) / 2, y + (height - m) / 2)

    let cx1 = m * 0.25
    let cx2 = m * 0.75
    let cy1 = m * 0.25
    let cy2 = m * 0.75

    let r = Math.max(m * 0.25 - 1, 0)

    let p1 = progress
    let p2 = mapProgress(progress, 0.3, 1)

    ctx.fillStyle = c1
    ctx.beginPath()
    ctx.rect(cx1 - p1 * r, cy1 - p1 * r, p1 * r * 2, p1 * r * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.rect(cx2 - p1 * r, cy2 - p1 * r, p1 * r * 2, p1 * r * 2)
    ctx.fill()

    ctx.fillStyle = c2
    let diff = m * 0.25

    ctx.beginPath()
    ctx.arc(cx1 + diff * (1 - p2), cy2 - diff * (1 - p2), p1 * r, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.arc(cx2 - diff * (1 - p2), cy1 + diff * (1 - p2), p1 * r, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
}

export const circleOutlines: PatternFn = (ctx, { bounds, c1, c2, progress = 1 }) => {
    let { x, y, width, height } = bounds
    let m = Math.min(width, height)
    let radius = Math.max((m - 8) * 0.5, 0)
    let radius1 = Math.max(radius * progress, 0)
    let radius2 = Math.max((radius / 3) * 2 * progress, 0)
    let radius3 = Math.max((radius / 3) * 1 * progress, 0)

    ctx.save()
    ctx.fillStyle = c1
    ctx.beginPath()
    ctx.arc(x + m / 2, y + m / 2, radius1, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = c2
    ctx.beginPath()
    ctx.arc(x + m / 2, y + m / 2, radius2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = c1

    ctx.beginPath()
    ctx.arc(x + m / 2, y + m / 2, radius3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
}

export const circle: PatternFn = (ctx, { bounds, c1, progress = 1 }) => {
    let { x, y, width, height } = bounds
    let m = Math.min(width, height)
    let radius = Math.max((m - 8) * 0.5 * progress, 0)
    ctx.save()
    ctx.translate(x + (width - m) / 2, y + (height - m) / 2)

    ctx.fillStyle = c1
    ctx.beginPath()
    ctx.arc(m / 2, m / 2, radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
}
export const eqTriangle: PatternFn = (ctx, { bounds, c1, progress = 1 }) => {
    let { x, y, width, height } = bounds
    let m = Math.min(width, height)
    m -= Math.max(m * 0.1, 10)
    ctx.save()
    ctx.translate(x, y)
    equilateralTriangle(ctx, { x: (width - m) / 2, y: (height - m) / 2, w: m, h: m, progress })

    ctx.fillStyle = c1

    ctx.strokeStyle = c1
    ctx.lineWidth = Math.min(5, (m * progress) / 2)
    ctx.stroke()

    if (m < 30) {
        ctx.fill()
    }

    ctx.restore()
}

export const boxesHorizontal: PatternFn = (ctx, { bounds, c1, c2, progress = 1 }) => {
    let { x, y, width, height } = bounds

    let pad = 4
    let w = Math.max(width - pad * 2, 0)
    let midY = 4
    let rectH = Math.max(height * 0.5 - pad - midY / 2, 4)
    rectH *= progress
    let left = x + (width - w) / 2
    let br = Math.min(w / 4, rectH / 4)

    ctx.save()

    ctx.fillStyle = c1
    ctx.beginPath()
    ctx.roundRect(left, y + height / 2 - midY / 2 - rectH, w, rectH, [br, br, 0, 0])
    ctx.fill()

    ctx.fillStyle = c2
    ctx.beginPath()
    ctx.roundRect(left, y + height / 2 + midY / 2, w, rectH, [0, 0, br, br])
    ctx.fill()
    ctx.restore()
}

export const boxesVertical: PatternFn = (ctx, { bounds, c1, c2, progress = 1 }) => {
    let { x, y, width, height } = bounds

    let pad = 4
    let h = Math.max(height - pad * 2, 0)
    let midX = 4
    let rectW = Math.max(width * 0.5 - pad - midX / 2, 4)
    rectW *= progress
    let top = y + (height - h) / 2

    let br = Math.min(rectW / 4, h / 4)

    ctx.save()
    ctx.fillStyle = c1
    ctx.beginPath()
    ctx.roundRect(x + width / 2 - midX / 2 - rectW, top, rectW, h, [br, 0, 0, br])
    ctx.fill()

    ctx.fillStyle = c2
    ctx.beginPath()
    ctx.roundRect(x + width / 2 + midX / 2, top, rectW, h, [0, br, br, 0])
    ctx.fill()

    ctx.restore()
}

export const patterns = {
    circleSquares,
    circleOutlines,
    circle,
    eqTriangle,
    boxesHorizontal,
    boxesVertical,
}
