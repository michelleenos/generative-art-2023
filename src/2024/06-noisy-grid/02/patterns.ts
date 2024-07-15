import { equilateralTriangle } from '~/helpers/shapes'
import { Rectangle } from '~/helpers/trig-shapes'
import { clamp, map } from '~/helpers/utils'

const mapProgress = (progress: number, progressMin = 0, progressMax = 1) => {
    return clamp(map(progress, progressMin, progressMax, 0, 1), 0, 1)
}

type PatternOptions = {
    bounds: Rectangle
    c1: string
    c2: string
    progress?: number
}
export const patterns: ((ctx: CanvasRenderingContext2D, options: PatternOptions) => void)[] = [
    // (ctx, { bounds, c1, c2, progress = 1 }) => {
    //     let { x, y, width, height } = bounds
    //     let m = Math.max(Math.min(width, height) - 8, 0)
    //     ctx.save()
    //     ctx.translate(x + (width - m) / 2, y + (height - m) / 2)

    //     let cx1 = m * 0.25
    //     let cx2 = m * 0.75
    //     let cy1 = m * 0.25
    //     let cy2 = m * 0.75

    //     let r = Math.max(m * 0.25 - 1, 0)

    //     let p1 = progress
    //     let p2 = mapProgress(progress, 0.3, 1)

    //     ctx.fillStyle = c1
    //     ctx.beginPath()
    //     ctx.rect(cx1 - p1 * r, cy1 - p1 * r, p1 * r * 2, p1 * r * 2)
    //     ctx.fill()

    //     ctx.beginPath()
    //     ctx.rect(cx2 - p1 * r, cy2 - p1 * r, p1 * r * 2, p1 * r * 2)
    //     ctx.fill()

    //     ctx.fillStyle = c2
    //     let diff = m * 0.25

    //     ctx.beginPath()
    //     ctx.arc(cx1 + diff * (1 - p2), cy2 - diff * (1 - p2), p1 * r, 0, Math.PI * 2)
    //     ctx.fill()

    //     ctx.beginPath()
    //     ctx.arc(cx2 - diff * (1 - p2), cy1 + diff * (1 - p2), p1 * r, 0, Math.PI * 2)
    //     ctx.fill()

    //     ctx.restore()
    // },
    (ctx, { bounds, c1, c2, progress = 1 }) => {
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
    },
    (ctx, { bounds, c1, c2, progress = 1 }) => {
        let { x, y, width, height } = bounds
        let m = Math.min(width, height)
        m -= Math.max(m * 0.1, 10)
        ctx.save()
        ctx.translate(x, y)
        // polygon(ctx, { cx: 0, cy: 0, sides: 3, r, rotation: Math.PI / 3 })
        equilateralTriangle(ctx, { x: (width - m) / 2, y: (height - m) / 2, w: m, h: m, progress })

        ctx.fillStyle = c1

        ctx.strokeStyle = c1
        ctx.lineWidth = Math.min(5, (m * progress) / 2)
        ctx.stroke()

        if (m < 30) {
            ctx.fill()
        }

        ctx.restore()
    },
    (ctx, { bounds, c1, c2, progress = 1 }) => {
        let { x, y, width, height } = bounds

        let pad = 4
        let w = width - pad * 2
        let midY = 4
        let rectH = Math.max(height * 0.5 - pad - midY / 2, 4)
        rectH *= progress
        let left = x + (width - w) / 2

        ctx.save()

        ctx.fillStyle = c1
        ctx.beginPath()
        ctx.rect(left, y + height / 2 - midY / 2 - rectH, w, rectH)
        ctx.fill()

        ctx.fillStyle = c2
        ctx.beginPath()
        ctx.rect(left, y + height / 2 + midY / 2, w, rectH)
        ctx.fill()
        ctx.restore()
    },
    (ctx, { bounds, c1, c2, progress = 1 }) => {
        let { x, y, width, height } = bounds

        let pad = 4
        let h = height - pad * 2
        let midX = 4
        let rectW = Math.max(width * 0.5 - pad - midX / 2, 4)
        rectW *= progress
        let top = y + (height - h) / 2

        ctx.save()
        ctx.fillStyle = c1
        ctx.beginPath()
        ctx.rect(x + width / 2 - midX / 2 - rectW, top, rectW, h)
        ctx.fill()

        ctx.fillStyle = c2
        ctx.beginPath()
        ctx.rect(x + width / 2 + midX / 2, top, rectW, h)
        ctx.fill()

        ctx.restore()
    },
]
