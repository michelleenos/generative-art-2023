import p5 from 'p5'
import '../style.css'

const paletteUrls = [
    'https://coolors.co/247ba0-70c1b3-b2dbbf',
    'https://coolors.co/27213c-5a352a-a33b20',
    'https://coolors.co/381d2a-3e6990-aabd8c',
    'https://coolors.co/1e3888-47a8bd-f5e663',
    'https://coolors.co/d7263d-f46036-2e294e',
]

const paletteFromUrl = (url) =>
    url
        .replace('https://coolors.co/', '')
        .split('-')
        .map((c) => `#${c}`)

const palettes = paletteUrls.map((p) => paletteFromUrl(p))
let palette
let setting = 'noisy'
let btns = document.getElementById('btns')

new p5((p: p5) => {
    let div = p.createDiv()
    let sel = p.createSelect().parent(div)
    div.parent('btns')
    // @ts-ignore
    sel.option('noisy')
    // @ts-ignore
    sel.option('base')
    // @ts-ignore
    sel.changed(selectEvent)

    function selectEvent(e) {
        let option = sel.value() as string
        setting = option
        p.redraw()
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.noLoop()
    }

    p.draw = function () {
        p.background(255)
        let edges = true
        let mult = p.random(0.0005, 0.003)
        let add = p.random(0, 1000)
        let squareSize = p.min(p.width, p.height) * p.random(0.05, 0.1)
        let xPos = squareSize * -0.5
        palette = ['#6f6f6f', '#cfcfcf', '#989898']

        if (setting === 'noisy') {
            p.noiseSeed(p.random())
            palette = p.random(palettes)
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
                let chance =
                    setting === 'noisy'
                        ? p.map(p.noise((xPos + add) * mult, (yPos + add) * mult), 0.35, 0.6, 0, 1)
                        : 1
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
        if (e.target instanceof HTMLElement && (!btns || !btns.contains(e.target))) {
            p.redraw()
        }
    }

    function strips(squareSize, pieces, style = 'a', chance = 0.5) {
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
                default:
                    break
            }

            // p.noStroke()
            // p.fill(0)
            // p.text(chance, squareSize / 2, squareSize / 2)
        }
    }
})
