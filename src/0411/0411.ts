import p5 from 'p5'
import '../style.css'

let colors = [[1, 60, 50]]
let SHAPES = true

new p5((p: p5) => {
    let btns = document.querySelector('#btns')
    let size

    function sheetOuter(x, y, w, h) {
        p.vertex(0, 0)
        p.vertex(size, 0)
        p.vertex(size, size)
        p.vertex(0, size)
    }

    function sheet_arcs(x, y, w, h, n = 5) {
        p.push()
        p.beginShape()
        sheetOuter(x, y, w, h)

        let gridx = w / n
        let gridy = h / n
        let radius = p.min(gridx, gridy) * 0.45

        let cpdist = (radius * 4 * (Math.sqrt(2) - 1)) / 3

        for (let x = 0; x < n; x++) {
            for (let y = 0; y < n; y++) {
                let dx = (x + 0.5) * gridx
                let dy = (y + 0.5) * gridy

                let pt1_cp1 = p.createVector(dx + radius, dy)
                let pt1_cp2 = p.createVector(dx + radius, dy - radius)

                let pt2_cp1 = p.createVector(dx - cpdist, dy - radius)
                let pt2_cp2 = p.createVector(dx + cpdist, dy - radius)

                SHAPES ? p.beginShape() : p.beginContour()
                p.vertex(dx + radius, dy)
                p.bezierVertex(pt1_cp1.x, pt1_cp1.y, pt1_cp2.x, pt1_cp2.y, dx, dy - radius)
                // p.bezierVertex(pt2_cp1.x, pt2_cp1.y, pt2_cp2.x, pt2_cp2.y, dx, dy - radius)

                SHAPES ? p.endShape() : p.endContour()

                p.circle(pt1_cp1.x, pt1_cp1.y, 5)
                p.text('1', pt1_cp1.x - 7, pt1_cp1.y - 5)
                p.circle(pt1_cp2.x, pt1_cp2.y, 5)

                p.push()
                p.fill(20, 50, 50)
                p.circle(pt2_cp1.x, pt2_cp1.y, 5)
                p.text('1', pt2_cp1.x - 7, pt2_cp1.y - 5)
                p.circle(pt2_cp2.x, pt2_cp2.y, 5)
                p.pop()
            }
        }

        p.endShape()
    }

    function sheet_squares(x, y, w, h, n = 5) {
        p.beginShape()
        sheetOuter(x, y, w, h)

        let gridx = w / n
        let gridy = h / n
        let side = p.min(gridx, gridy) * 0.8

        for (let x = 0; x < n; x++) {
            for (let y = 0; y < n; y++) {
                let dx = (x + 0.5) * gridx
                let dy = (y + 0.5) * gridy
                p.beginContour()
                p.vertex(dx - side / 2, dy - side / 2)
                p.vertex(dx - side / 2, dy + side / 2)
                p.vertex(dx + side / 2, dy + side / 2)
                p.vertex(dx + side / 2, dy - side / 2)
                p.endContour()
            }
        }

        p.endShape()
    }

    p.setup = function () {
        let canvas = p.createCanvas(window.innerWidth, window.innerHeight)
        p.noLoop()
        p.colorMode(p.HSL)
        size = p.min(p.width, p.height) * 0.8
    }

    p.draw = function () {
        p.translate((p.width - size) / 2, (p.height - size) / 2)

        p.fill(colors[0])
        sheet_arcs(0, 0, size, size, 5)
    }

    p.mouseClicked = function (e: Event) {
        if (e.target instanceof HTMLElement && (!btns || !btns.contains(e.target))) {
            p.redraw()
        }
    }
})
