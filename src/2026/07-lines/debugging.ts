import type { Vec2 } from '~/helpers/trig-shapes'
import { getRibbon } from './ribbon'

export function debugLines(ctx: CanvasRenderingContext2D, noise: (x: number, y: number) => number) {
    const fillCircle = (x: number, y: number, c: string, r = 4) => {
        ctx.save()
        ctx.fillStyle = c
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    }

    function midpoint(a: Vec2, b: Vec2) {
        return a.copy().add(b).div(2)
    }

    function arrow(pos: Vec2, v: Vec2, len: number, c: string = '#bb1212') {
        ctx.fillStyle = c
        ctx.strokeStyle = c

        const angle = Math.atan2(v.y, v.x)
        ctx.save()
        ctx.translate(pos.x, pos.y)
        ctx.rotate(angle)
        ctx.beginPath()
        ctx.arc(0, 0, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(len, 0)
        ctx.stroke()

        ctx.moveTo(len, 0)
        ctx.lineTo(len - 5, -5)
        ctx.lineTo(len - 5, 5)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
    }

    return {
        smoothCurveWithDots(pts: Vec2[]) {
            ctx.beginPath()
            ctx.strokeStyle = '#242490'
            const midPoints: { x: number; y: number }[] = []
            for (let i = 0; i < pts.length - 1; i++) {
                const cur = pts[i]
                const next = pts[i + 1]
                const mid = cur.copy().add(next).div(2)
                midPoints.push(mid)
                if (i === 0) {
                    ctx.moveTo(mid.x, mid.y)
                } else {
                    ctx.quadraticCurveTo(cur.x, cur.y, mid.x, mid.y)
                }
            }
            ctx.stroke()

            ctx.fillStyle = '#5252c8'
            pts.forEach(({ x, y }) => {
                ctx.beginPath()
                ctx.arc(x, y, 5, 0, Math.PI * 2)
                ctx.fill()
            })

            ctx.fillStyle = '#a574e7'
            midPoints.forEach(({ x, y }) => {
                ctx.beginPath()
                ctx.arc(x, y, 3, 0, Math.PI * 2)
                ctx.fill()
            })
        },
        smoothRibbonWithDots(pts: Vec2[]) {
            const { results, edge1, edge2, all } = getRibbon(pts, {
                width: 20,
                taper: 0.3,
                taperLen: 0,
                noiseFn: noise,
            })
            const curve: [number, number, number, number][] = []

            ctx.globalAlpha = 0.5
            results.forEach(({ pt, e1, e2 }) => {
                fillCircle(pt.x, pt.y, '#3c1e83')
                fillCircle(e1.x, e1.y, '#169ed8', 3)
                fillCircle(e2.x, e2.y, '#169ed8', 3)
            })
            ctx.globalAlpha = 1

            // const len = results.length
            // let mpba = midpoint(results[0].b, results[0].a)
            // let start = mpba
            // for (let i = 0; i < results.length - 1; i++) {
            //     const mid = midpoint(results[i].a, results[i + 1].a)
            //     curve.push([results[i].a.x, results[i].a.y, mid.x, mid.y])
            // }
            // let mpab = midpoint(results[len - 1].a, results[len - 1].b)
            // curve.push([results[len - 1].a.x, results[len - 1].a.y, mpab.x, mpab.y])

            // for (let i = len - 1; i > 0; i--) {
            //     const mid = midpoint(results[i].b, results[i - 1].b)
            //     curve.push([results[i].b.x, results[i].b.y, mid.x, mid.y])
            // }

            // curve.push([results[0].b.x, results[0].b.y, mpba.x, mpba.y])

            const mid1 = midpoint(all[0], all[1])
            let start = mid1
            for (let i = 1; i < all.length; i++) {
                const mid = midpoint(all[i], all[(i + 1) % all.length])
                curve.push([all[i].x, all[i].y, mid.x, mid.y])
            }
            curve.push([all[0].x, all[0].y, mid1.x, mid1.y])
            // ctx.quadraticCurveTo(all[0].x, all[0].y, mpa1.x, mpa1.y)
            // ctx.strokeStyle = '#095d3e'
            // ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(start.x, start.y)
            curve.forEach(([cpx, cpy, x, y]) => ctx.quadraticCurveTo(cpx, cpy, x, y))
            ctx.stroke()

            fillCircle(start.x, start.y, '#ed4949', 3)
            curve.forEach(([cpx, cpy, mpx, mpy]) => {
                fillCircle(mpx, mpy, '#ed4949', 3)
                fillCircle(cpx, cpy, '#169ed8', 4)
            })

            results.forEach((res) => {
                fillCircle(res.pt.x, res.pt.y, '#1b42ee')
                ctx.beginPath()
                ctx.moveTo(res.e1.x, res.e1.y)
                ctx.lineTo(res.e2.x, res.e2.y)
                ctx.strokeStyle = '#dda81b'
                ctx.stroke()
                arrow(res.pt, res.direction, 30)
                ctx.fillStyle = '#ed4949'
                ctx.fillText(`${res.w.toFixed(2)}`, res.pt.x, res.pt.y - 30)
            })
        },
    }
}
