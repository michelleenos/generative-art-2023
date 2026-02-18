import p5 from 'p5'
import { random, weightedRandom } from '~/helpers/utils'
import '~/style.css'
import { Tile, TileLines, TileCircle, TileTris, TileDiag, TileTriSquare } from './tiles'
import { getPaletteContexts } from 'mish-bainrow'
import { GUI } from 'lil-gui'

let pals = getPaletteContexts({
    bgShade: { type: 'dark' },
    minContrastBg: 3.8,
    minColors: 3,
    useStroke: false,
})

new p5(
    (p: p5) => {
        let drawing: Drawing
        let palIndex: number

        class Drawing {
            tiles: Tile[] = []
            tileWeights = { circle: 1, lines: 2, tris: 5, triSquare: 5, diag: 4 }
            colors: string[]
            bg: string
            n = 10
            m: number
            unit: number
            lastTime: number | null = null
            changeTilesInterval = 100
            lastChangeTilesTime = 0
            idealLength = 50
            noiseFreq = 0.3
            noiseSpeed = 0.2
            makeTileChance = 0.6
            initMaxDelay = 6000
            laterMaxDelay = 2000
            _durationIn = 2000
            _durationOut = 2000
            paused = false
            allInPause = false

            constructor(palette: { colors: string[]; bg: string }) {
                this.colors = palette.colors
                this.bg = palette.bg

                this.m = p.min(p.width, p.height) * 0.9
                this.unit = this.m / this.n

                this.tiles = this.makeTiles(this.idealLength, this.initMaxDelay)
            }

            get durationIn() {
                return this._durationIn
            }

            get durationOut() {
                return this._durationOut
            }

            set durationIn(val: number) {
                this._durationIn = val
                this.tiles.forEach((tile) => (tile.t.in = val))
            }

            set durationOut(val: number) {
                this._durationOut = val
                this.tiles.forEach((tile) => (tile.t.out = val))
            }

            makeTiles(count: number, delay = 0) {
                let tiles: Tile[] = []
                let tries = 0

                while (tiles.length < count && tries < 10) {
                    let spot = this.findSpot(tiles)
                    if (spot) {
                        let maybeTile = this.maybeMakeTile(spot.x, spot.y, spot.sz, delay)
                        if (maybeTile) {
                            tiles.push(maybeTile)
                            tries = 0
                        } else {
                            tries++
                        }
                    } else {
                        tries++
                    }
                }

                return tiles
            }

            updatePalette({ colors, bg }: { colors: string[]; bg: string }) {
                this.colors = colors
                this.bg = bg

                this.tiles.forEach((tile) => {
                    tile.clr = random(colors)
                })
            }

            findSpot(addTiles: Tile[] = []) {
                let x: number, y: number, sz: number
                let tries = 0

                while (tries < this.n * this.n) {
                    x = p.floor(p.random(0, this.n))
                    y = p.floor(p.random(0, this.n))
                    sz = p.random([1, 2])
                    if (sz === 2 && x > 0 && y > 0) {
                        x -= 0.5
                        y -= 0.5
                    } else {
                        sz = 1
                    }

                    if (![...addTiles, ...this.tiles].find((t) => t.x === x && t.y === y)) {
                        return { x, y, sz }
                    }

                    tries++
                }

                return null
            }

            maybeMakeTile(x: number, y: number, sz: number, delay = 0) {
                if (
                    p.noise(
                        x * sz * this.noiseFreq,
                        y * sz * this.noiseFreq,
                        p.millis() * (this.noiseSpeed / 1000),
                    ) <
                    1 - this.makeTileChance
                )
                    return null

                return this.makeTile(x, y, sz, delay)
            }

            makeTile(x: number, y: number, sz: number, delay = 0) {
                let Opt = weightedRandom(
                    [TileCircle, TileLines, TileTris, TileTriSquare],
                    [
                        this.tileWeights.circle,
                        this.tileWeights.lines,
                        this.tileWeights.tris,
                        this.tileWeights.triSquare,
                    ],
                )

                let tile = new Opt({
                    x,
                    y,
                    sz,
                    unit: this.unit,
                    clr: random(this.colors),
                    delay: delay ? random(0, delay) : 0,
                })
                tile.t.in = this.durationIn
                tile.t.out = this.durationOut
                return tile
            }

            draw() {
                let ms = p.millis()
                let delta = ms - (this.lastTime || 0)
                this.lastTime = ms

                if (this.paused) return

                p.background(this.bg)

                let maybeChangeStuff = false
                if (!this.allInPause && ms - this.lastChangeTilesTime > this.changeTilesInterval) {
                    this.lastChangeTilesTime = ms
                    maybeChangeStuff = true
                }

                let shouldPause = this.allInPause

                p.push()
                p.translate((p.width - this.m) / 2, (p.height - this.m) / 2)
                p.translate(this.unit / 2, this.unit / 2)

                this.tiles.forEach((tile) => {
                    tile.update(delta)
                    tile.draw(p)

                    if (tile.stage === 'show' && maybeChangeStuff) {
                        if (p.random() < 0.01) {
                            tile.leave()
                        }
                    }
                    if (tile.stage !== 'show') {
                        shouldPause = false
                    }
                })

                p.pop()

                this.tiles.forEach((tile, i) => {
                    if (tile.stage === 'hide') {
                        this.tiles.splice(i, 1)
                    }
                })

                if (maybeChangeStuff && this.tiles.length < this.idealLength) {
                    let newTiles = this.makeTiles(
                        this.idealLength - this.tiles.length,
                        this.laterMaxDelay,
                    )
                    this.tiles.push(...newTiles)
                }

                if (shouldPause) {
                    this.paused = true
                    this.allInPause = false
                }
            }

            pause() {
                this.paused = true
            }

            play() {
                this.paused = false
            }

            restart() {
                p.noiseSeed(p.random())
                this.tiles = this.makeTiles(this.idealLength, this.initMaxDelay)
                this.allInPause = false
                this.paused = false
            }
        }

        // p.mouseClicked = (e: PointerEvent) => {
        //     if (!(e.target instanceof HTMLCanvasElement)) return
        //     palIndex++
        //     let pal = pals[palIndex % pals.length]
        //     drawing.updatePalette(pal)
        // }

        const makeGui = () => {
            const gui = new GUI().close()

            gui.add(drawing, 'idealLength', 1, 200, 1)
            gui.add(drawing, 'changeTilesInterval', 0, 1000, 1)
            gui.add(drawing, 'makeTileChance', 0, 1, 0.01)
            gui.add(drawing, 'noiseFreq', 0, 0.5, 0.001)
            gui.add(drawing, 'noiseSpeed', 0, 1, 0.01)
            gui.add(drawing, 'initMaxDelay', 0, 10000, 10)
            gui.add(drawing, 'laterMaxDelay', 0, 10000, 10)
            gui.add(drawing, 'durationIn', 10, 4000, 10)
            gui.add(drawing, 'durationOut', 10, 4000, 10)
            gui.add(drawing, 'allInPause').listen()
            gui.add(drawing, 'paused').listen()

            const debg = {
                palIndex: palIndex,
                save: () => {
                    p.saveCanvas('05-tiles', 'png')
                },
            }

            gui.add(debg, 'palIndex', 0, pals.length - 1, 1)
                .name('palette')
                .onChange(() => {
                    drawing.updatePalette(pals[debg.palIndex])
                })

            let wf = gui.addFolder('tile weights')
            wf.add(drawing.tileWeights, 'circle', 0, 10, 1)
            wf.add(drawing.tileWeights, 'lines', 0, 10, 1)
            wf.add(drawing.tileWeights, 'tris', 0, 10, 1)
            wf.add(drawing.tileWeights, 'triSquare', 0, 10, 1)

            gui.add(drawing, 'restart')
            // gui.add(drawing, 'allInPause')
            gui.add(debg, 'save')
        }

        p.setup = function () {
            p.createCanvas(p.windowWidth, p.windowHeight)
            p.rectMode(p.CENTER)
            p.strokeCap(p.SQUARE)
            p.strokeJoin(p.MITER)

            palIndex = p.floor(p.random(pals.length))
            let palette = pals[palIndex]

            drawing = new Drawing(palette)
            makeGui()
        }

        p.draw = function () {
            drawing.draw()

            p.fill(255).noStroke()
            p.rect(0, 0, 100, 40)
            p.fill(0)
            p.textAlign(p.CENTER, p.CENTER)
            p.text(drawing.tiles.length, 25, 10)
        }
    },
    document.getElementById('sketch') ?? undefined,
)
