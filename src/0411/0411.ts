import p5 from 'p5'
import '../style.css'

new p5((p: p5) => {
    let btns = document.querySelector('#btns')
    let size

    p.setup = function () {
        let canvas = p.createCanvas(window.innerWidth, window.innerHeight)
        p.noLoop()
        p.colorMode(p.HSB)
        size = p.min(p.width, p.height) * 0.8
    }

    p.draw = function () {
        p.translate((p.width - size) / 2, (p.height - size) / 2)
        p.stroke(300, 100, 100)
        p.beginShape()
        // Exterior part of shape, clockwise winding
        p.vertex(0, 0)
        p.vertex(size, 0)
        p.vertex(size, size)
        p.vertex(0, size)
        // Interior part of shape, counter-clockwise winding

        let mid = size * 0.2
        p.beginContour()
        p.vertex(mid, mid)
        p.vertex(mid, size - mid)
        p.vertex(size - mid, size - mid)
        p.vertex(size - mid, mid)
        p.endContour()

        p.endShape(p.CLOSE)
    }

    p.mouseClicked = function (e: Event) {
        if (e.target instanceof HTMLElement && (!btns || !btns.contains(e.target))) {
            p.redraw()
        }
    }
})
