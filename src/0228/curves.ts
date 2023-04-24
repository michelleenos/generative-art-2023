import p5 from 'p5'
import easings from '../helpers/easings'

type Ease = (x: number) => number

type CurvesOptions = {
    colorful?: boolean
    nStart?: number
    nEnd?: number
    angleMult?: number
    scale?: number
    rotate?: number
    alphaStart?: number
    alphaEnd?: number
    ease?: Ease | keyof typeof easings
}

function curves(
    p: p5,
    {
        colorful = false,
        nStart = -1,
        nEnd = 2,
        angleMult = 4,
        scale = 10,
        rotate = 0,
        alphaStart = 0.1,
        alphaEnd = 1,
        ease = easings.inQuad,
    }: CurvesOptions = {}
) {
    const colorStroke = () => {
        let hueMin = p.floor(p.random(0, 360))
        let hueMax = p.floor(hueMin + p.random(30, 120))

        return (n, alpha = 1) => {
            let hue = p.map(n, -1, 2, hueMin, hueMax)
            p.stroke(hue % 360, 80, 90, alpha)
        }
    }

    const whiteStroke = () => {
        return (alpha = 1) => {
            p.stroke(0, 0, 100, alpha)
        }
    }

    const shape = (add: number = 0, angleMult: number = 4) => {
        let angle = 0

        const drawVertex = (angle) => {
            let val = p.sin(angleMult * angle) + add
            if (val <= 0) {
                p.endShape()
                p.beginShape()
                return
            }
            let r = 2 / p.sqrt(val)
            // @ts-ignore
            let v = p5.Vector.fromAngle(angle).mult(r).mult(scale)

            p.vertex(v.x, v.y)
        }

        p.beginShape()
        while (angle < p.TWO_PI) {
            drawVertex(angle)
            angle += 0.005
        }
        p.endShape()
    }

    let easeFunc: Ease
    if (typeof ease === 'string') {
        easeFunc = easings[ease]
    } else {
        easeFunc = ease
    }

    let setStroke = colorful ? colorStroke() : whiteStroke()

    p.push()
    p.background(3)
    p.strokeWeight(1)
    p.noFill()
    p.translate(p.width / 2, p.height / 2)
    p.rotate(rotate)

    let n = nStart

    while (n < nEnd) {
        let progress = p.map(n, nStart, nEnd, 0, 1)
        let progressEase = easeFunc(progress)
        let alpha = p.map(progressEase, 0, 1, alphaStart, alphaEnd)
        setStroke(alpha)
        shape(n, angleMult)
        n += 0.1
    }
    p.pop()
}

export { curves, type CurvesOptions }
