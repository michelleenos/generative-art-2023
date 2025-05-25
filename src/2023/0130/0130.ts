import p5 from 'p5'
import '../../style.css'
import GUI from 'lil-gui'

const paletteUrls = [
    'https://coolors.co/247ba0-70c1b3-b2dbbf',
    'https://coolors.co/27213c-5a352a-a33b20',
    'https://coolors.co/381d2a-3e6990-aabd8c',
    'https://coolors.co/1e3888-47a8bd-f5e663',
    'https://coolors.co/d7263d-f46036-2e294e',
]

const paletteFromUrl = (url: string) =>
    url
        .replace('https://coolors.co/', '')
        .split('-')
        .map((c) => `#${c}`)

const palettes = paletteUrls.map((p) => paletteFromUrl(p))

let palette: string[]
// let setting = 'base'
let btns = document.getElementById('btns')

new p5((p: p5) => {
    const Z = {
        setting: 'noisy',
        noiseTranslate: p.floor(p.random(0, 1000)),
        noiseMult: p.random(0.0005, 0.003),
        // squareSizeMult: 0.08,
        squareSizeMult: p.random(0.05, 0.1),
    }

    const makeGui = () => {
        let gui = new GUI()
        gui.add(Z, 'setting', ['base', 'noisy']).onChange((setting: 'base' | 'noisy') => {
            noiseControllers.forEach((c) => {
                setting === 'base' ? c.hide() : c.show()
            })
        })
        gui.add(Z, 'squareSizeMult', 0.05, 0.5, 0.001).decimals(3)

        let noiseControllers = [
            gui.add(Z, 'noiseTranslate', 0, 1000, 1).decimals(0),
            gui.add(Z, 'noiseMult', 0.0005, 0.01, 0.0001).decimals(4),
        ]

        const debg = {
            randomize: () => {
                Z.noiseTranslate = p.floor(p.random(0, 1000))
                Z.noiseMult = p.random(0.0005, 0.003)
                Z.squareSizeMult = p.random(0.05, 0.1)

                gui.controllersRecursive().forEach((c) => c.updateDisplay())
            },
        }

        gui.add(debg, 'randomize')

        gui.onChange(() => p.redraw())
    }
    makeGui()

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.noLoop()
    }

    p.draw = function () {
        p.background(255)
        let edges = true
        let mult = Z.noiseMult
        let add = Z.noiseTranslate
        let squareSize = p.min(p.width, p.height) * Z.squareSizeMult
        let xPos = squareSize * -0.5
        // palette = ['#6f6f6f', '#cfcfcf', '#989898']
        palette = p.random(palettes)

        if (Z.setting === 'noisy') {
            p.noiseSeed(p.random())
            edges = false
        }

        p.strokeWeight(3)

        while (xPos < p.width) {
            let yPos = squareSize * -0.5
            while (yPos < p.height) {
                p.push()
                p.translate(xPos, yPos)
                if (edges) {
                    p.stroke(0)
                    p.fill(255)
                    p.rect(0, 0, squareSize, squareSize)
                }

                let pieces = p.floor(p.random(4, 8))
                let chance = 1
                if (Z.setting === 'noisy') {
                    chance = p.map(
                        p.noise((xPos + add) * mult, (yPos + add) * mult),
                        0.35,
                        0.6,
                        0,
                        1
                    )
                }

                strips(
                    squareSize,
                    pieces,
                    p.random(['a', 'b', 'c', 'd', 'a-alt', 'b-alt', 'c-alt', 'd-alt']),
                    chance
                )

                p.pop()

                yPos += squareSize
            }
            xPos += squareSize
        }
    }

    p.mouseClicked = function (e: Event) {
        if (e.target instanceof HTMLCanvasElement) {
            p.redraw()
        }
    }

    function strips(squareSize: number, pieces: number, style = 'a', chance = 0.5) {
        let wid = squareSize / pieces
        p.stroke(0)
        p.strokeWeight(3)

        for (let i = 0; i < pieces; i++) {
            let fill1 = palette[i % 3]
            let fill2 = palette[(i + 1) % 3]
            switch (style) {
                case 'a':
                    p.fill(fill1)
                    if (p.random() < chance) p.rect(wid * i, wid * i, squareSize - wid * i, wid)
                    p.fill(fill2)
                    if (p.random() < chance) p.rect(wid * i, wid * i, wid, squareSize - wid * i)
                    break
                case 'a-alt':
                    p.fill(fill1)
                    if (p.random() < chance) p.rect(wid * i, wid * i, wid, squareSize - wid * i)
                    p.fill(fill2)
                    if (p.random() < chance) p.rect(wid * i, wid * i, squareSize - wid * i, wid)
                    break
                case 'b':
                    p.fill(fill1)
                    if (p.random() < chance)
                        p.rect(squareSize - wid * (i + 1), 0, wid, squareSize - wid * i)
                    p.fill(fill2)
                    if (p.random() < chance)
                        p.rect(0, squareSize - wid * (i + 1), squareSize - wid * i, wid)
                    break
                case 'b-alt':
                    p.fill(fill1)
                    if (p.random() < chance)
                        p.rect(0, squareSize - wid * (i + 1), squareSize - wid * i, wid)
                    p.fill(fill2)
                    if (p.random() < chance)
                        p.rect(squareSize - wid * (i + 1), 0, wid, squareSize - wid * i)
                    break
                case 'c':
                    p.fill(fill1)
                    if (p.random() < chance)
                        p.rect(wid * i, squareSize - wid * (i + 1), squareSize - wid * i, wid)
                    p.fill(fill2)
                    if (p.random() < chance) p.rect(wid * i, 0, wid, squareSize - wid * i)
                    break
                case 'c-alt':
                    p.fill(fill1)
                    if (p.random() < chance) p.rect(wid * i, 0, wid, squareSize - wid * i)
                    p.fill(fill2)
                    if (p.random() < chance)
                        p.rect(wid * i, squareSize - wid * (i + 1), squareSize - wid * i, wid)
                    break
                case 'd':
                    p.fill(fill1)
                    if (p.random() < chance)
                        p.rect(squareSize - wid * (i + 1), wid * i, wid, squareSize - wid * i)
                    p.fill(fill2)
                    if (p.random() < chance) p.rect(0, wid * i, squareSize - wid * i, wid)
                    break
                case 'd-alt':
                    p.fill(fill1)
                    if (p.random() < chance) p.rect(0, wid * i, squareSize - wid * i, wid)
                    p.fill(fill2)
                    if (p.random() < chance)
                        p.rect(squareSize - wid * (i + 1), wid * i, wid, squareSize - wid * i)
                    break
                default:
                    break
            }

            // p.noStroke()
            // p.fill(0)
            // p.text(chance, squareSize / 2, squareSize / 2)
        }
    }
})
