import p5 from 'p5'
import '../style.css'

// imagemagick crop saved images:
// magick circles-s6-4.jpg -gravity Center -crop 1200x1200+0+0 circles-s6-4-crop.jpg

new p5((p: p5) => {
    let btn
    let btns = document.querySelector('#btns')

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
        p.strokeWeight(0.5)
        p.noFill()
        p.translate(p.width / 2, p.height / 2)

        // drawings(p.random([1, 2, 3, 4, 5]))
        drawings(6)
    }

    p.mouseClicked = function (e: Event) {
        if (e.target instanceof HTMLElement && (!btns || !btns.contains(e.target))) {
            p.redraw()
        }
    }

    function drawings(style) {
        let r_radius = 0.2
        let r_yi = 0.1
        let r_xi = p.random(100, 300)

        switch (style) {
            case 1:
                r_radius = p.random(0.01, 0.09)
                r_yi = p.random(0.007, 0.01)
                for (let x = -200; x <= 200; x += 20) {
                    let ybase = -0.00003 * p.pow(x / 2 + 100, 3)

                    for (let yi = -200; yi <= 200; yi += 10) {
                        let y = ybase * p.sin(yi * r_yi)
                        p.circle(x, y, p.sin(yi * r_radius) * 5 + 5)
                    }
                }
                p.noStroke()
                p.fill(0)
                p.textAlign(p.RIGHT)
                p.text(`style: ${style}`, p.width / 2 - 10, p.height / 2 - 55)
                p.text(`r_radius: ${r_radius}`, p.width / 2 - 10, p.height / 2 - 40)
                p.text(`r_yi: ${r_yi}`, p.width / 2 - 10, p.height / 2 - 25)
                break

            case 2:
                r_radius = p.random(0.05, 0.3)
                for (let x = -200; x <= 200; x += 10) {
                    let ybase = -0.00001 * x * (x - r_xi) * (x + r_xi)
                    let y = ybase
                    let inc = 2
                    while (y < 200) {
                        p.circle(x, y, p.sin(inc * r_radius) * 5 + 5)
                        y += inc
                        inc += 1
                    }

                    y = ybase
                    let dec = 4
                    while (y > -200) {
                        p.circle(x, y, p.sin(inc * r_radius) * 5 + 5)
                        y -= dec
                        dec += 1
                    }
                }

                p.noStroke()
                p.fill(0)
                p.textAlign(p.RIGHT)
                p.text(`style: ${style}`, p.width / 2 - 10, p.height / 2 - 55)
                p.text(`r_radius: ${r_radius}`, p.width / 2 - 10, p.height / 2 - 40)
                p.text(`r_xi: ${r_xi}`, p.width / 2 - 10, p.height / 2 - 25)
                break
            case 3:
                p.strokeWeight(0.5)

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
                p.text(`style: ${style}`, p.width / 2 - 10, p.height / 2 - 55)
                p.text(`r_radius: ${r_radius}`, p.width / 2 - 10, p.height / 2 - 40)
                p.text(`r_yi: ${r_yi}`, p.width / 2 - 10, p.height / 2 - 25)

                break
            case 4:
                p.strokeWeight(0.5)
                r_radius = p.random(0.1, 0.5)
                for (let x = -200; x <= 200; x += 5) {
                    // let ybase = ((3 * p.sin(x)) / x) * 0.02
                    let ybase = x * x * x * 0.00001

                    for (let yi = 0; yi < 20; yi++) {
                        let y = ybase * p.cos(yi * 0.1) * 3
                        p.circle(x, y, p.sin(yi * r_radius) * 5 + 5)
                    }
                }
                p.noStroke()
                p.fill(0)
                p.textAlign(p.RIGHT)
                p.text(`style: ${style}`, p.width / 2 - 10, p.height / 2 - 55)
                p.text(`r_radius: ${r_radius}`, p.width / 2 - 10, p.height / 2 - 40)
                p.text(`r_radius: ${r_yi}`, p.width / 2 - 10, p.height / 2 - 25)
                break

            case 5:
                p.strokeWeight(0.5)
                r_radius = p.random(0.1, 0.5)
                r_yi = p.random(0.03, 0.1)
                for (let x = -200; x <= 200; x += 5) {
                    // let ybase = ((3 * p.sin(x)) / x) * 0.02

                    let ybase = (x - r_xi / 2) * (x - (r_xi - 150)) * (x + (r_xi - 100)) * 0.00001

                    for (let yi = 0; yi < 20; yi++) {
                        let y = ybase * p.cos(yi * r_yi) * 3
                        p.circle(x, y, p.sin(yi * r_radius - 2) * 5 + 5)
                    }
                }

                p.noStroke()
                p.fill(0)
                p.textAlign(p.RIGHT)
                p.text(`style: ${style}`, p.width / 2 - 10, p.height / 2 - 55)
                p.text(`r_radius: ${r_radius}`, p.width / 2 - 10, p.height / 2 - 40)
                p.text(`r_xi: ${r_xi}`, p.width / 2 - 10, p.height / 2 - 25)
                break
            case 6:
                p.strokeWeight(0.5)

                r_radius = p.random(0.1, 0.5)
                r_yi = p.random(0.05, 0.2)
                r_xi = p.random(80, 220)

                for (let x = -200; x <= 200; x += 20) {
                    let ybase = 0.00001 * (x - r_xi) * (x + r_xi) * x
                    for (let yi = 0; yi < 20; yi++) {
                        let y = ybase * p.cos(yi * r_yi) * 3
                        p.circle(x, y, p.cos(yi * r_radius) * 5 + 5)
                    }
                }
                p.noStroke()
                p.fill(0)
                p.textAlign(p.RIGHT)
                p.text(`style: ${style}`, p.width / 2 - 10, p.height / 2 - 55)
                p.text(`r_radius: ${r_radius}`, p.width / 2 - 10, p.height / 2 - 40)
                p.text(`r_yi: ${r_yi}`, p.width / 2 - 10, p.height / 2 - 25)
                p.text(`r_xi: ${r_xi}`, p.width / 2 - 10, p.height / 2 - 10)
                break
            default:
                break
        }
    }
})
