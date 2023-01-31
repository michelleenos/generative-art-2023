import p5 from 'p5'
import '../style.css'

new p5((p: p5) => {
    let rectLenP = 0.15
    let rectWidRatio = 0.25
    let sides = 3

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.angleMode(p.DEGREES)
    }

    p.draw = function () {
        p.background(0)

        p.stroke(255, 100)
        p.strokeWeight(3)
        p.noFill()

        rectWidRatio = p.constrain(p.cos(p.frameCount * 0.6) + 0.6, 0, 0.7)
        sides = p.map(p.sin(p.frameCount * 0.2), -1, 1, 3, 6)

        let rectLen = p.width * rectLenP
        let rectWid = rectLen * rectWidRatio

        let angle = 360 / sides

        let ySpace = p.round(p.abs(p.sin(angle) * rectLen), 2)
        let xSpace = p.round(p.abs(p.cos(angle) * rectLen), 2)

        let xCount = Math.floor(p.width / (xSpace + rectLen)) + 1
        let yCount = Math.floor(p.height / ySpace) + 1

        let yPos = 0
        for (let yi = 0; yi <= yCount; yi++) {
            let xPos = yi % 2 === 0 ? 0 : -xSpace

            for (let xi = 0; xi <= xCount; xi++) {
                p.push()
                p.translate(xPos, yPos)
                p.rotate(checkered(xi, yi) ? 0 : 180)

                squareStar(rectWid, rectLen, sides)
                p.pop()

                xPos += checkered(xi, yi) ? rectLen : xSpace * 2 + rectLen
            }

            yPos += ySpace
        }
    }

    const checkered = (x, y) => x % 2 === y % 2

    const squareStar = (rectWid, rectLen, sides = 3) => {
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
