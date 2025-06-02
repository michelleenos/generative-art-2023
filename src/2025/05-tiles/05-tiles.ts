// import { getPaletteConfig } from 'mish-bainrow'
import { getAllPaletteContexts } from 'mish-bainrow'
import p5 from 'p5'
import { random } from '~/helpers/utils'
import '~/style.css'
import { Tile, TileLines, TileCircle, TileTris, TileTriSquare } from './tiles'

// toyish-1, 0
// rebo-2
// ambry-1
// squiggles-1
// solarFlair-1
// neopolito-1

new p5((p: p5) => {
    let tiles: Tile[] = []
    let tileOptions = [
        TileCircle,
        TileLines,
        TileLines,
        TileTris,
        TileTris,
        TileTriSquare,
        TileTriSquare,
    ]

    let pals = getAllPaletteContexts({
        excludePalettes: ['natura', 'solarFlair'],
        bgShade: { type: 'dark', limit: 40 },
        minContrastBg: 3.8,
        minColors: 3,
        useStroke: false,
    })
    let palIndex = p.floor(p.random(0, pals.length))
    let pal = pals[palIndex]
    let palette = pal.colors
    let bg = pal.bg

    p.mouseClicked = () => {
        palIndex++
        pal = pals[palIndex % pals.length]
        palette = pal.colors
        bg = pal.bg
        tiles.forEach((tile) => {
            tile.clr = p.random(pal.colors)

            // if (tile instanceof TileNestedTriSquare) {
            //     tile.innerTiles.forEach((t) => {
            //         t.clrs = tile.clrs
            //     })
            // }
        })
    }

    let n = 5
    let m: number
    let unit: number
    let lastTime: number | null = null

    function makeTile(x: number, y: number, sz = 1, delay = false) {
        let Opt = random(tileOptions)
        let tile = new Opt({
            x,
            y,
            sz,
            unit,
            clr: random(palette),
            delay: delay ? random(0, 2000) : 0,
        })

        return tile
    }

    function maybeMakeTile(x: number, y: number, sz = unit, delay = false) {
        if (p.noise(x * 10, y * 10, p.millis() * 0.01) < 0.5) return null

        return makeTile(x, y, sz, delay)
    }

    function findEmptySpot() {
        let x: number, y: number, sz: number
        let tries = 0

        while (tries < 10) {
            x = p.floor(p.random(0, n))
            y = p.floor(p.random(0, n))
            sz = p.random([1, 2])
            if (sz === 2 && x > 0 && y > 0) {
                x -= 0.5
                y -= 0.5
            } else {
                sz = 1
            }
            if (!tiles.find((t) => t.x === x && t.y === y)) {
                return { x, y, sz }
            }

            tries++
        }

        return null
    }

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight)
        p.rectMode(p.CENTER)
        p.strokeCap(p.SQUARE)
        p.strokeJoin(p.MITER)

        m = p.min(p.width, p.height) * 0.9
        unit = m / n

        for (let xi = 1; xi < n; xi++) {
            for (let yi = 1; yi < n; yi++) {
                let tile = maybeMakeTile(xi - 0.5, yi - 0.5, 2, true)
                // let tile = makeTile(xi - 0.5, yi - 0.5, 2, true)
                if (tile) tiles.push(tile)
            }
        }

        for (let xi = 0; xi < n; xi++) {
            for (let yi = 0; yi < n; yi++) {
                let tile = maybeMakeTile(xi, yi, 1, true)
                if (tile) tiles.push(tile)
            }
        }
        // console.log()
    }

    let checkLeaveInterval = 100
    let lastCheckLeaveTime = 0
    p.draw = function () {
        p.background(bg)
        let ms = p.millis()
        let delta = ms - (lastTime || 0)
        lastTime = ms

        let checkLeave = false
        if (ms - lastCheckLeaveTime > checkLeaveInterval) {
            lastCheckLeaveTime = ms
            checkLeave = true
        }

        p.push()
        p.translate((p.width - m) / 2, (p.height - m) / 2)
        p.translate(unit / 2, unit / 2)

        tiles.forEach((tile, i) => {
            tile.update(delta)
            tile.draw(p)

            if (tile.stage === 'show' && checkLeave) {
                if (p.random() < 0.01) {
                    tile.leave()
                }
            }
        })

        tiles.forEach((tile, i) => {
            if (tile.stage === 'hide') {
                tiles.splice(i, 1)
            }
        })

        p.pop()

        if (tiles.length < 18) {
            let spot = findEmptySpot()
            if (spot) {
                let tile = maybeMakeTile(spot.x, spot.y, spot.sz)
                if (tile) tiles.push(tile)
            }
        }

        p.fill(255).noStroke()
        p.rect(0, 0, 190, 50)
        p.fill(0)
        p.text(pal.name, 10, 10)
    }
}, document.getElementById('sketch') ?? undefined)
