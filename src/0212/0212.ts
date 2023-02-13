import p5 from 'p5'
import '../style.css'

new p5((p: p5) => {
    let btn

    p.setup = function () {
        let canvas = p.createCanvas(window.innerWidth, window.innerHeight)
        p.noLoop()
        btn = p
            .createButton('save')
            .parent('btns')
            .mouseClicked(() => p.saveCanvas(canvas, 'circles', 'jpg'))
    }

    p.draw = function () {
        p.background(230)
        p.stroke(0)
        p.noFill()
        p.translate(p.width / 2, p.height / 2)

        drawings(4)
    }

    p.mouseClicked = function (e: Event) {
        if (e.target !== btn) {
            p.redraw()
        }
    }

    function drawings(style) {
        switch (style) {
            case 1:
                for (let x = -200; x <= 200; x += 20) {
                    let ybase = -0.00001 * x * x * x
                    let y = ybase

                    y = ybase
                    let dec = 4
                    while (y > -200) {
                        p.circle(x, y * p.sin(x * 0.01), 10)
                        y -= dec
                        dec += 5
                    }
                }
                break

            case 2:
                for (let x = -200; x <= 200; x += 20) {
                    let ybase = -0.00001 * x * x * x
                    let y = ybase
                    let inc = 2
                    while (y < 200) {
                        p.circle(x, y, 10)
                        y += inc
                        inc += 2
                    }

                    y = ybase
                    let dec = 4
                    while (y > -200) {
                        p.circle(x, y, 10)
                        y -= dec
                        dec += 2
                    }
                }
                break
            case 3:
                p.strokeWeight(0.5)

                let r_radius = 0.2
                let r_yi = 0.1
                r_radius = p.random(0.1, 0.5)
                r_yi = p.random(0.05, 0.2)

                for (let x = -200; x <= 200; x += 20) {
                    let ybase = 0.00001 * p.pow(x, 3)
                    for (let yi = 0; yi < 20; yi++) {
                        let y = ybase * p.cos(yi * r_yi) * 3
                        p.circle(x, y, p.cos(yi * r_radius) * 5 + 5)
                    }
                }
                p.noStroke()
                p.fill(0)
                p.textAlign(p.RIGHT)
                p.text(`r_radius: ${r_radius}`, p.width / 2 - 10, p.height / 2 - 40)
                p.text(`r_yi: ${r_yi}`, p.width / 2 - 10, p.height / 2 - 25)
                break

            case 4:
                p.strokeWeight(0.5)

                for (let x = -200; x <= 200; x += 5) {
                    let xm = x * 0.05
                    let ybase = ((3 * p.sin(xm)) / (xm + 1)) * 30

                    for (let yi = 0; yi < 20; yi++) {
                        let y = ybase * p.sin(yi * x * 0.001)
                        p.circle(x, y, 5)
                    }
                }
                break

            default:
                break
        }
    }
})
