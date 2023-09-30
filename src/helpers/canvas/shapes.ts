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
        let ri = r + Math.sin(i * nodes + start) * vary

        let x1 = cx + Math.cos(i) * ri
        let y1 = cy + Math.sin(i) * ri
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
    {
        x,
        y,
        cx,
        cy,
        w,
        h,
    }: { x?: number; y?: number; cx?: number; cy?: number; w: number; h: number }
) {
    if (cx && cy) {
        ctx.rect(cx - w / 2, cy - h / 2, w, h)
    } else if (x && y) {
        ctx.rect(x - w / 2, y - h / 2, w, h)
    }
}
