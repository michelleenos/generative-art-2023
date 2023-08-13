import '../style.css'
import createCanvas from '../helpers/canvas/createCanvas'
import { random } from '../helpers/utils'
import { Rect, Quilt, QuiltPattern } from './patterns'

let palette = ['#a935bb', '#f7b32b', '#f72c25', '#1c77c3']

let width = window.innerWidth
let height = window.innerHeight

let { canvas, ctx } = createCanvas(width, height)

const corners = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
]

function triLines(
    step: number,
    {
        start = { x: 0.24, y: 0.4 },
        space = -0.06,
        count = 4,
        linew = 0.015,
    } = {}
) {
    ctx.lineWidth = step * linew
    ctx.beginPath()
    for (let i = 0; i < count; i++) {
        let x = start.x + space * i
        let y = start.y + space * i - linew * 0.5

        ctx.moveTo(step * x, step * y)
        ctx.lineTo(step * x * -1, step * y)

        ctx.moveTo(step * x, step * -y)
        ctx.lineTo(step * -x, step * -y)

        ctx.moveTo(step * y, step * x)
        ctx.lineTo(step * y, step * -x)

        ctx.moveTo(step * -y, step * x)
        ctx.lineTo(step * -y, step * -x)
    }
    ctx.stroke()
}

function symLines(
    ctx: CanvasRenderingContext2D,
    step: number,
    [a1, b1]: [number, number],
    [a2, b2]: [number, number],
    reflect: 'x' | 'y' = 'y'
): void {
    ctx.moveTo(step * a1, step * b1)
    ctx.lineTo(step * a2, step * b2)

    if (reflect === 'x') {
        ctx.moveTo(step * a1, step * -b1)
        ctx.lineTo(step * a2, step * -b2)
    } else if (reflect === 'y') {
        ctx.moveTo(step * -a1, step * b1)
        ctx.lineTo(step * -a2, step * b2)
    }
}

function quads(fn: () => void) {
    for (let i = 0; i < 4; i++) {
        ctx.save()
        ctx.rotate(Math.PI * 0.5 * i)
        fn()
        ctx.restore()
    }
}

function patternOne(step: number) {
    let cornerSize = random(0.07, 0.2) // 0.1
    let cornerCenter = random(0.32, 0.45 - cornerSize * 0.6) // 0.35
    let cornerHalf = cornerSize * 0.5

    let rectc = random(0.08, 0.15)
    let rectc2 = random(rectc + 0.05, 0.25)
    let rectc3 = random(rectc2 + 0.05, rectc2 + 0.1)

    let lineStart = rectc3 * 0.5

    ctx.lineWidth = step * 0.015
    Rect.strokeCenter(ctx, 0, 0, step * 0.95, step * 0.95)

    {
        Rect.fillCenter(ctx, 0, 0, step * rectc, step * rectc)
        Rect.strokeCenter(ctx, 0, 0, step * rectc2, step * rectc2)
        Rect.strokeCenter(ctx, 0, 0, step * rectc3, step * rectc3)
    }

    Quilt.rectCorners(ctx, step, cornerSize, cornerCenter)
    Quilt.linesCorners(ctx, step, lineStart, cornerCenter)

    {
        ctx.setLineDash([step * 0.025])
        let pts = {
            s: { x: lineStart, y: lineStart - cornerSize },
            e: {
                x: cornerCenter + cornerHalf,
                y: cornerCenter - cornerHalf,
            },
        }
        ctx.beginPath()
        quads(() => {
            ctx.moveTo(step * pts.s.x, step * pts.s.y)
            ctx.lineTo(step * pts.e.x, step * pts.e.y)
            ctx.moveTo(step * pts.s.y, step * pts.s.x)
            ctx.lineTo(step * pts.e.y, step * pts.e.x)
        })
        ctx.stroke()
        ctx.setLineDash([])
    }

    triLines(step, {
        start: {
            x: cornerCenter - cornerSize,
            y: cornerCenter + cornerHalf,
        },
        space: Math.max((cornerCenter - cornerSize) * -0.3, -0.06),
    })
}

