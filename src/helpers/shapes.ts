export function polygon(
    ctx: CanvasRenderingContext2D,
    {
        cx,
        cy,
        r,
        sides,
        rotation = 0,
    }: { cx: number; cy: number; r: number; sides: number; rotation?: number }
) {
    let step = (Math.PI * 2) / sides
    ctx.beginPath()
    for (let i = 0; i < sides; i++) {
        ctx.lineTo(cx + Math.cos(i * step + rotation) * r, cy + Math.sin(i * step + rotation) * r)
    }
    ctx.closePath()
}

export function burst(
    ctx: CanvasRenderingContext2D,
    {
        cx,
        cy,
        r,
        nodes,
        vary,
        start = 0,
    }: { cx: number; cy: number; r: number; nodes: number; vary: number; start?: number }
) {
    ctx.beginPath()
    for (let i = 0; i < 2 * Math.PI; i += 0.01) {
        let ri = r + Math.sin(i * nodes) * vary

        let x1 = cx + Math.cos(i + start) * ri
        let y1 = cy + Math.sin(i + start) * ri
        ctx.lineTo(x1, y1)
    }
    ctx.closePath()
}

export function zigzag(
    ctx: CanvasRenderingContext2D,
    {
        x,
        y,
        w,
        h,
        step,
        zig,
        dir = 'horizontal',
    }: {
        x: number
        y: number
        w: number
        h: number
        step: number
        zig: number
        dir?: 'horizontal' | 'vertical'
    }
) {
    let ni = (dir === 'horizontal' ? h : w) / step
    let nj = (dir === 'horizontal' ? w : h) / step
    for (let i = 0; i < ni; i++) {
        ctx.beginPath()
        for (let j = 0; j < nj; j++) {
            let xx = x
            let yy = y
            if (dir === 'horizontal') {
                xx += j * step
                yy += i * step + (j % 2 === 0 ? zig : -zig)
            } else {
                xx += i * step + (j % 2 === 0 ? zig : -zig)
                yy += j * step
            }
            ctx.lineTo(xx, yy)
        }
        ctx.stroke()
    }
}

export function rectCenter(
    ctx: CanvasRenderingContext2D,
    { cx, cy, w, h }: { cx: number; cy: number; w: number; h: number }
): void
export function rectCenter(
    ctx: CanvasRenderingContext2D,
    { x, y, w, h }: { x: number; y: number; w: number; h: number }
): void
export function rectCenter(
    ctx: CanvasRenderingContext2D,
    { x, y, size }: { x: number; y: number; size: number }
): void
export function rectCenter(
    ctx: CanvasRenderingContext2D,
    { cx, cy, size }: { cx: number; cy: number; size: number }
): void

export function rectCenter(
    ctx: CanvasRenderingContext2D,
    {
        x,
        y,
        cx,
        cy,
        size,
        w,
        h,
    }: { x?: number; y?: number; cx?: number; cy?: number; size?: number; w?: number; h?: number }
) {
    if (cx !== undefined && cy !== undefined) {
        if (size) {
            ctx.rect(cx - size / 2, cy - size / 2, size, size)
        } else if (w && h) {
            ctx.rect(cx - w / 2, cy - h / 2, w, h)
        }
    } else if (x !== undefined && y !== undefined) {
        if (size) {
            ctx.rect(x - size / 2, y - size / 2, size, size)
        } else if (w && h) {
            ctx.rect(x - w / 2, y - h / 2, w, h)
        }
    }
}

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
