import p5 from 'p5'
import { colorUtils, shapeUtils } from './utils'
import '../style.css'

const paletteUrls = [
    'https://coolors.co/ffedeb-320d6d-ffd447-700353-fc814a',
    'https://coolors.co/ffffff-9b7ede-fcd581-d52941-540D6E',
    'https://coolors.co/ffffff-25ced1-2c4251-f17300-B288C0',
    'https://coolors.co/1e0b16-5f0f40-9a031e-f2832e-D67AB1',
    'https://coolors.co/080708-3772ff-df2935-fdca40-e6e8e6',
]

const paletteFromUrl = (url) =>
    url
        .replace('https://coolors.co/', '')
        .split('-')
        .map((c) => `#${c}`)

const palettes = paletteUrls.map((url) => paletteFromUrl(url))
let palette, colors, shapes

new p5((p: p5) => {
    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.noLoop()
        palette = p.random(palettes)
        p.background(palette.shift())
        palette = p.shuffle(palette)
        colors = colorUtils(p, palette)
        shapes = shapeUtils(p)
    }

    p.draw = function () {
        let yStep = p.min(p.width, p.height) * 0.08
        let xStep = yStep * 0.8
        let points: p5.Vector[][] = []

        let len = 5
        for (let xi = 0; xi < len; xi++) {
            points[xi] = []
            for (let yi = 0; yi < len; yi++) {
                let x = xStep * (xi - 2)
                let y = xi % 2 === 1 ? yStep * (yi - 2) + yStep / 2 : yStep * (yi - 2)
                points[xi].push(p.createVector(x, y))
            }
        }

        for (let x = p.width * 0.25; x < p.width; x += p.width * 0.25) {
            for (let y = p.height * 0.25; y < p.height; y += p.height * 0.25) {
                p.push()
                p.translate(x, y)
                design(points, 2, 2)
                p.pop()
            }
        }
    }

    function design(points, cx, cy) {
        palette = p.shuffle(palette)

        let c = points[cx][cy]
        let t = points[cx][cy - 1]
        let b = points[cx][cy + 1]
        let lt = points[cx - 1][cy - 1]
        let rt = points[cx + 1][cy - 1]
        let lb = points[cx - 1][cy]
        let rb = points[cx + 1][cy]

        let pts = [t, rt, rb, b, lb, lt]

        if (p.random() < 1) {
            shapes.trisRound(pts, c)
            // colors.fill(0)
            // shapes.baseShape(pts)

            // colors.stroke(1)
            // shapes.shapeMoved(pts)

            // colors.fill(3)
            // shapes.shapeMoved(pts)

            // colors.stroke(2)
            // trisRound(pts, c, { translate: 0.2, chance: 0.4, scale: [0.4, 0.7], scaleChance: 0.7 })

            // colors.strokeFill()
            // p.circle(0, 0, 20)
        } else {
            let indexes = pts.map((_, i) => i)
            p.shuffle(indexes, true)

            colors.fill(1)
            shapes.shapeMoved(pts, { iToMove: indexes.pop() })

            colors.stroke(0)
            shapes.baseShape(pts)

            colors.fill(3)
            shapes.shapeMoved(pts, { iToMove: indexes.pop() })

            colors.fill(2)
            trisMoved(pts, c)
        }
    }

    function lines(pts) {
        for (let i = 0; i < 3; i++) {
            if (p.random() > 0.6) continue
            let one = pts[i]
            let two = pts[i + 3]
            p.line(one.x, one.y, two.x, two.y)
        }
    }

    function circles(pts, c) {
        for (let i = 0; i < pts.length; i++) {
            if (p.random() > 0.2) continue
            colors.fill()
            p.circle(pts[i].x, pts[i].y, 15)
        }
    }

    function trisMoved(pts, center, { scale = [0.3, 0.5] } = {}) {
        let scaleVal = p.random(scale[0], scale[1])
        p.push()
        shapes.moveCenter(pts, { mult: [0.4, 0.8] })
        shapes.trisRound(pts, center, { translate: 0.3, chance: 0.4, scale: scaleVal, scaleChance: 1 })
        p.pop()
    }
})
