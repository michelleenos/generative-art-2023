import { GUI } from 'lil-gui'
import { palettes } from 'mish-bainrow'
import p5 from 'p5'
import '~/style.css'
import { drawBox } from './draw-stuff'
import { getJoinSide, getNextSide, twoPointPerspective } from './get-2pt-shapes'
import type { Pt, TwoPtEnvProps, TwoPtShapeProps, TwoPtSide, TwoPtSidesBox } from './types'
import { Line } from './Lines'

let pal = palettes.goldenCloud

new p5((p: p5) => {
    let shapes: { props: TwoPtShapeProps; sides: TwoPtSidesBox }[]

    const envProps: TwoPtEnvProps = {
        vpa: [-203, -330],
        vpb: [380, -330],
    }

    function drawVanishingLines(side: TwoPtSide, vpa: Pt, vpb: Pt) {
        p.push()

        p.drawingContext.globalAlpha = 0.1
        p.stroke(pal.colors[0]).strokeWeight(1)
        // p.stroke(0, 50).strokeWeight(1)
        if (vpa[0] < vpb[0]) {
            p.line(...vpa, p.width, side.vla1.y(p.width))
            p.line(...vpa, p.width, side.vla2.y(p.width))
            p.line(...vpb, -p.width, side.vlb1.y(-p.width))
            p.line(...vpb, -p.width, side.vlb2.y(-p.width))
        } else {
            p.line(...vpa, -p.width, side.vla1.y(-p.width))
            p.line(...vpa, -p.width, side.vla2.y(-p.width))
            p.line(...vpb, p.width, side.vlb1.y(p.width))
            p.line(...vpb, p.width, side.vlb2.y(p.width))
        }
        p.drawingContext.globalAlpha = 1

        p.pop()
    }

    p.setup = function () {
        p.createCanvas(900, 900)

        p.strokeJoin(p.ROUND)
        p.noLoop()
    }

    let shapeProps = {
        xa: -168.32953209988773,
        xb: -203,
        xc: -54.11253171041608,
        y1: -320.71001703976975,
        y2: -237.77313957605594,
    }

    p.draw = function () {
        let m = 800
        p.background(0)
        p.push()
        p.translate((p.width - m) / 2, (p.height - m) / 2)
        p.translate(m / 2, m / 2)
        p.fill(255)
        p.rect(-m / 2, -m / 2, m, m)

        // shapes.forEach((shape) => {
        //     const sides = shape.sides
        //     drawBox({ sides, vpa: envProps.vpa, vpb: envProps.vpb, colors: pal.colors }, p)
        // })
        const { vpa, vpb } = envProps
        const { xa, xb, xc, y1, y2 } = shapeProps

        let a: TwoPtSide = {
            x: xa,
            y1,
            y2,
            vla1: new Line(vpa, [xa, y1]),
            vla2: new Line(vpa, [xa, y2]),
            vlb1: new Line(vpb, [xa, y1]),
            vlb2: new Line(vpb, [xa, y2]),
        }

        let b = getNextSide({
            fromSide: a,
            vpa: vpa,
            vpb: vpb,
            useVp: 'a',
            x: xb,
        })

        let c = getNextSide({
            fromSide: a,
            vpa: vpa,
            vpb: vpb,
            useVp: 'b',
            x: xc,
        })

        console.log(c.vla1)
        p.strokeWeight(5)
        p.point(...c.vla1.p1!)
        p.point(...c.vla1.p2!)

        let d = getJoinSide({
            side1: c,
            side2: b,
        })
        // let sides = twoPointPerspective(shapeProps, envProps)
        // drawBox({ sides, vpa: envProps.vpa, vpb: envProps.vpb, colors: pal.colors }, p)

        // drawVanishingLines(sides.a, envProps.vpa, envProps.vpb)
        // drawVanishingLines(sides.b, envProps.vpa, envProps.vpb)
        // drawVanishingLines(sides.c, envProps.vpa, envProps.vpb)

        console.log({ a, b, c, d })
        p.strokeWeight(1).stroke(0)
        // b.vlb1.drawFull(p)
        // c.vla1.drawFull(p)
        p.line(a.x, a.y1, a.x, a.y2)
        p.line(b.x, b.y1, b.x, b.y2)
        p.line(c.x, c.y1, c.x, c.y2)
        p.line(d.x, d.y1, d.x, d.y2)

        p.noStroke().fill(0)
        p.text('a', a.x, a.y2 + 10)
        p.text('b', b.x, b.y2 + 12)
        p.text('c', c.x, c.y2 + 12)
        // p.text('d', d.x, d.y2 + 12)

        p.strokeWeight(1).stroke(0)
        // p.line(d.x, d.y1, c.x, c.y1)

        p.stroke(0, 50).strokeWeight(1)
        // c.vla1.drawFull(p)
        // a.vlb1.drawFull(p)
        // a.vlb2.drawFull(p)
        c.vla1.drawFull(p)
        c.vla2.drawFull(p)

        // c.vla2.drawFull(p)
        // b.vlb2.drawFull(p)
        // b.vlb2.drawFull(p)
        // b.vlb1.drawFull(p)
        // d.vlb1.drawFull(p)
        // drawBox({ sides, vpa: envProps.vpa, vpb: envProps.vpb, colors: pal.colors }, p)

        p.strokeWeight(5).stroke(0)
        p.point(...envProps.vpa)
        p.point(...envProps.vpb)

        p.pop()
    }
})
