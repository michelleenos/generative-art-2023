import { random } from './utils'

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

export function diagTriangle(
    ctx: CanvasRenderingContext2D,
    {
        x,
        y,
        w,
        h,
        corner = 'tl',
    }: { x: number; y: number; w: number; h: number; corner?: 'tl' | 'tr' | 'bl' | 'br' }
) {
    ctx.beginPath()
    if (corner === 'tl') {
        ctx.moveTo(x, y)
        ctx.lineTo(x, y + h)
        ctx.lineTo(x + w, y)
    } else if (corner === 'tr') {
        ctx.moveTo(x + w, y)
        ctx.lineTo(x, y + h)
        ctx.lineTo(x + w, y + h)
    } else if (corner === 'bl') {
        ctx.moveTo(x, y)
        ctx.lineTo(x + w, y + h)
        ctx.lineTo(x + w, y)
    } else if (corner === 'br') {
        ctx.moveTo(x, y + h)
        ctx.lineTo(x + w, y)
        ctx.lineTo(x, y)
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

export type CrazyTilesProps = {
    x: number
    y: number
    w: number
    h: number
    iterations?: number
    fn: (x: number, y: number, w: number, h: number) => void
    minSize?: number
    divisions?: '2s' | '2s-3s' | 'random'
}

export function crazyTiles({
    x,
    y,
    w,
    h,
    iterations = 6,
    fn,
    minSize = -1,
    divisions = '2s',
}: CrazyTilesProps) {
    iterations--

    if (iterations === 0 || w < minSize || h < minSize) {
        fn(x, y, w, h)
        return
    }

    if (w > h) {
        let w1, w2

        if (divisions === '2s') {
            w1 = w / random([2, 4])
        } else if (divisions === '2s-3s') {
            w1 = w / random([2, 3, 4])
        } else {
            w1 = w * random(0.2, 0.8)
        }

        if (random() < 0.5) {
            w2 = w - w1
        } else {
            w2 = w1
            w1 = w - w2
        }

        let x1 = x - w / 2 + w1 / 2
        let x2 = x + w / 2 - w2 / 2

        crazyTiles({ x: x1, y, w: w1, h, iterations, fn, minSize, divisions })
        crazyTiles({ x: x2, y, w: w2, h, iterations, fn, minSize, divisions })
    } else {
        let h1, h2
        if (divisions === '2s') {
            h1 = h / random([2, 4])
        } else if (divisions === '2s-3s') {
            h1 = h / random([2, 3, 4])
        } else {
            h1 = h * random(0.2, 0.8)
        }

        if (random() < 0.5) {
            h2 = h - h1
        } else {
            h2 = h1
            h1 = h - h2
        }
        let y1 = y - h / 2 + h1 / 2
        let y2 = y + h / 2 - h2 / 2

        crazyTiles({ x, y: y1, w, h: h1, iterations, fn, minSize, divisions })
        crazyTiles({ x, y: y2, w, h: h2, iterations, fn, minSize, divisions })
    }
}
