import p5 from 'p5'
import '../style.css'

// https://mathworld.wolfram.com/ConchoidofdeSluze.html

type ShapePolarSettings = {
    a?: number
    translate?: p5.Vector
    var1?: p5.Vector
    var2?: p5.Vector
    nSteps?: number
    angleRange?: number
}

new p5((p: p5) => {
    let btns = document.querySelector('#btns')
    let pre: p5.Element
    let settings: ShapePolarSettings
    p.setup = function () {
        let canvas = p.createCanvas(window.innerWidth, window.innerHeight)
        pre = p.createElement('pre').parent('btns')

        p.createButton('save')
            .parent('btns')
            .mouseClicked(() => p.saveCanvas(name(settings), 'jpg'))
        p.noLoop()
    }

    const secant = (x) => 1 / p.cos(x)

    const name = (s) => {
        const r = (n) => p.round(n, 2)
        let res = `a-${r(s.a)}--t-${r(s.translate.x)}-${r(s.translate.y)}--v1-${r(s.var1.x)}-${
            s.var1.y
        }--v2-${r(s.var2.x)}-${r(s.var2.y)}--n-${r(s.nSteps)}`
        return res
    }

    p.draw = function () {
        settings = {
            translate: p.createVector(
                p.random(-1, 1),
                p.random(0.7, 2) * (p.random() < 0.5 ? -1 : 1)
            ),

            var1: p.createVector(p.random(-1, 1), p.random(-1, 1)),
            var2: p.createVector(p.random(-1.5, 2), p.random(-1, 1)),
            // angleStep: p.random(0.005, 0.08),
            nSteps: p.floor(p.random(20, 200)),
            angleRange: p.random(0.1, 0.5),
            a: p.random(-4, 4),
        }
        console.log(settings)

        p.push()
        p.background(230)
        p.stroke(0)
        p.strokeWeight(0.5)
        p.noFill()
        p.translate(p.width / 2, p.height / 2)
        // p.rotate(p.PI / 2)

        shapePolar(settings)

        p.pop()
    }

    p.mouseClicked = function (e: Event) {
        if (e.target instanceof HTMLElement && (!btns || !btns.contains(e.target))) {
            p.redraw()
        }
    }

    function shapePolar({
        a = -2,
        translate = p.createVector(0, -1),
        var1 = p.createVector(1, 0),
        var2 = p.createVector(1, 1),
        nSteps = 20,
        angleRange = 0.3,
    }: ShapePolarSettings = {}) {
        let angleVals = [p.PI * (1 - angleRange), p.PI]
        let angle = angleVals[0]
        let angleStep = (angleVals[1] - angleVals[0]) / nSteps

        const findScale = () => {
            let valsY: any[] = []
            let valsX: any[] = []

            let angle = angleVals[0]
            while (angle < angleVals[1]) {
                let r = secant(angle) + a * p.cos(angle)
                let v = p5.Vector.fromAngle(angle).mult(r)

                let translated = v.copy().mult(translate)
                let ctr = v.copy().mult(var1).rotate(angle)
                translated.add(ctr)

                valsY.push(p.abs(translated.y) + p.abs(var2.y * v.y) / 2)
                valsX.push(p.abs(translated.x) + p.abs(var2.x * v.x) / 2)

                angle += angleStep
            }

            let yMax = p.max(valsY)
            let xMax = p.max(valsX)
            let yScale = (p.height * 0.4) / yMax
            let xScale = (p.width * 0.4) / xMax
            let scale = p.min(yScale, xScale)

            return scale
        }

        const atAngle = (angle) => {
            let r = secant(angle) + a * p.cos(angle)
            let v = p5.Vector.fromAngle(angle).mult(r)

            // v.mult(scale)
            // p.circle(v.x, v.y, 1)

            let ctr = v.copy().mult(var1)
            let size = v.copy().mult(var2)

            p.push()
            p.translate(v.copy().mult(translate).mult(scale))
            p.rotate(angle)

            ctr.mult(scale)
            size.mult(scale)
            p.ellipse(ctr.x, ctr.y, size.x, size.y)
            p.pop()
        }

        let scale = findScale()

        while (angle < angleVals[1]) {
            atAngle(angle)
            atAngle(-angle)

            angle += angleStep
        }
        atAngle(angleVals[1])
    }

    function shapeParametric(a = 1, points = true) {
        let step = points ? 0.01 : 0.1
        let tvals = [p.PI * 0.499, p.PI * 1.5]
        let t = tvals[0]
        p.beginShape()
        let scale = 50

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
