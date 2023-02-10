import p5 from 'p5'
import '~/style.css'

new p5((p: p5) => {
    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)

        p.noLoop()
    }

    p.draw = function () {
        p.stroke(255)
        p.noFill()

        p.translate(p.width / 2, p.height / 2)

        axis()
    }

    function axis(step = 50, size = 300) {
        p.textAlign(p.CENTER)
        p.line(-size, 0, size, 0)
        p.line(0, -size, 0, size)

        for (let i = 50; i <= size - step; i += step) {
            p.stroke(255)
            p.noFill()
            p.line(i, -5, i, 5)
            p.line(-i, -5, -i, 5)
            p.line(-5, i, 5, i)
            p.line(-5, -i, 5, -i)

            p.fill(255)
            p.noStroke()
            p.text(i, i, 14)
            p.text(`-${i}`, -i, 14)
            p.text(i, -14, i)
            p.text(-i, -14, -i)
        }
    }
})
