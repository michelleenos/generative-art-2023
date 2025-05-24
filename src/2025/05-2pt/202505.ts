import { GUI } from 'lil-gui'
import { palettes } from 'mish-bainrow'
import p5 from 'p5'
import '~/style.css'
import { drawBox } from './draw-stuff'
import { twoPointPerspective } from './get-2pt-shapes'
import type { Pt, TwoPtEnvProps, TwoPtShapeProps, TwoPtSide, TwoPtSidesBox } from './types'

let pal = palettes.goldenCloud

const gui = new GUI()

// function mapObjectValues<T extends Record<string, number>>(
//     obj: T,
//     fromMin: number,
//     fromMax: number,
//     toMin: number,
//     toMax: number
// ): T {
//     const keys = Object.keys(obj) as (keyof T)[]
//     const newObj: T = keys.reduce((acc, key) => {
//         acc[key] = p.map(obj[key], fromMin, fromMax, toMin, toMax) as T[keyof T]
//         return acc
//     }, {} as T)
//     return newObj
// }

new p5((p: p5) => {
    let shapes: { props: TwoPtShapeProps; sides: TwoPtSidesBox }[]

    const envProps: TwoPtEnvProps = {
        vpa: [-520, -350],
        vpb: [520, -350],
    }

    const shapeInitProps: TwoPtShapeProps = {
        xa: 0,
        xb: -130,
        xc: 90,
        y1: -220,
        y2: 350,
    }

    const props = {
        xChangeMin: 20,
        xChangeMax: 66,
        xDepthMin: 51,
        xDepthMax: 150,
        htPercentMin: 0.3,
        htPercentMax: 0.64,
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

    function makeGui() {
        let propsFold = gui.addFolder('shared props').onChange(init)
        propsFold.add(props, 'xChangeMin', 0, 400, 1)
        propsFold.add(props, 'xChangeMax', 0, 400, 1)
        propsFold.add(props, 'xDepthMin', 0, 400, 1)
        propsFold.add(props, 'xDepthMax', 0, 400, 1)
        propsFold.add(props, 'htPercentMin', 0, 1, 0.01)
        propsFold.add(props, 'htPercentMax', 0, 1, 0.01)

        let folderEnv = gui.addFolder('env').onChange(init)
        folderEnv.add(envProps.vpa, '0', -800, 800, 1).name('vpa.x')
        folderEnv.add(envProps.vpa, '1', -800, 800, 1).name('vpa.y')
        folderEnv.add(envProps.vpb, '0', -800, 800, 1).name('vpb.x')
        folderEnv.add(envProps.vpb, '1', -800, 800, 1).name('vpb.y')

        let initProps = gui.addFolder('initial shape').onChange(init)
        initProps.add(shapeInitProps, 'y1', -800, 800, 1)
        initProps.add(shapeInitProps, 'y2', -800, 800, 1)
        initProps.add(shapeInitProps, 'xa', -800, 800, 1)
        initProps.add(shapeInitProps, 'xb', -800, 800, 1)
        initProps.add(shapeInitProps, 'xc', -800, 800, 1)
    }

    function getShapes(
        env: TwoPtEnvProps,
        initSides: TwoPtSidesBox,
        initProps: TwoPtShapeProps,
        dir: 'left' | 'right' = 'left'
    ) {
        let currentSides = initSides
        let currentProps = initProps
        let leftSide = currentSides.b.x
        let rightSide = currentSides.c.x

        let shapes: { props: TwoPtShapeProps; sides: TwoPtSidesBox }[] = []
        // shapes.push({ props: initProps, sides: currentSides })

        while (
            (dir === 'left' && leftSide > env.vpa[0]) ||
            (dir === 'right' && rightSide < env.vpb[0])
        ) {
            let xa: number, xb: number, xc: number, y2: number
            if (dir === 'left') {
                xa = currentProps.xb
                xb = xa - p.random(props.xChangeMin, props.xChangeMax)
                if (xb < env.vpa[0]) xb = env.vpa[0]
                xc = xa + p.random(props.xDepthMin, props.xDepthMax)
                y2 = currentSides.b.y2
            } else {
                xa = currentProps.xc
                xb = xa - p.random(props.xDepthMin, props.xDepthMax)
                xc = xa + p.random(props.xChangeMin, props.xChangeMax)
                if (xc > env.vpb[0]) xc = env.vpb[0]
                y2 = currentSides.c.y2
            }
            let htRange = Math.abs(y2 - -400)

            let y1 = y2 - p.random(htRange * props.htPercentMin, htRange * props.htPercentMax)
            const nextProps = {
                xa,
                xb,
                xc,
                y1,
                y2,
            }
            const nextSides = twoPointPerspective(nextProps, env)
            shapes.push({ props: nextProps, sides: nextSides })

            leftSide = nextSides.b.x
            rightSide = nextSides.c.x
            currentProps = nextProps
            currentSides = nextSides
        }

        return shapes.reverse()
    }

    function init() {
        try {
            let y2 = shapeInitProps.y2
            let htRange = Math.abs(y2 - -400)

            shapeInitProps.y1 =
                y2 - p.random(htRange * props.htPercentMin, htRange * props.htPercentMax)

            let initSides = twoPointPerspective(shapeInitProps, envProps)

            let rightShapes = getShapes(envProps, initSides, shapeInitProps, 'right')
            let leftShapes = getShapes(envProps, initSides, shapeInitProps, 'left')

            // let backShapes = [...leftShapes, ...rightShapes].sort((a, b) => {
            //     return a.props.y1 - b.props.y1
            // })
            shapes = [...leftShapes, ...rightShapes, { props: shapeInitProps, sides: initSides }]
        } catch (e) {
            console.log('couldnt get shapes for some reason', e)
        }
    }

    p.setup = function () {
        p.createCanvas(1200, 900)
        makeGui()

        p.strokeJoin(p.ROUND)

        init()
    }

    p.draw = function () {
        // let m = 800
        let m = [1100, 800]
        p.background(0)
        p.push()
        p.translate((p.width - m[0]) / 2, (p.height - m[1]) / 2)
        p.translate(m[0] / 2, m[1] / 2)
        p.fill(255)
        p.rect(-m[0] / 2, -m[1] / 2, m[0], m[1])

        shapes.forEach((shape) => {
            const sides = shape.sides
            drawBox({ sides, vpa: envProps.vpa, vpb: envProps.vpb, colors: pal.colors }, p)
        })

        p.strokeWeight(5).stroke(0)
        p.point(...envProps.vpa)
        p.point(...envProps.vpb)

        p.pop()
    }
})
