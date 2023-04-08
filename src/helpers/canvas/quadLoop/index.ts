export default function quadLoop(ctx, points) {
    ctx.beginPath()
    let midX0 = (points[0].x + points[1].x) / 2
    let midY0 = (points[0].y + points[1].y) / 2
    ctx.moveTo(midX0, midY0)

    for (let i = 1; i < points.length - 1; i++) {
        let p0 = points[i]
        let p1 = points[i + 1]
        let midX = (p0.x + p1.x) / 2
        let midY = (p0.y + p1.y) / 2

        ctx.quadraticCurveTo(p0.x, p0.y, midX, midY)
    }

    let last = points[points.length - 1]
    // midpoint between last & first points to close the loop
    let midX1 = (last.x + points[0].x) / 2
    let midY1 = (last.y + points[0].y) / 2
    ctx.quadraticCurveTo(last.x, last.y, midX1, midY1)
    ctx.quadraticCurveTo(points[0].x, points[0].y, midX0, midY0)
}
