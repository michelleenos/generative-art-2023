import '~/style.css'
import p5 from 'p5'
import { Grid } from './Grid'
import { Line } from './Line'

let paletteHex = ['#f4d35e', '#f95738', '#550527', '#083d77', '#5adbff']

new p5((p: p5) => {
    let m: number
    let palette: p5.Color[]
    let grid: Grid
    let line: Line

    function doSetup() {
        m = p.min(p.width, p.height) * 0.9
        palette = paletteHex.map((c) => p.color(c))

        grid = new Grid(m, m, 10, 10)
        line = new Line(grid, paletteHex[0])
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.strokeCap(p.ROUND)
        p.strokeJoin(p.ROUND)
        p.rectMode(p.CENTER)

        doSetup()
    }

    let lastStep = 0
    p.draw = function () {
        let time = p.millis()
        // let delta = time - lastStep
        show(time)

        p.fill(255)
        p.text(p.frameRate().toFixed(2), 11, 11)
    }

    function show(time: number) {
        p.background('#e8d7ff')
        p.push()
        p.noStroke()

        p.translate(p.width / 2, p.height / 2)

        grid.cells.forEach((row) => {
            row.forEach((cell) => {
                p.push()
                p.translate(cell.posx, cell.posy)
                p.fill(palette[1])
                p.rect(0, 0, grid.cellSize.x * 0.9)

                p.fill(0)
                p.text(cell.weight, 0, 0)
                p.pop()
            })
        })

        p.strokeWeight(7)
        line.update(p, time)

        p.pop()
    }
}, document.getElementById('sketch') ?? undefined)
