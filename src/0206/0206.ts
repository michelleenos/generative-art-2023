import p5 from 'p5'
import '../style.css'

new p5((p: p5) => {
    let yMult = 0.12
    let xMult = 1.75
    let rotation = 0
    let rotation_vel = 0
    let rotation_acc = 0
    let par
    let setting = 2
    let totalWidth
    let totalHeight
    let blocks: [p5.Vector, p5.Vector, p5.Vector][][] = []
    let settings
    // let par2 = p.createP('')
    // let par3 = p.createP('')

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        if (setting === 2) {
            setGridBlocks()
            settings = []
            let i = 0
            while (i < 8) {
                settings.push([])
                let j = 0
                while (j < 8) {
                    settings[i].push(false)
                    j++
                }
                i++
            }

            console.log(settings)
            p.noLoop()
        }
        // par = p.createP('')
    }

    p.draw = function () {
        // par.html(p.round(p.frameRate()))
        p.background(20)

        if (setting === 1) {
            gridOne()
        } else if (setting === 2) {
            gridBlocks()
        }
    }

    function setGridBlocks() {
        let yStep = (p.min(p.width, p.height) * yMult) / 2
        let xStep = yStep * xMult
        totalWidth = xStep * 8
        totalHeight = yStep * 8

        for (let xi = 0; xi <= 8; xi += 1) {
            blocks[xi] = []

            for (let yi = 0; yi <= 8; yi++) {
                if ((yi % 2) + (xi % 2) === 1) {
                    blocks[xi][yi] = [
                        p.createVector(xi * xStep, yi * yStep),
                        p.createVector((xi + 1) * xStep, yi * yStep - yStep),
                        p.createVector((xi + 1) * xStep, yi * yStep + yStep),
                    ]
                } else {
                    blocks[xi][yi] = [
                        p.createVector(xi * xStep, yi * yStep - yStep),
                        p.createVector(xi * xStep, yi * yStep + yStep),
                        p.createVector((xi + 1) * xStep, yi * yStep),
                    ]
                }
            }
        }
    }

    function gridBlocks() {
        p.translate((p.width - totalWidth) / 2, (p.height - totalHeight) / 2)

        p.fill(255)
        p.noLoop()

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (settings[i][j]) {
                    tri(blocks[i][j])
                }
            }
        }
        // tri(blocks[3][5])
        // tri(blocks[4][5])
        // tri(blocks[4][3])
        // tri(blocks[4][4])
        // tri(blocks[8][2])
    }

    function gridOne(rotate = false) {
        yMult = p.map(p.sin(p.frameCount * 0.004), -1, 1, 0.1, 0.2)
        xMult = p.map(p.cos(p.frameCount * 0.005), -1, 1, 0.4, 0.9)

        let yStep = p.min(p.width, p.height) * yMult
        let xStep = yStep * xMult

        p.translate(p.width / 2, p.height / 2)
        if (rotate) {
            rotation_acc += (p.noise(p.millis() * 0.01) - 0.5) * 0.0001
            rotation_vel += rotation_acc
            rotation += rotation_vel

            rotation_acc = 0
            rotation_vel *= 0.99

            p.rotate(rotation)
        }

        let xStart = p.ceil(p.width / 2 / (xStep * 2)) * (xStep * 2)
        let yStart = p.ceil(p.height / 2 / yStep) * yStep

        p.stroke(255)
        for (let x = -xStart, xi = 0; x < xStart + xStep; x += xStep, xi++) {
            // points[xi] = []

            for (
                let y = xi % 2 === 0 ? -yStart : -yStart + yStep / 2, yi = 0;
                y < yStart + yStep;
                y += yStep, yi++
            ) {
                // points[xi].push(p.createVector(x, y))
                p.line(x, y, x - xStep, y - yStep / 2)
                p.line(x, y, x + xStep, y - yStep / 2)
                p.line(x, y, x, y - yStep)
            }
        }
    }

    function hexGrid(points, text = false) {
        p.noStroke()

        points.forEach((row, i) => {
            row.forEach((point, j) => {
                p.fill(255)
                p.circle(point.x, point.y, 3)
                if (i % 2 === 0) {
                    p.stroke(255, 100)
                    let prev1 = points[i - 1]?.[j]
                    let prev2 = points[i - 1]?.[j + 1]
                    let next1 = points[i + 1]?.[j]
                    let next2 = points[i + 1]?.[j + 1]
                    prev1 && p.line(point.x, point.y, prev1.x, prev1.y)
                    prev2 && p.line(point.x, point.y, prev2.x, prev2.y)
                    next1 && p.line(point.x, point.y, next1.x, next1.y)
                    next2 && p.line(point.x, point.y, next2.x, next2.y)
                }

                let up = points[i][j + 1]
                let down = points[i][j - 1]
                up && p.line(point.x, point.y, up.x, up.y)
                down && p.line(point.x, point.y, down.x, down.y)

                if (text) {
                    p.fill(255, 100)
                    p.noStroke()
                    p.text(`${i}, ${j}`, point.x, point.y)
                }
            })
        })
    }

    function tri([a, b, c]) {
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
