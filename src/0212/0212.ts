import p5 from 'p5'
import '../style.css'

new p5((p: p5) => {
    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.noLoop()
    }

    p.draw = function () {
        p.background(230)
        p.stroke(0)
        p.noFill()
        p.translate(p.width / 2, p.height / 2)
        // for (let j = 1; j < 20; j++) {
        //     for (let x = -200; x <= 200; x += 20) {
        //         let y = x * x * -0.01 + 50
        //         p.circle(x, y, 2 + 20 * p.sin(j * 5 + 1))
        //     }
        // }

        for (let x = -200; x <= 200; x += 20) {
            let ybase = -0.00001 * x * x * x
            let y = ybase
            let inc = 4
            while (y < 200) {
                // p.circle(x, y, 10)
                y += inc
                inc += 5
            }

            y = ybase
            let dec = 4
            while (y > -200) {
                p.circle(x, y * p.sin(x * 0.01), 10)
                y -= dec
                dec += 5
            }
        }
    }
})
