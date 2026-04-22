// 202302

import GUI from 'lil-gui'
import { getPaletteVariants, PaletteVariant } from 'mish-bainrow'
import p5 from 'p5'
import { random } from '~/helpers/utils'
import '~/style.css'
import { HexelsUtils, TrisOpts } from './hexels-helper-fns'

const pals = getPaletteVariants({
    includePalettes: ['valen', 'glowFish', 'market', 'neopolito', 'mondri'],
    minColors: 4,
    isolateColors: true,
    useStroke: false,
    minContrastBg: 2,
    bgShade: {
        type: 'edge',
        edge: 20,
    },
})

const Z = {
    grid: 3,
    version: 2,
    sides: 6,
    palette: Math.floor(random(pals.length)),
}

new p5(
    (p: p5) => {
        let palette: PaletteVariant
        // let shapes: ReturnType<typeof shapeUtils> = shapeUtils(p)
        let h: HexelsUtils

        const gui = new GUI()
        const f = gui.addFolder('params')
        f.add(Z, 'grid', 1, 8, 1)
        f.add(Z, 'sides', 3, 12, 1)
        const palControl = f.add(Z, 'palette', 0, pals.length - 1, 1)
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

            h = new HexelsUtils(p, pts, palette.colors)

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
                    h.fill(0).shape(pts, { scale: [0.8, 1.2] }, { dist: [0, 0.2] })

                    let ind = p.floor(p.random(len))
                    h.fill(1).shape(
                        { rotate: p.random() > 0.5, scale: [0.4, 0.6] },
                        { moveToIndex: ind, dist: [0.4, 1] },
                    )

                    h.stroke(2).shape(pts, { rotate: true }, { moveToIndex: (ind + 1) % len })

                    let triScaleBase = p.random(0.3, 0.75)
                    h.trisRound(
                        {
                            scaleBase: triScaleBase,
                            colorFn: () => (p.random() < 0.5 ? h.fill(3) : h.stroke(3)),
                        },
                        {
                            moveToIndex: (ind + 3) % len,
                            dist: triScaleBase > 0.65 ? [0.6, 0.7] : [0.7, 0.9],
                        },
                    )

                    h.stroke(1, 3).lines({ num: 2 })
                    break
                case 2:
                    h.strokeFill(0, 1, 5).trisRound({
                        translate: -0.4,
                        scaleBase: 1.5,
                        num: p.random([1, 2]),
                    })

                    h.stroke(2).shape({ scale: [0.8, 1.2] })

                    h.fill(3).circles(
                        {
                            translate: p.random(0.6, 1.2),
                            radius: () => p.random(10, 25),
                            num: p.random([2, 3, 4, 5]),
                        },
                        { dist: [0.2, 0.4] },
                    )
                    break
                case 3:
                    h.fill(0).trisRound({
                        num: p.random([4, 5, 6]),
                        translate: 0.3,
                        scaleBase: 0.8,
                    })

                    h.stroke(1).shape({ scale: [0.8, 1.3] }, { dist: [0.3, 0.6] })

                    if (p.random() < 0.8) {
                        h.stroke(2, 6).lines({}, { dist: [0.2, 0.8] })
                    }

                    h.stroke(3).lines()
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
                h.fill(1).shape({ scale: 1 }, { dist: [0, 0.2] })
                h.fill(0).shape({ rotate: true, scale: [0.5, 0.8] }, { moveToIndex: indexes[0] })
            } else if (steps[0] === 'bigTris') {
                h.strokeFill(1, 0, 3).trisRound({
                    num: p.random([1, 2]),
                    translate: -0.4,
                    scaleBase: 1.5,
                    scaleAlt: 1.8,
                    scaleAltChance: 0.5,
                })
            } else if (steps[0] === 'tris') {
                h.fill(0).trisRound({
                    num: p.random([5, 6]),
                    translate: 0.3,
                    scaleBase: 0.8,
                    scaleAlt: 0.9,
                    scaleAltChance: 0.6,
                })
            }

            if (steps[0] === 'bigTris' || p.random() < 0.5) {
                steps.push('shapeOutline')
                h.stroke(2).shape(pts, { rotate: true }, { dist: [0.4, 0.7] })
            }

            if (steps.length < 2 || p.random() < 0.5) {
                steps.push('thickLines')
                h.stroke(3, 7).lines({ num: p.random([3, 4, 5]) }, { dist: [0.2, 0.8] })
            }

            if (p.random() < 0.5) {
                steps.push('thinLines')
                h.stroke(2).lines()
            }

            if (p.random() < 0.5) {
                steps.push('trisRound')
                let trisOpts: TrisOpts = {
                    scaleBase: p.random(0.4, 0.8),
                    num: p.random([1, 2, 3, 4]),
                }
                if (steps[0] === 'hex') {
                    trisOpts.colorFn = () => h.fillOrStroke(2)
                } else if (steps[0] === 'bigTris') {
                    h.fill(1)
                    trisOpts.scaleBase = p.random(0.25, 0.6)
                } else {
                    h.fill(1)
                    trisOpts.scaleBase = p.random(0.25, 0.35)
                }

                h.trisRound(trisOpts, {
                    moveToIndex: indexes[2],
                    dist: [0.4, 1],
                })
            }

            if (steps.length < 5 && p.random() < 0.5) {
                steps.push('circles')
                h.fill(2).circles({
                    radius: p.random(12, 18),
                    num: p.random([2, 3, 4]),
                    translate: p.random(0.7, 1.3),
                })
            }

            if (steps.length < 3 || (steps.length === 3 && p.random() < 0.5)) {
                steps.push('shape')
                h.strokeFill(2, 1, 3).shape(
                    {
                        scale: [0.2, 0.6],
                    },
                    { dist: [0.3, 0.7] },
                )
            }

            // p.fill(0).noStroke().text(steps.join('\n '), -100, 0, 100)
        }

        // function designTest(pts: p5.Vector[]) {
        //     colors.fill(0)
        //     shapes.shape(pts)
        //     colors.fill(2)
        //     shapes.trisRound(pts, { num: 3 })
        //     colors.stroke(3)
        //     shapes.circles(pts, { radius: Math.floor(random(10, 50)), num: 6 })
        // }
    },
    document.getElementById('sketch') ?? undefined,
)
