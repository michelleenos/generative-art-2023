// 202302

import p5 from 'p5'
import { colorUtils, shapeUtils, TrisOpts } from './hexels-helper-fns'
import '~/style.css'
import GUI from 'lil-gui'
import { random } from '~/helpers/utils'
import { getPaletteContexts, PaletteWithContext } from 'mish-bainrow'

const pals = getPaletteContexts({
    includePalettes: ['valen', 'glowFish', 'market', 'neopolito', 'mondri'],
    maxColors: 5,
    isolateColors: true,
    useStroke: false,
    bgShade: {
        type: 'edge',
        lumEdge: 0.2,
        maxSaturation: 80,
    },
})

const paletteUrls = [
    'https://coolors.co/ffedeb-320d6d-ffd447-700353-fc814a',
    'https://coolors.co/ffffff-9b7ede-fcd581-d52941-540D6E',
    'https://coolors.co/ffffff-25ced1-2c4251-f17300-B288C0',
    'https://coolors.co/1e0b16-5f0f40-9a031e-f2832e-D67AB1',
    'https://coolors.co/080708-3772ff-df2935-fdca40-e6e8e6',
]

const Z = {
    grid: 3,
    version: 2,
    sides: 6,
    palette: Math.floor(random(pals.length)),
}

new p5(
    (p: p5) => {
        let palette: PaletteWithContext
        let colors: ReturnType<typeof colorUtils>
        let shapes: ReturnType<typeof shapeUtils> = shapeUtils(p)

        const gui = new GUI()
        const f = gui.addFolder('params')
        f.add(Z, 'grid', 1, 8, 1)
        f.add(Z, 'sides', 3, 12, 1)
        const palControl = f.add(Z, 'palette', 0, pals.length, 1)
        f.add(Z, 'version', [1, 2, 3])
        f.onChange(() => p.redraw())

        function showPalettes() {
            p.fill(255).rect(0, 0, p.width, p.height)
            console.log(pals.length, pals)
            let mh = p.height * 0.9
            let mw = p.width * 0.9
            p.push()

            let half = Math.ceil(pals.length / 2)

            p.translate((p.width - mw) / 2, (p.height - mh) / 2)
            let disty = mh / half
            let wd = mw * 0.48
            let ht = disty * 0.9
            pals.forEach((pal, i) => {
                const { bg, colors, name } = pal
                p.push()
                p.translate(i >= half ? mw * 0.5 : 0, (i >= half ? i - half : i) * disty)
                p.fill(bg).rect(0, 0, wd, ht)
                let gap = wd * 0.02
                let cw = (wd * 0.9 - gap * (colors.length - 1)) / colors.length
                p.translate(wd * 0.05, 0)
                colors.forEach((c, i) => {
                    p.push()
                    p.fill(c).noStroke()
                    p.translate(cw * i + gap * i, 0)
                    p.rect(0, ht * 0.1, cw, ht * 0.8)
                    p.pop()
                })

                p.pop()
            })

            p.pop()
        }

        p.setup = function () {
            let canvas = p.createCanvas(window.innerWidth, window.innerHeight)
            p.createButton('save')
                .parent('btns')
                .mouseClicked(() => p.saveCanvas(canvas, 'hexels', 'jpg'))
            p.noLoop()
        }

        p.draw = function () {
            palette = pals[Z.palette]
            colors = colorUtils(p, palette.colors)

            p.background(palette.bg)

            let m = p.min(p.width, p.height)
            let size = m * 0.9
            let step = size / Z.grid
            let shapeSize = step * 0.25

            let pts: p5.Vector[] = []
            for (let i = 0; i < Z.sides; i++) {
                let angle = (p.TWO_PI / Z.sides) * i
                pts.push(p.createVector(shapeSize * p.cos(angle), shapeSize * p.sin(angle)))
            }

            p.push()
            p.translate((p.width - size) / 2, (p.height - size) / 2)

            for (let xi = 0; xi < Z.grid; xi += 1) {
                for (let yi = 0; yi < Z.grid; yi += 1) {
                    let x = (xi + 0.5) * step
                    let y = (yi + 0.5) * step
                    p.push()
                    p.translate(x, y)
                    p.shuffle(palette.colors, true)
                    if (Z.version === 1) {
                        design(pts)
                    } else if (Z.version === 2) {
                        designMushedTogether(pts)
                    } else if (Z.version === 3) {
                        p.random() < 0.5 ? design(pts) : designMushedTogether(pts)
                    }
                    p.pop()
                }
            }

            p.pop()
        }

        p.mouseClicked = function (e: Event) {
            if (e.target instanceof HTMLCanvasElement) {
                Z.palette = Math.floor(random(0, pals.length))
                palControl.updateDisplay()
                p.redraw()
            }
        }

        function design(pts: p5.Vector[], style = -1) {
            let indexes = pts.map((_, i) => i)
            let len = pts.length
            p.shuffle(indexes, true)

            if (style < 0) {
                style = p.random([1, 2, 3])
            }

            switch (style) {
                case 1:
                    colors.fill(0)
                    shapes.shape(pts, { scale: [0.8, 1.2] }, { dist: [0, 0.2] })

                    let ind = p.floor(p.random(len))
                    colors.fill(1)
                    shapes.shape(
                        pts,
                        { rotate: p.random() > 0.5, scale: [0.4, 0.6] },
                        { moveToIndex: ind, dist: [0.4, 1] },
                    )

                    colors.stroke(2)
                    shapes.shape(pts, { rotate: true }, { moveToIndex: (ind + 1) % len })

                    let triScaleBase = p.random(0.3, 0.75)
                    shapes.trisRound(
                        pts,
                        {
                            scaleBase: triScaleBase,
                            colorFn: () => (p.random() < 0.5 ? colors.fill(3) : colors.stroke(3)),
                        },
                        {
                            moveToIndex: (ind + 3) % len,
                            dist: triScaleBase > 0.65 ? [0.6, 0.7] : [0.7, 0.9],
                        },
                    )

                    colors.stroke(1, 3)
                    shapes.lines(pts, { num: 2 })
                    break
                case 2:
                    colors.strokeFill(0, 1, 5)
                    shapes.trisRound(pts, {
                        translate: -0.4,
                        scaleBase: 1.5,
                        num: p.random([1, 2]),
                    })

                    colors.stroke(2)
                    shapes.shape(pts, {
                        scale: [0.8, 1.2],
                    })

                    colors.fill(3)
                    shapes.circles(
                        pts,
                        {
                            translate: p.random(0.6, 1.2),
                            radius: () => p.random(10, 25),
                            num: p.random([2, 3, 4, 5]),
                        },
                        { dist: [0.2, 0.4] },
                    )
                    break
                case 3:
                    colors.fill(0)
                    shapes.trisRound(pts, {
                        num: p.random([4, 5, 6]),
                        translate: 0.3,
                        scaleBase: 0.8,
                    })

                    colors.stroke(1)
                    shapes.shape(pts, { scale: [0.8, 1.3] }, { dist: [0.3, 0.6] })

                    if (p.random() < 0.8) {
                        colors.stroke(2, 6)
                        shapes.lines(pts, {}, { dist: [0.2, 0.8] })
                    }

                    colors.stroke(3)
                    shapes.lines(pts)
                    break
                default:
                    break
            }
        }

        function designMushedTogether(pts: p5.Vector[]) {
            let indexes = pts.map((_, i) => i)

            let steps: string[] = []
            steps.push(p.random(['tris', 'hex', 'bigTris']))

            p.shuffle(indexes, true)

            if (steps[0] === 'hex') {
                colors.fill(1)
                shapes.shape(pts, { scale: 1 }, { dist: [0, 0.2] })

                colors.fill(0)
                shapes.shape(pts, { rotate: true, scale: [0.5, 0.8] }, { moveToIndex: indexes[0] })
            } else if (steps[0] === 'bigTris') {
                colors.strokeFill(1, 0, 3)
                shapes.trisRound(pts, {
                    num: p.random([1, 2]),
                    translate: -0.4,
                    scaleBase: 1.5,
                    scaleAlt: 1.8,
                    scaleAltChance: 0.5,
                })
            } else if (steps[0] === 'tris') {
                colors.fill(0)
                shapes.trisRound(pts, {
                    num: p.random([5, 6]),
                    translate: 0.3,
                    scaleBase: 0.8,
                    scaleAlt: 0.9,
                    scaleAltChance: 0.6,
                })
            }

            if (steps[0] === 'bigTris' || p.random() < 0.5) {
                steps.push('shapeOutline')
                colors.stroke(2)
                shapes.shape(pts, { rotate: true }, { dist: [0.4, 0.7] })
            }

            if (steps.length < 2 || p.random() < 0.5) {
                steps.push('thickLines')
                colors.stroke(3, 7)
                shapes.lines(pts, { num: p.random([3, 4, 5]) }, { dist: [0.2, 0.8] })
            }

            if (p.random() < 0.5) {
                steps.push('thinLines')
                colors.stroke(2)
                shapes.lines(pts)
            }

            if (p.random() < 0.5) {
                steps.push('trisRound')
                let trisOpts: TrisOpts = {
                    scaleBase: p.random(0.4, 0.8),
                    num: p.random([1, 2, 3, 4]),
                }
                if (steps[0] === 'hex') {
                    trisOpts.colorFn = () => colors.fillOrStroke(2)
                } else if (steps[0] === 'bigTris') {
                    colors.fill(1)
                    trisOpts.scaleBase = p.random(0.25, 0.6)
                } else {
                    colors.fill(1)
                    trisOpts.scaleBase = p.random(0.25, 0.35)
                }

                shapes.trisRound(pts, trisOpts, {
                    moveToIndex: indexes[2],
                    dist: [0.4, 1],
                })
            }

            if (steps.length < 5 && p.random() < 0.5) {
                steps.push('circles')
                colors.fill(2)
                shapes.circles(pts, {
                    radius: p.random(12, 18),
                    num: p.random([2, 3, 4]),
                    translate: p.random(0.7, 1.3),
                })
            }

            if (steps.length < 3 || (steps.length === 3 && p.random() < 0.5)) {
                steps.push('shape')
                colors.strokeFill(2, 1, 3)
                shapes.shape(
                    pts,
                    {
                        scale: [0.2, 0.6],
                    },
                    { dist: [0.3, 0.7] },
                )
            }

            // p.fill(0).noStroke().text(steps.join('\n '), -100, 0, 100)
        }

        function designTest(pts: p5.Vector[]) {
            colors.fill(0)
            shapes.shape(pts)
            colors.fill(2)
            shapes.trisRound(pts, { num: 3 })
            colors.stroke(3)
            shapes.circles(pts, { radius: Math.floor(random(10, 50)), num: 6 })
        }
    },
    document.getElementById('sketch') ?? undefined,
)
