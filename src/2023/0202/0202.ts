// 202302

import p5 from 'p5'
import { colorUtils, shapeUtils, TrisOpts } from './hexels-helper-fns'
import '~/style.css'
import GUI from 'lil-gui'

const paletteUrls = [
    'https://coolors.co/ffedeb-320d6d-ffd447-700353-fc814a',
    'https://coolors.co/ffffff-9b7ede-fcd581-d52941-540D6E',
    'https://coolors.co/ffffff-25ced1-2c4251-f17300-B288C0',
    'https://coolors.co/1e0b16-5f0f40-9a031e-f2832e-D67AB1',
    'https://coolors.co/080708-3772ff-df2935-fdca40-e6e8e6',
]

const paletteFromUrl = (url: string) =>
    url
        .replace('https://coolors.co/', '')
        .split('-')
        .map((c) => `#${c}`)

const palettes = paletteUrls.map((url) => paletteFromUrl(url))

const Z = {
    grid: 4,
    version: 1,
}

new p5((p: p5) => {
    let palette, btn: p5.Element
    let colors: ReturnType<typeof colorUtils>
    let shapes: ReturnType<typeof shapeUtils> = shapeUtils(p)

    function makeGUI() {
        let gui = new GUI()
        gui.add(Z, 'grid', 1, 8, 1)
        gui.add(Z, 'version', [1, 2])
        gui.onChange(() => p.redraw())
    }

    p.setup = function () {
        let canvas = p.createCanvas(window.innerWidth, window.innerHeight)
        btn = p
            .createButton('save')
            .parent('btns')
            .mouseClicked(() => p.saveCanvas(canvas, 'hexagons', 'jpg'))
        p.noLoop()

        makeGUI()
    }

    p.draw = function () {
        palette = p.random(palettes).map((c: string) => c)
        colors = colorUtils(p, palette)

        p.background(palette.shift())

        let m = p.min(p.width, p.height)
        let size = m * 0.9
        let step = size / Z.grid
        let shapeSize = step * 0.25

        let c = p.createVector(0, 0)

        let pts: p5.Vector[] = []
        for (let i = 0; i < 6; i++) {
            let angle = (p.TWO_PI / 6) * i
            pts.push(p.createVector(shapeSize * p.cos(angle), shapeSize * p.sin(angle)))
        }
        // let t = p.createVector(0, -yStep)
        // let rt = p.createVector(xStep, -yStep / 2)
        // let rb = p.createVector(xStep, yStep / 2)
        // let b = p.createVector(0, yStep)
        // let lb = p.createVector(-xStep, yStep / 2)
        // let lt = p.createVector(-xStep, -yStep / 2)
        // let pts = [t, rt, rb, b, lb, lt]

        p.translate((p.width - size) / 2, (p.height - size) / 2)

        // for (let x = step / 2; x < m; x += step) {
        for (let xi = 0; xi < Z.grid; xi += 1) {
            // for (let y = step / 2; y < m; y += step) {
            for (let yi = 0; yi < Z.grid; yi += 1) {
                let x = (xi + 0.5) * step
                let y = (yi + 0.5) * step
                p.push()
                p.translate(x, y)
                p.shuffle(palette, true)
                if (Z.version === 1) {
                    design(pts, c)
                } else {
                    designMushedTogether(pts, c)
                }
                p.pop()
            }
        }
    }

    p.mouseClicked = function (e: Event) {
        if (e.target instanceof HTMLCanvasElement) p.redraw()
    }

    function design(pts: p5.Vector[], c: p5.Vector, style = -1) {
        let indexes = pts.map((_, i) => i)
        p.shuffle(indexes, true)

        if (style < 0) {
            style = p.random([1, 2, 3])
        }

        switch (style) {
            case 1:
                colors.fill(0)
                shapes.baseShape(pts)

                colors.fill(1)
                shapes.shapeMoved(pts, {
                    moveOpts: { choices: indexes[0], mult: [0.4, 1] },
                    rotate: true,
                })

                colors.stroke(2)
                shapes.shapeMoved(pts, {
                    moveOpts: { choices: indexes[1] },
                    rotate: true,
                })

                let trisOpts = {
                    scale: p.random(0.3, 0.8),
                    chance: 0.4,
                    chooseColor: () => (p.random() < 0.5 ? colors.fill(3) : colors.stroke(3)),
                }
                shapes.trisRound(pts, c, trisOpts, {
                    choices: indexes[2],
                    mult: [0.7, 1],
                })

                colors.stroke(3, 3)
                shapes.lines(pts, c, 2)
                break
            case 2:
                colors.strokeFill(2, 3, 5)
                shapes.trisRound(pts, c, {
                    translate: -0.4,
                    scale: [1.2, 1.5],
                    scaleChance: 0.5,
                    num: p.random([1, 2]),
                })

                colors.stroke(0)
                shapes.shapeMoved(pts, {
                    moveOpts: { mult: [0, 0] },
                    scale: [0.8, 1.2],
                })

                colors.fill(1)
                shapes.circles(pts, {
                    translate: p.random(0.4, 1.5),
                    radius: () => p.random(5, 15),
                    chooseColor: () => colors.fill(),
                })
                break
            case 3:
                colors.fill(0)
                shapes.trisRound(pts, c, {
                    num: 6,
                    translate: 0.5,
                    scale: 0.8,
                })

                colors.stroke(1)
                shapes.shapeMoved(pts, {
                    scale: [1, 1.3],
                    moveOpts: { mult: [0.3, 0.6] },
                })

                if (p.random() < 0.6) {
                    p.push()
                    shapes.moveCenter({ pts })
                    colors.stroke(2, 6)
                    shapes.lines(pts, c)
                    p.pop()
                }

                colors.stroke(1)
                shapes.lines(pts, c)
                break
            default:
                break
        }
    }

    function designMushedTogether(pts: p5.Vector[], c: p5.Vector) {
        let indexes = pts.map((_, i) => i)

        let steps: string[] = []
        steps.push(p.random(['tris', 'hex', 'bigTris']))
        p.random() < 0.5 && steps.push('shapeMoved')
        p.random() < 0.5 && steps.push('shapeMoved')
        p.random() < 0.5 && steps.push('thickLines')
        p.random() < 0.5 && steps.push('thinLines')
        p.random() < 0.5 && steps.push('trisMoved')
        p.random() < 0.5 && steps.push('circles')

        p.shuffle(indexes, true)

        if (steps[0] === 'hex') {
            colors.fill(0)
            shapes.baseShape(pts)

            colors.fill(1)
            shapes.shapeMoved(pts, {
                moveOpts: { choices: indexes[0] },
                rotate: true,
            })
        } else if (steps[0] === 'bigTris') {
            colors.strokeFill(0, 1, 3)
            shapes.trisRound(pts, c, {
                num: p.random([1, 2]),
                translate: -0.4,
                scale: [1.5, 1.8],
            })

            colors.stroke(2)
            shapes.shapeMoved(pts, {
                moveOpts: { choices: indexes[0] },
                rotate: true,
            })
        } else {
            colors.fill(0)
            shapes.trisRound(pts, c, {
                num: p.random([5, 6]),
                translate: 0.3,
                scale: [0.8, 0.9],
                scaleChance: 0.6,
            })
        }

        if (steps.includes('shapeMoved')) {
            colors.stroke(2)
            shapes.shapeMoved(pts, {
                moveOpts: { choices: indexes[1] },
                rotate: true,
            })
        }

        if (steps.includes('thickLines')) {
            p.push()
            shapes.moveCenter({ pts })
            colors.stroke(3, 6)
            shapes.lines(pts, c)
            p.pop()
        }

        if (steps.includes('thinLines')) {
            colors.stroke(1)
            shapes.lines(pts, c)
        }

        if (steps.includes('trisMoved')) {
            let trisOpts: TrisOpts = {
                scale: p.random(0.3, 0.8),
                num: p.random([1, 2, 3, 4]),
            }
            if (steps[0] === 'hex') {
                trisOpts.chooseColor = () => colors.fillOrStroke(2)
            } else {
                colors.fill(2)
                trisOpts.scale = p.random(0.25, 0.35)
            }

            shapes.trisRound(pts, c, trisOpts, {
                choices: indexes[2],
                mult: [0.7, 1],
            })
        }

        if (steps.includes('circles')) {
            colors.fill(2)
            shapes.circles(pts, {
                radius: p.random(8, 18),
                num: p.random([2, 3, 4]),
                translate: p.random(0.7, 1.3),
            })
        }
    }
}, document.getElementById('sketch') ?? undefined)
