import p5 from 'p5'
import '../style.css'

const paletteUrls = [
    'https://coolors.co/ffedeb-320d6d-ffd447-700353',
    'https://coolors.co/ffffff-9b7ede-fcd581-d52941',
    'https://coolors.co/fffcf9-ff6978-b1ede8-6d435a',
    'https://coolors.co/ffffff-25ced1-2c4251-f17300',
    'https://coolors.co/1e0b16-5f0f40-9a031e-f2832e',
]

const paletteFromUrl = (url) =>
    url
        .replace('https://coolors.co/', '')
        .split('-')
        .map((c) => `#${c}`)

const palettes = paletteUrls.map((url) => paletteFromUrl(url))
let palette

new p5((p: p5) => {
    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.noLoop()
        palette = p.random(palettes)
        p.background(palette.shift())
        palette = p.shuffle(palette)
    }

    p.draw = function () {
        let yStep = p.min(p.width, p.height) * 0.08
        let xStep = yStep * 0.8
        let points: p5.Vector[][] = []

        // for (let x = 0, xi = 0; x < p.width; x += xStep, xi++) {
        //     points[xi] = []
        //     for (let y = xi % 2 === 0 ? 0 : -yStep / 2, yi = 0; y < p.height; y += yStep, yi++) {
        //         points[xi].push(p.createVector(x, y))
        //     }
        // }

        let len = 5
        for (let xi = 0; xi < len; xi++) {
            points[xi] = []
            for (let yi = 0; yi < len; yi++) {
                let x = xStep * (xi - 2)
                let y = xi % 2 === 0 ? yStep * (yi - 2) + yStep / 2 : yStep * (yi - 2)
                points[xi].push(p.createVector(x, y))
            }
        }

        p.translate(200, 200)
        design(points, 2, 2)
        p.translate(200, 0)
        design(points, 2, 2)

        // points.forEach((row, i) => {
        //     row.forEach((point, j) => {
        //         p.fill(255, 100)
        //         p.circle(point[0], point[1], 3)
        //         p.fill(255, 100)
        //         p.text(`${i}, ${j}`, point[0], point[1])
        //     })
        // })

        // for (let x = 2; x < points.length - 2; x += 4) {
        //     for (let y = 2; y < points[0].length - 2; y += 4) {
        //         design(points, x, y)
        //     }
        // }

        // for (let x = p.width / 4; x < p.width; x += p.width / 4) {
        //     for (let y = p.height / 4; y < p.height; y += p.height / 4) {
        //         p.push()
        //         p.translate(x, y)
        //         // designNoPoints(0, 0, xStep, yStep)
        //         design(points, 2, 2)
        //         p.pop()
        //     }
        // }
    }

    function designNoPoints(cx, cy, xStep, yStep) {
        palette = p.shuffle(palette)

        let c = p.createVector(cx, cy)
        let t = p.createVector(cx, cy - yStep)
        let b = p.createVector(cx, cy + yStep)
        let lt = p.createVector(cx - xStep, cy - yStep / 2)
        let rt = p.createVector(cx + xStep, cy - yStep / 2)
        let rb = p.createVector(cx + xStep, cy + yStep / 2)
        let lb = p.createVector(cx - xStep, cy + yStep / 2)

        let clockwise = [t, rt, rb, b, lb, lt]
        let tris = [
            [c, t, rt],
            [c, t, lt],
            [c, lt, lb],
            [c, rt, rb],
            [c, b, rb],
            [c, b, lb],
        ]

        p.fill(palette[0])
        p.stroke(palette[1])
        p.strokeWeight(3)

        let angle = p.TWO_PI / 6
        for (let i = 0; i < 6; i++) {
            // if (p.random() < 0.5) continue
            p.push()
            p.rotate(angle * i)
            // if (p.random() < 0.5) {
            //     p.translate(xStep * -0.2, yStep * -0.2)
            //     p.scale(0.8)
            // }
            tri(c, t, lt)
            p.pop()
        }

        // tris.forEach((t) => {
        //     if (p.random() < 0.5) {
        //         p.push()
        //         if (p.random() < 0.5) {
        //             p.scale(0.8)
        //         }
        //         // let scale = p.random() < 0.5 ? 0.8 : 1
        //         tri(t[0], t[1], t[2])
        //         p.pop()
        //     }
        // })

        p.noFill()
        p.stroke(palette[1])
        p.circle(c.x, c.y, 20)

        p.stroke(palette[2])
        p.line(t.x, t.y, b.x, b.y)
        // shape(clockwise)
    }

    function shape(pts) {
        p.beginShape()
        pts.forEach((pt) => {
            p.vertex(pt.x, pt.y)
        })
        p.vertex(pts[0].x, pts[0].y)
        p.endShape()
    }

    function design(points, cx, cy) {
        palette = p.shuffle(palette)

        let c = points[cx][cy]
        let t = points[cx][cy - 1]
        let b = points[cx][cy + 1]
        let lt = points[cx - 1][cy]
        let rt = points[cx + 1][cy]
        let lb = points[cx - 1][cy + 1]
        let rb = points[cx + 1][cy + 1]

        let clockwise = [t, rt, rb, b, lb, lt]
        let tris = [
            [c, t, rt],
            [c, t, lt],
            [c, lt, lb],
            [c, rt, rb],
            [c, b, rb],
            [c, b, lb],
        ]

        p.fill(palette[1])
        p.stroke(palette[2])
        p.strokeWeight(3)

        // let trans = p5.Vector.sub(t, rt).div(2)
        let trans = p5.Vector.add(t, rt)
        p.circle(trans.x, trans.y, 10)

        trans = p5.Vector.sub(b, lb).div(2)
        p.circle(trans.x, trans.y, 10)

        // tris.forEach((pts) => {
        //     p.push()
        //     // if (p.random() < 0.5) {
        //     let trans = p5.Vector.sub(pts[1], pts[2]).div(2)
        //     // p.translate(trans.x, trans.y)
        //     // p.scale(0.8)
        //     // }
        //     tri(pts[0], pts[1], pts[2])
        //     p.pop()
        // })

        p.noFill()
        p.stroke(palette[0])
        p.circle(c.x, c.y, 20)

        p.stroke(palette[2])
        p.line(t.x, t.y, b.x, b.y)

        // tri(lt, points[cx - 1][cy - 1], t)
        // tri(rt, points[cx + 1][cy - 1], t)
    }

    function tri(a, b, c) {
        p.beginShape()
        p.vertex(a.x, a.y)
        p.vertex(b.x, b.y)
        p.vertex(c.x, c.y)
        p.vertex(a.x, a.y)
        p.endShape()
    }

    function tri_left(points, px, py) {
        let one = points[px][py]
        let two = px % 2 === 0 ? points[px - 1][py + 1] : points[px - 1][py - 1]
        let thr = points[px - 1][py]
        p.beginShape()
        p.vertex(one[0], one[1])
        p.vertex(two[0], two[1])
        p.vertex(thr[0], thr[1])
        p.vertex(one[0], one[1])
        p.endShape()
    }

    function tri_right(points, px, py) {
        let one = points[px][py]
        let two = px % 2 === 0 ? points[px + 1][py + 1] : points[px + 1][py - 1]
        let thr = points[px + 1][py]
        p.beginShape()
        p.vertex(one[0], one[1])
        p.vertex(two[0], two[1])
        p.vertex(thr[0], thr[1])
        p.vertex(one[0], one[1])
        p.endShape()
    }
})
