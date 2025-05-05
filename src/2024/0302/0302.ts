import '~/style.css'
import p5 from 'p5'
import { Grid } from './Grid'
import { Line } from './Line'
import { Pane } from 'tweakpane'
import { random, shuffle } from '~/helpers/utils'

// let paletteHex = ['#0e1428', '#7d8491', '#f0a202', '#7fd1b9', '#d95d39']
// let paletteHex2 = ['#ff575c', '#ffca3a', '#8ac926', '#90f1ef', '#2136d3', '#9381FF', '#b83bba']
// let paletteHex3 = 'ff99c8-fcf6bd-d0f4de-a9def9-e4c1f9'.split('-').map((c) => '#' + c)
let paletteHex4 = ['#ff4d4d', '#ffcc22', '#11dd77', '#44aaee', '#bb66ee']

type ModifiableLineProp = 'maxPoints' | 'thickness' | 'speed' | 'symmetry' | 'useWeights'

// const C = {
//     showCells: true,
//     gridCells: 5,
//     lines: 2,
//     symmetry: 'reflect' as 'reflect' | 'rotate' | 'none',
//     count: 3,
//     maxPoints: 7,
//     useWeights: true,
//     speed: 3,
// }

class Drawing {
    background: string = '#0e1428'
    _size: number
    _cellsCount: number
    _cellSize: number
    _cellDiv: number
    items: { grid: Grid; lines: Line[]; x: number; y: number }[] = []
    linesCount: number = 2
    _symmetry: 'rotate' | 'reflect' | 'none' = 'reflect'
    _weights: boolean = false
    _speed: number = 3
    _maxPointsPerLine: number = 4
    _showGravity: boolean = false

    constructor(size: number, cellsCount: number = 4) {
        this._size = size
        this._cellSize = size / cellsCount
        this._cellsCount = cellsCount
        this._cellDiv = 4

        this.setupItems()
    }

    get symmetry() {
        return this._symmetry
    }
    set symmetry(s: 'rotate' | 'reflect' | 'none') {
        this._symmetry = s
        this.updateLinesProp('symmetry', s)
    }

    get weights() {
        return this._weights
    }
    set weights(w: boolean) {
        this._weights = w
        this.updateLinesProp('useWeights', w)
    }

    get speed() {
        return this._speed
    }
    set speed(s: number) {
        this._speed = s
        this.updateLinesProp('speed', s)
    }

    get maxPointsPerLine() {
        return this._maxPointsPerLine
    }
    set maxPointsPerLine(m: number) {
        this._maxPointsPerLine = m
        this.updateLinesProp('maxPoints', m)
    }

    get showGravity() {
        return this._showGravity
    }
    set showGravity(s: boolean) {
        this._showGravity = s
    }

    get size() {
        return this._size
    }
    set size(s: number) {
        this._size = s
        this._cellSize = s / this._cellsCount
        this.items = []
        this.setupItems()
    }

    updateLinesProp<T extends ModifiableLineProp>(prop: T, value: Line[T]) {
        this.items.forEach(({ lines }) => {
            lines.forEach((line) => {
                line[prop] = value
            })
        })
    }

    setupItems = () => {
        for (let x = 0; x < this._cellsCount; x++) {
            for (let y = 0; y < this._cellsCount; y++) {
                let grid = new Grid(this._cellSize * 0.8, this._cellDiv)
                let lines: Line[] = []
                let palette = shuffle(paletteHex4)
                for (let i = 0; i < this.linesCount; i++) {
                    let line = new Line(grid, {
                        color: palette[i % palette.length],
                        thickness: grid.divSize * 0.35,
                        maxPoints: this._maxPointsPerLine,
                        useWeights: this._weights,
                        speed: random(this._speed * 0.75, this._speed * 1.25),
                        symmetry: this._symmetry,
                    })
                    lines.push(line)
                }
                this.items.push({
                    grid,
                    lines,
                    x: (x - this._cellsCount / 2 + 0.5) * this._cellSize,
                    y: (y - this._cellsCount / 2 + 0.5) * this._cellSize,
                })
            }
        }
    }

    show = (time: number, p: p5) => {
        p.push()
        p.background(this.background)

        p.noStroke()
        p.translate(p.width / 2, p.height / 2)

        this.items.forEach(({ lines }) => {
            lines.forEach((line) => line.update(time))
        })

        this.items.forEach(({ lines, x, y, grid }) => {
            p.push()
            p.translate(x, y)
            grid.drawCells(p, this._showGravity)
            lines.forEach((line) => line.draw(p))
            p.pop()
        })

        p.pop()
    }
}

new p5((p: p5) => {
    let pane = new Pane()
    let drawing: Drawing
    let PAUSED = false

    function doSetup() {
        let m = p.min(p.width, p.height) * 0.9
        drawing = new Drawing(m, 4)

        setupPane()
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.strokeCap(p.ROUND)
        p.strokeJoin(p.ROUND)
        p.rectMode(p.CENTER)

        doSetup()
        // @ts-ignore
        window.drawing = drawing
    }

    p.draw = function () {
        if (PAUSED) return
        let time = p.millis()
        drawing.show(time, p)
    }

    p.windowResized = function () {
        p.resizeCanvas(window.innerWidth, window.innerHeight)
        let m = p.min(p.width, p.height) * 0.9
        drawing.size = m
    }

    function setupPane() {
        let f = pane.addFolder({ title: 'settings' })
        f.addInput(drawing, 'symmetry', {
            options: { reflect: 'reflect', rotate: 'rotate', none: 'none' },
        })
        f.addInput(drawing, 'weights')
        f.addInput(drawing, 'speed', { min: 1, max: 10, step: 0.1 })
        f.addInput(drawing, 'maxPointsPerLine', { min: 3, max: 20, step: 1 })
        f.addInput(drawing, 'background', { input: 'color' })
        f.addInput(drawing, 'showGravity')
    }
}, document.getElementById('sketch') ?? undefined)
