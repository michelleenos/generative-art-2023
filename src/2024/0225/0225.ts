import '~/style.css'
import p5 from 'p5'
import { Grid } from './Grid'
import { Line } from './Line'
import { Pane } from 'tweakpane'

let paletteHex = ['#ff0000', '#00ff00', '#0000ff']

new p5((p: p5) => {
    const C = {
        showGravity: false,
        showCells: true,
        lines: 3,
        background: 'rgba(0,0,0, 1)',
        cellsColor: 'rgba(255,255,255, 1)',
        symmetry: 'reflect',
        blendMode: p.EXCLUSION,
    }

    let m: number
    let grid: Grid
    let lines: Line[] = []
    let pane = new Pane()

    function doSetup() {
        m = p.min(p.width, p.height) * 0.7

        grid = new Grid(m, m, 12, 12)

        for (let i = 0; i < C.lines; i++) {
            lines.push(
                new Line(grid, {
                    color: paletteHex[i % paletteHex.length],
                    thickness: grid.cellSize.x * 0.7,
                    maxPoints: 15,
                })
            )
        }

        setupPane()
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.strokeCap(p.PROJECT)
        p.rectMode(p.CENTER)

        doSetup()
    }

    p.draw = function () {
        let time = p.millis()

        show(time)
    }

    function show(time: number) {
        p.background(C.background)

        p.push()
        p.blendMode(C.blendMode)

        p.noStroke()
        p.translate(p.width / 2, p.height / 2)

        if (C.showCells) {
            grid.cells.forEach((row) => {
                row.forEach((cell) => {
                    p.push()
                    p.translate(cell.posx, cell.posy)
                    let c = p.color(C.cellsColor)

                    p.fill(c)
                    p.rect(0, 0, grid.cellSize.x * 0.7)

                    p.pop()
                })
            })
        }

        // p.strokeWeight(grid.cellSize.x * 0.3)
        lines.forEach((line) => line.update(p, time))

        p.pop()
    }

    function setupPane() {
        let f = pane.addFolder({ title: 'settings' })
        // f.addInput(C, 'showGravity', { label: 'show gravity' })
        // f.addInput(C, 'showCells', { label: 'show cells' })
        // f.addInput(C, 'symmetry', { options: ['reflect', 'rotate'] })
        f.addInput(C, 'symmetry', {
            options: { reflect: 'reflect', rotate: 'rotate', none: 'none' },
        }).on('change', (e) =>
            lines.forEach((l) => (l.symmetry = e.value as 'reflect' | 'rotate' | 'none'))
        )

        f.addInput(lines[0], 'color', { label: 'line1' })
        f.addInput(lines[1], 'color', { label: 'line2' })
        f.addInput(lines[2], 'color', { label: 'line3' })

        // f.addInput(C, 'blendMode', {
        //     options: {
        //         multiply: p.MULTIPLY,
        //         normal: p.BLEND,
        //         screen: p.SCREEN,
        //         overlay: p.OVERLAY,
        //         hardLight: p.HARD_LIGHT,
        //         difference: p.DIFFERENCE,
        //         exclusion: p.EXCLUSION,
        //         lightest: p.LIGHTEST,
        //         darkest: p.DARKEST,
        //         dodge: p.DODGE,
        //         burn: p.BURN,
        //     },
        // })

        f.addButton({ title: 'clear' }).on('click', () => p.clear())
    }
}, document.getElementById('sketch') ?? undefined)
