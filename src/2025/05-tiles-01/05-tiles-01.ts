import { getAllPaletteContexts } from 'mish-bainrow'
import p5 from 'p5'
import { random } from '~/helpers/utils'
import '~/style.css'
import { Tile, TileSquares, TileCircSquare } from './tiles'

new p5((p: p5) => {
    let tiles: Tile[] = []

    let pals = getAllPaletteContexts({ excludePalettes: ['livingRoom'] })
    let pal = pals.find((p) => p.name === 'squiggles-1')!
    let palette = pal.colors
    let bg = pal.bg
    let doneCount = 0

    p.mouseClicked = () => {
        pal = random(pals)
        palette = pal.colors
        bg = pal.bg
        tiles.forEach((tile) => {
            tile.clrs = p.shuffle(pal.colors, false)
        })
    }

    let n = 5
    let m: number
    let unit: number
    let cellSize: number
    let lastTime: number | null = null

    function makeTiles() {
        let enterTime = 2000
        let waitTime = 200
        let exitTime = 2000

        tiles = []
        for (let i = 0; i < 20; i++) {
            let sz = random([1, 1, 1, 2])

            let xi = sz === 2 ? p.floor(p.random(n - 1)) + 0.5 : p.floor(p.random(n))
            let yi = sz === 2 ? p.floor(p.random(n - 1)) + 0.5 : p.floor(p.random(n))
            let tile = new TileSquares(
                xi * unit,
                yi * unit,
                sz * cellSize,
                palette,
                p.map(p.dist(n / 2, n / 2, xi + 0.5, yi + 0.5), 0, n / 2, 0, 1) * -2000
            )
            tile.t1 = enterTime
            tile.t2 = enterTime + waitTime
            tile.t3 = enterTime + waitTime + exitTime
            tiles.push(tile)
        }
    }

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight)
        p.rectMode(p.CENTER)
        // tileOptions = [TileSquares]

        m = p.min(p.width, p.height) * 0.9
        unit = m / n
        cellSize = unit
        makeTiles()
    }

    p.draw = function () {
        if (tiles.length === 0) {
            makeTiles()
        }
        p.background(bg)
        let ms = p.millis()
        let delta = ms - (lastTime || 0)
        lastTime = ms

        p.push()
        p.translate((p.width - m) / 2, (p.height - m) / 2)
        p.translate(unit / 2, unit / 2)

        tiles.forEach((tile, i) => {
            tile.update(delta)
            tile.draw(p)
            if (tile.done) {
                tiles.splice(i, 1)
            }
        })

        p.pop()

        p.fill(255).noStroke()
        p.rect(0, 0, 190, 50)
        p.fill(0)
        p.text(pal.name, 10, 10)
    }
}, document.getElementById('sketch') ?? undefined)
