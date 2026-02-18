import p5 from 'p5'
import '../../style.css'
import GUI from 'lil-gui'
import { random } from '~/helpers/utils'
import { getPaletteContexts, PaletteWithContext } from 'mish-bainrow'

const pals = getPaletteContexts({
    minColors: 3,
    isolateColors: true,
    useStroke: true,
})

// const paletteUrls = [
//     'https://coolors.co/247ba0-70c1b3-b2dbbf',
//     'https://coolors.co/27213c-5a352a-a33b20',
//     'https://coolors.co/381d2a-3e6990-aabd8c',
//     'https://coolors.co/1e3888-47a8bd-f5e663',
//     'https://coolors.co/d7263d-f46036-2e294e',
// ]

let palette: PaletteWithContext

const Z = {
    setting: 'noisy',
    noiseTranslate: Math.floor(random(0, 1000)),
    noiseAmp: random(0.0005, 0.003),
    squareSize: Math.floor(random(50, 150)),
    minStrips: 4,
    maxStrips: 9,
    palette: Math.floor(random(pals.length)),
}

const makeGui = () => {
    let gui = new GUI()
    gui.add(Z, 'setting', ['base', 'noisy']).onChange((setting: 'base' | 'noisy') => {
        noiseControllers.forEach((c) => {
            setting === 'base' ? c.hide() : c.show()
        })
    })
    gui.add(Z, 'squareSize', 30, 1000, 1)

    let noiseControllers = [
        gui.add(Z, 'noiseTranslate', 0, 1000, 1).decimals(0),
        gui.add(Z, 'noiseAmp', 0.0005, 0.01, 0.0001).decimals(4),
    ]

    gui.add(Z, 'minStrips', 1, 16, 1)
    gui.add(Z, 'maxStrips', 1, 15, 1)
    gui.add(Z, 'palette', 0, pals.length - 1, 1).onChange((i: number) => {
        palette = pals[i]
    })

    return gui
}

new p5((p: p5) => {
    const randomize = () => {
        Z.noiseTranslate = Math.floor(random(0, 1000))
        Z.noiseAmp = random(0.0005, 0.003)
        Z.squareSize = Math.floor(random(50, 150))
        Z.palette = Math.floor(random(pals.length))

        gui.controllersRecursive().forEach((c) => c.updateDisplay())
    }
    const gui = makeGui()
    gui.add({ randomize }, 'randomize')
    gui.onChange(() => p.redraw())

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.noLoop()
    }

    function nest(cb: () => void) {
        p.push()
        cb()
        p.pop()
    }

    function demo() {
        let rotations = [-90, 0, 90]
        let scaleX = [-1, 1]
        let scaleY = [-1, 1]

        nest(() => {
            p.translate(50, 650)

            rotations.forEach((r) => {
                nest(() => {
                    scaleX.forEach((sx) => {
                        scaleY.forEach((sy) => {
                            nest(() => {
                                p.fill(0).noStroke().text(`rotate(${r}).scale(${sx},${sy})`, 5, -5)
                                p.translate(50, 50)
                                p.rotate(r)
                                p.scale(sx, sy)
                                p.translate(-50, -50)
                                strips(100, 5, 1)
                            })
                            p.translate(150, 0)
                        })
                    })
                })

                p.translate(0, 150)
            })
        })
    }

    p.draw = function () {
        palette = pals[Z.palette]
        gui.controllersRecursive().forEach((c) => c.updateDisplay())

        p.background(palette.bg)
        p.angleMode(p.DEGREES)
        let edges = true
        let squareSize = Z.squareSize
        let xPos = squareSize * -0.5

        if (Z.setting === 'noisy') {
            p.noiseSeed(p.random())
            edges = false
        }

        p.stroke(palette.stroke || '#000').strokeWeight(3)

        while (xPos < p.width) {
            let yPos = squareSize * -0.5
            while (yPos < p.height) {
                p.push()
                p.translate(xPos, yPos)
                if (edges) p.stroke(0).fill(255).rect(0, 0, squareSize)

                let pieces = Math.floor(random(Z.minStrips, Z.maxStrips + 1))
                let chance = 1
                let rotate = p.random([0, 90]),
                    scaleX = p.random([1, -1]),
                    scaleY = p.random([1, -1])
                p.translate(squareSize / 2, squareSize / 2)
                p.rotate(rotate)
                p.scale(scaleX, scaleY)
                p.translate(-squareSize / 2, -squareSize / 2)
                const noiseVal = p.noise(
                    (xPos + Z.noiseTranslate) * Z.noiseAmp,
                    (yPos + Z.noiseTranslate) * Z.noiseAmp,
                )
                if (Z.setting === 'noisy') chance = p.map(noiseVal, 0.35, 0.6, 0, 1)

                strips(squareSize, pieces, chance)
                p.pop()

                yPos += squareSize
            }
            xPos += squareSize
        }
    }

    p.mouseClicked = function (e: Event) {
        if (e.target instanceof HTMLCanvasElement) {
            // randomize()
            Z.palette = Math.floor(random(0, pals.length))

            p.redraw()
        }
    }

    function strips(squareSize: number, pieces: number, chance = 0.5) {
        let wid = squareSize / pieces

        for (let i = 0; i < pieces; i++) {
            let fill1 = palette.colors[i % palette.colors.length]
            let fill2 = palette.colors[(i + 1) % palette.colors.length]

            if (p.random() < chance) p.fill(fill1).rect(wid * i, wid * i, squareSize - wid * i, wid)
            if (p.random() < chance) p.fill(fill2).rect(wid * i, wid * i, wid, squareSize - wid * i)
        }
    }
})
