export type Point = { x: number; y: number }

export const getRandomPoints = (n: number = 5, width: number, height: number): Point[] => {
    let i = 0
    let points: Point[] = []
    while (i < n) {
        points.push({
            x: Math.floor(Math.random() * width - width / 2),
            y: Math.floor(Math.random() * height - height / 2),
        })
        i++
    }

    return points
}

export const reflectPoints = (points: Point[]): Point[] => {
    return points.map((p) => {
        return { x: p.x * -1, y: p.y * -1 }
    })
}

export const drawPoint = (
    ctx: CanvasRenderingContext2D,
    point: Point,
    radius: number = 5,
    fill: string = 'rgba(255,0,255,0.5)'
): void => {
    ctx.beginPath()
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()
}

export const drawPoints = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
    radius: number = 5,
    fill: string = 'rgba(255,0,255,0.5)'
): void => {
    for (let i = 0; i < points.length; i++) {
        drawPoint(ctx, points[i], radius, fill)
    }
}
