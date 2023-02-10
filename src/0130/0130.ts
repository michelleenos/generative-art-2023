import p5 from 'p5'
import '../style.css'

new p5((p: p5) => {
    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)

        p.noLoop()
    }

    p.draw = function () {
        p.fill(255)
        p.noStroke()

        let squareSize = p.min(p.width, p.height) * 0.2
        let xPos = squareSize * -0.5

        while (xPos < p.width) {
            let yPos = squareSize * -0.5
            let yi = 0
            while (yPos < p.height) {
                p.push()
                p.translate(xPos, yPos)
                p.strokeWeight(7)
                p.stroke(0)
                p.fill(255)
                p.rect(0, 0, squareSize, squareSize)

                p.strokeWeight(3)
                p.fill(200, 100, 255)

                let pieces = p.floor(p.random(4, 8))

                strips(
                    squareSize,
                    pieces,
                    p.random(['a', 'b', 'c', 'd', 'a-alt', 'b-alt', 'c-alt', 'd-alt'])
                )

                p.pop()

                yPos += squareSize
                yi++
            }
            xPos += squareSize
        }
    }

    function strips(squareSize, pieces, style = 'a') {
        let wid = squareSize / pieces
        p.stroke(0)
        p.strokeWeight(3)
        p.fill(200, 100, 255)

        for (let i = 0; i < pieces; i++) {
            switch (style) {
                case 'a':
                    p.rect(wid * i, wid * i, squareSize - wid * i, wid)
                    p.rect(wid * i, wid * i, wid, squareSize - wid * i)
                    break
                case 'a-alt':
                    p.rect(wid * i, wid * i, wid, squareSize - wid * i)
                    p.rect(wid * i, wid * i, squareSize - wid * i, wid)
                    break
                case 'b':
                    p.rect(squareSize - wid * (i + 1), 0, wid, squareSize - wid * i)
                    p.rect(0, squareSize - wid * (i + 1), squareSize - wid * i, wid)
                    break
                case 'b-alt':
                    p.rect(0, squareSize - wid * (i + 1), squareSize - wid * i, wid)
                    p.rect(squareSize - wid * (i + 1), 0, wid, squareSize - wid * i)
                    break
                case 'c':
                    p.rect(wid * i, squareSize - wid * (i + 1), squareSize - wid * i, wid)
                    p.rect(wid * i, 0, wid, squareSize - wid * i)
                    break
                case 'c-alt':
                    p.rect(wid * i, 0, wid, squareSize - wid * i)
                    p.rect(wid * i, squareSize - wid * (i + 1), squareSize - wid * i, wid)
                    break
                case 'd':
                    p.rect(squareSize - wid * (i + 1), wid * i, wid, squareSize - wid * i)
                    p.rect(0, wid * i, squareSize - wid * i, wid)
                    break
                case 'd-alt':
                    p.rect(0, wid * i, squareSize - wid * i, wid)
                    p.rect(squareSize - wid * (i + 1), wid * i, wid, squareSize - wid * i)
                default:
                    break
            }
        }
    }
})
