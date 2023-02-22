import p5 from 'p5'
import '../style.css'

new p5((p: p5) => {
    let v1 = 0
    let v2 = 0
    p.setup = function () {
        let canvas = p.createCanvas(window.innerWidth, window.innerHeight)
        p.noLoop()
    }

    const secant = (x) => 1 / p.cos(x)
    const scale = 50

    p.draw = function () {
        // v1 = p.sin(p.frameCount * 0.01) * 3
        // v2 = p.cos(p.frameCount * 0.03) + 1

        p.push()
        p.background(230)
        p.stroke(0)
        p.strokeWeight(0.5)
        p.noFill()
        p.translate(p.width / 2, p.height / 2)

        // let a = -4
        // while (a < 4) {
        //     shapeParametric(a, false)
        //     a += 0.3
        // }
        // shapeParametric(-4, step)
        // shapeParametric(-3, step)
        // shapeParametric(-2, step)
        // shapeParametric(-1, step)
        shapePolar(1)
        // shapeParametric(3)
        // shapeParametric(4)

        p.pop()
    }

    function shapePolar(a = 1, points = true) {
        let angleVals = [p.PI * 0.5, p.PI * 1.5]
        let angle = angleVals[0]
        p.beginShape()
        while (angle < angleVals[1]) {
            let r = secant(angle) + a * p.cos(angle)
            let v = p5.Vector.fromAngle(angle).mult(r).mult(scale)
            if (points) {
                p.point(v.x, v.y)

                p.push()
                p.translate(v.x, v.y)
                p.rotate(angle)
                // p.ellipse(v.x, 0, v.x, v.y * 0.2)
                p.line(v.x, 0, v.x * 2, 0)
                p.pop()
            } else {
                p.curveVertex(v.x, v.y)
            }

            angle += 0.03
        }
        p.endShape()
    }

    function shapeParametric(a = 1, points = true) {
        let step = points ? 0.01 : 0.1
        let tvals = [p.PI * 0.499, p.PI * 1.5]
        let t = tvals[0]
        p.beginShape()

        while (t < tvals[1]) {
            let x = (secant(t) + a * p.cos(t)) * p.cos(t)
            let y = (secant(t) + a * p.cos(t)) * p.sin(t)

            x *= scale
            y *= scale
            if (points) {
                p.point(x, y)
                p.stroke(
                    255 - p.map(t, tvals[0], tvals[1], 0, 100),
                    10,
                    p.map(t, tvals[0], tvals[1], 0, 255),
                    100
                )
            } else {
                p.curveVertex(x, y)
            }

            t += step
        }

        p.endShape()
    }
})
