// 20230128
import p5 from 'p5'
import '~/style.css'
import easings from '~/helpers/easings'
import GUI from 'lil-gui'

const P = {
    sidesMin: 3,
    sidesMax: 6,
    rectSize: 0.2,
    showNotCheckered: true,
    showCheckered: true,
    speedSize: 0.8,
    speedSides: 0.1,
    paused: false,
    stepSides: false,
    showCenters: false,
    multX: 3,
    multY: 1,
}

const makeGUI = () => {
    let gui = new GUI()
    gui.add(P, 'rectSize', 0, 1, 0.01)
    gui.add(P, 'showCheckered')
    gui.add(P, 'showNotCheckered')
    gui.add(P, 'showCenters')

    let sides = gui.addFolder('Sides')
    sides.add(P, 'sidesMin', 3, 10)
    sides.add(P, 'sidesMax', 3, 10)
    sides.add(P, 'speedSides', 0, 1, 0.001)
    sides.add(P, 'stepSides')
}

new p5((p: p5) => {
    makeGUI()
    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.angleMode(p.DEGREES)
    }

    p.draw = function () {
        p.background(0)

        p.stroke(255)
        p.strokeWeight(2)
        p.noFill()

        let sides
        let sidesProgress = p.fract(p.millis() * 0.001 * P.speedSides)
        let centersProgress = p.fract(p.millis() * 0.001 * P.speedSides * 2)

        if (P.paused) {
            sides = P.sidesMin
        } else if (P.stepSides) {
            sides = p.floor(sidesProgress * (P.sidesMax - P.sidesMin + 1) + P.sidesMin)
        } else {
            let sidesCycProgress = easings.inCubic(p.sin(sidesProgress * 180))
            sides = p.map(sidesCycProgress, 0, 1, P.sidesMin, P.sidesMax)
        }

        let rectLen = p.width * P.rectSize
        let rectWid = 0

        let angle = 360 / sides
        let ySpace = p.round(p.abs(p.sin(angle) * rectLen), 2)
        let xSpace = p.round(p.abs(p.cos(angle) * rectLen), 2)

        let xCount = Math.floor(p.width / (xSpace + rectLen)) + 1
        let yCount = Math.floor(p.height / ySpace) + 1

        let yPos = 0
        for (let yi = 0; yi <= yCount + 2; yi++) {
            let xPos = yi % 2 === 0 ? 0 : -xSpace

            for (let xi = 0; xi <= xCount + 2; xi++) {
                let isCheckered = checkered(xi, yi)

                let xPos2 =
                    xPos +
                    p.cos(angle) * P.multX * rectLen * centersProgress * (isCheckered ? 1 : -1)
                let yPos2 =
                    yPos +
                    p.sin(angle) * P.multY * rectLen * centersProgress * (isCheckered ? 1 : -1)

                p.push()
                p.translate(xPos2, yPos2)
                p.rotate(isCheckered ? 0 : 180)
                if (isCheckered && P.showCheckered) {
                    squareStar(rectWid, rectLen, sides)
                } else if (!isCheckered && P.showNotCheckered) {
                    squareStar(rectWid, rectLen, sides)
                }
                p.pop()

                if (P.showCenters) {
                    if ((isCheckered && P.showCheckered) || (!isCheckered && P.showNotCheckered)) {
                        p.push()
                        p.translate(xPos2, yPos2)
                        p.fill(isCheckered ? 'red' : 'green')
                        p.noStroke()
                        p.circle(0, 0, 20)
                        p.pop()
                    }
                }

                xPos += isCheckered ? rectLen : xSpace * 2 + rectLen
            }

            yPos += ySpace
        }
    }

    const checkered = (x: number, y: number) => x % 2 === y % 2

    const squareStar = (rectWid: number, rectLen: number, sides = 3) => {
        let angle = 360 / sides
        let i = 0
        while (i < sides) {
            p.push()
            p.rotate(i * angle)
            p.rect(0, -rectWid / 2, rectLen, rectWid)
            p.pop()
            i++
        }
    }
})
