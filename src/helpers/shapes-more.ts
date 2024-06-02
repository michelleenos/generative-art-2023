/**
 * A triangle that is half the size of the square. The corner param is the 90 degree corner of the triangle.
 * Optional progress param is for animating triangle enter/leave, from 0 to 1.
 * @param ctx
 * @param props
 */
export function diagTriangle(
    ctx: CanvasRenderingContext2D,
    { x = 0, y = 0, w = 100, h = 100, corner = 'tl' as 'tl' | 'tr' | 'bl' | 'br', progress = 1 }
) {
    ctx.beginPath()
    if (corner === 'tl') {
        ctx.moveTo(x, y)
        ctx.lineTo(x, y + h * progress)
        ctx.lineTo(x + w * progress, y)
    } else if (corner === 'tr') {
        ctx.moveTo(x + w, y)
        ctx.lineTo(x + w - w * progress, y)
        ctx.lineTo(x + w, y + h * progress)
    } else if (corner === 'bl') {
        ctx.moveTo(x, y + h)
        ctx.lineTo(x, y + h - h * progress)
        ctx.lineTo(x + w * progress, y + h)
    } else if (corner === 'br') {
        ctx.moveTo(x + w, y + h)
        ctx.lineTo(x + w - w * progress, y + h)
        ctx.lineTo(x + w, y + h - h * progress)
    }
}

/**
 * Draw a half circle inside a square/rectangle. The radius will be the half of the longest side of the square.
 * The dir param is where the rounded side will point.
 * Optional progress param is for animating the circle enter/leave, from 0 to 1.
 * @param ctx
 * @param props
 */
export function halfCircleInRect(
    ctx: CanvasRenderingContext2D,
    { x = 0, y = 0, w = 100, h = 100, dir = 'up' as 'up' | 'down' | 'left' | 'right', progress = 1 }
) {
    let radius = ((w > h ? w : h) / 2) * progress
    ctx.beginPath()
    if (dir === 'up') {
        ctx.arc(x + w / 2, y + h, radius, Math.PI, 0)
    } else if (dir === 'down') {
        ctx.arc(x + w / 2, y, radius, 0, Math.PI)
    } else if (dir === 'left') {
        ctx.arc(x + w, y + h / 2, radius, Math.PI * 0.5, Math.PI * 1.5)
    } else if (dir === 'right') {
        ctx.arc(x, y + h / 2, radius, Math.PI * 1.5, Math.PI * 0.5)
    }
}

/**
 * A rounded leaf kinda shape with a pointed corner
 * @param ctx
 * @param props
 */
export function leaf(
    ctx: CanvasRenderingContext2D,
    { x = 0, y = 0, w = 100, h = 100, progress = 1, corner = 'tl' as 'tl' | 'tr' | 'bl' | 'br' }
) {
    let m = Math.min(w, h)
    let radius = m * 0.5

    let startX = corner === 'bl' || corner === 'tl' ? x + w : x
    let startY = corner === 'tr' || corner === 'tl' ? y + h : y
    let cx = x + m / 2
    let cy = y + m / 2
    let toCX = cx - startX
    let toCY = cy - startY
    let arcStart = corner === 'tl' ? 0.5 : corner === 'tr' ? 1 : corner === 'br' ? 1.5 : 0

    ctx.beginPath()
    ctx.arc(
        startX + toCX * progress,
        startY + toCY * progress,
        radius * progress,
        Math.PI * arcStart,
        Math.PI * (arcStart + 1.5)
    )
    ctx.lineTo(startX, startY)
}

export function quarterCircle(
    ctx: CanvasRenderingContext2D,
    { x = 0, y = 0, w = 100, h = 100, corner = 'tl' as 'tl' | 'tr' | 'bl' | 'br', progress = 1 }
) {
    let m = Math.min(w, h)
    let radius = m * progress

    ctx.beginPath()
    if (corner === 'tl') {
        ctx.arc(x + w, y + h, radius, Math.PI, Math.PI * 1.5)
        ctx.lineTo(x + w, y + h)
    } else if (corner === 'tr') {
        ctx.arc(x, y + h, radius, Math.PI * 1.5, 0)
        ctx.lineTo(x, y + h)
    } else if (corner === 'bl') {
        ctx.arc(x + w, y, radius, Math.PI * 0.5, Math.PI)
        ctx.lineTo(x + w, y)
    } else if (corner === 'br') {
        ctx.arc(x, y, radius, 0, Math.PI * 0.5)
        ctx.lineTo(x, y)
    }
}