function patternTwo(step: number) {
    ctx.lineWidth = step * 0.015
    Rect.strokeCenter(ctx, 0, 0, step * 0.95, step * 0.95)

    // let rects = 0.1
    let rects = random(0.08, 0.13)
    let grid_out = random(0.35, 0.42)
    let grid_mid = random(0.22, 0.27)

    let c_len = rects * random(0.45, 0.6)

    Rect.strokeCenter(ctx, 0, 0, step * rects, step * rects)

    {
        ctx.beginPath()

        quads(() => {
            ctx.moveTo(step * grid_out, step * grid_mid)
            ctx.lineTo(step * -grid_out, step * grid_mid)
        })

        ctx.moveTo(0, step * -grid_out)
        ctx.lineTo(0, step * grid_out)

        ctx.moveTo(step * -grid_out, 0)
        ctx.lineTo(step * grid_out, 0)

        ctx.stroke()
    }

    {
        let cross_space = grid_mid - rects
        let cross_center = rects * 0.5 + cross_space * 0.5
        let c_out = cross_center + c_len * 0.5
        let c_in = cross_center - c_len * 0.5

        ctx.beginPath()
        quads(() => {
            ctx.moveTo(step * c_out, step * c_out)
            ctx.lineTo(step * c_in, step * c_in)

            ctx.moveTo(step * c_out, step * c_in)
            ctx.lineTo(step * c_in, step * c_out)
        })
        ctx.stroke()
    }

    {
        let cross_center = grid_mid + rects * 0.5 + c_len * 0.9
        let c_out = cross_center + c_len * 0.5
        let c_in = cross_center - c_len * 0.5

        ctx.beginPath()
        quads(() => {
            ctx.moveTo(step * c_out, step * c_out)
            ctx.lineTo(step * c_in, step * c_in)

            ctx.moveTo(step * c_out, step * c_in)
            ctx.lineTo(step * c_in, step * c_out)
        })
        ctx.stroke()
    }

    {
        corners.forEach(([x, y]) => {
            Rect.fillCenter(
                ctx,
                step * grid_mid * x,
                step * grid_mid * y,
                step * rects,
                step * rects
            )
        })
    }
}

function patternThree(step: number) {
    ctx.lineWidth = step * 0.01
    Rect.strokeCenter(ctx, 0, 0, step * 0.95, step * 0.95)

    let triLen = 0.15
    let spaceBetween = 0.005
    let spaceAround = 0.01

    let outerlines_in = triLen * 2
    let outerlines_out = 0.4
    let outerlines_edge = triLen * 0.75

    Rect.strokeCenter(ctx, 0, 0, step * triLen * 4, step * triLen * 4)

    quads(() => {
        ctx.beginPath()
        ctx.moveTo(step * outerlines_edge, step * outerlines_in)
        ctx.lineTo(step * outerlines_edge, step * outerlines_out)
        ctx.moveTo(step * -outerlines_edge, step * outerlines_in)
        ctx.lineTo(step * -outerlines_edge, step * outerlines_out)
        ctx.stroke()
    })

    quads(() => {
        {
            ctx.save()
            ctx.translate(step * spaceBetween, step * spaceAround)
            let a = Math.PI * 0.25
            let x = Math.cos(a) * step * triLen
            let y = Math.sin(a) * step * triLen

            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(x, y)
            ctx.lineTo(x, y + step * triLen)
            ctx.lineTo(0, step * triLen)
            ctx.closePath()
            ctx.fill()
            ctx.restore()
        }
        {
            ctx.save()
            ctx.translate(step * -spaceBetween, step * spaceAround)

            let a = Math.PI * 0.75
            let x = Math.cos(a) * step * triLen
            let y = Math.sin(a) * step * triLen

            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(x, y)
            ctx.lineTo(x, y + step * triLen)
            ctx.lineTo(0, step * triLen)
            ctx.closePath()
            ctx.fill()
            ctx.restore()
        }
    })

    {
        let cross_in = triLen * 1.1
        let cross_out = triLen * 1.4
        ctx.beginPath()
        quads(() => {
            ctx.moveTo(step * cross_in, step * cross_in)
            ctx.lineTo(step * cross_out, step * cross_out)

            ctx.moveTo(step * cross_in, step * cross_out)
            ctx.lineTo(step * cross_out, step * cross_in)
        })
        ctx.stroke()
    }
}

let pattern = new QuiltPattern(width, height, palette, 6)
pattern.setup(ctx)
pattern.draw(ctx, (step) => {
    let p = Math.floor(random(0, 3))
    if (p === 0) {
        patternOne(step)
    } else if (p === 1) {
        patternTwo(step)
    } else {
        patternThree(step)
    }
})
