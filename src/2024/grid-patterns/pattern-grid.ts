import { Easing } from '~/helpers/easings'
import { shuffle, random } from '~/helpers/utils'
import {
    PatternCell,
    PatternCellTriangle,
    PatternCellLines,
    PatternCellQuarterCircle,
    PatternCellCircle,
    PatternCellLeaf,
    PatternCellHalfCircle,
    PatternCellQuarterCircleFill,
    PatternCellQuarterCircleLines,
} from './pattern-cell'

type PatternOpts = {
    size: number
    sides?: number
    palette?: string[]
    bg?: string
    fg?: string[]
    squareOptions?: PatternCell['style'][]
    rectOptions?: PatternCell['style'][]
    addPerSecond?: number
    rectChance?: number
    cellDuration?: number
    cellEase?: Easing
}

export class Pattern {
    size: number
    sides: number
    cells: PatternCell[] = []
    bg: string = '#1a1a1a'
    fg: string[] = ['#ebebeb']
    map: number[] = []
    addPerSecond: number = 10
    timeLastAdd: number | null = null
    timeLast: number | null = null
    currentIndex = -1
    protected _cellDuration: number = 800
    protected _cellEase: Easing = 'outCubic'
    squareOptions: PatternCell['style'][] = [
        'triangle',
        'triangle',
        'lines',
        'quarterCircle',
        'circle',
        'leaf',
        // 'quarterCircleFill',
        // 'quarterCircleLines',
    ]
    rectOptions: PatternCell['style'][] = [
        'halfCircle',
        'quarterCircle',
        // 'quarterCircleFill',
        // 'quarterCircleLines',
    ]
    rectChance = 0.5

    constructor(opts: PatternOpts) {
        this.size = opts.size
        this.sides = 10
        if (opts.palette) {
            let pal = shuffle([...opts.palette])
            this.bg = opts.bg || pal.shift()
            this.fg = opts.fg || pal
        }

        if (opts.bg) this.bg = opts.bg
        if (opts.fg) this.fg = opts.fg

        if (opts.sides) this.sides = opts.sides
        if (opts.squareOptions) this.squareOptions = opts.squareOptions
        if (opts.rectOptions) this.rectOptions = opts.rectOptions
        if (opts.addPerSecond) this.addPerSecond = opts.addPerSecond
        if (opts.rectChance) this.rectChance = opts.rectChance
        if (opts.cellDuration) this.cellDuration = opts.cellDuration
        if (opts.cellEase) this.cellEase = opts.cellEase
    }

    set cellDuration(d: number) {
        this._cellDuration = d
        this.cells.forEach((cell) => (cell.duration = d))
    }

    get cellDuration() {
        return this._cellDuration
    }

    set cellEase(e: Easing) {
        this._cellEase = e
        this.cells.forEach((cell) => (cell.easing = e))
    }

    get cellEase() {
        return this._cellEase
    }

    setColors = (palette: string[], newBg?: string) => {
        if (palette.length === 0) return
        if (palette.length === 1) {
            if (newBg) {
                this.bg = newBg
                this.fg = palette
                this.setCellColors()
            } else {
                this.bg = palette[0]
            }
            return
        }
        let pal = shuffle(palette)
        this.bg = newBg || pal.shift()
        this.fg = pal
        this.setCellColors()
    }

    setCellColors = () => {
        this.cells.forEach((cell) => {
            cell.color = random(this.fg)
        })
    }

    pointToIndex = (x: number, y: number) => x + y * this.sides

    indexToPoint = (index: number) => ({ x: index % this.sides, y: Math.floor(index / this.sides) })

    create = () => {
        let key = Array.from({ length: this.sides * this.sides }).map(() => -1)
        let ind = 0
        this.cells = []
        while (ind < key.length) {
            if (key[ind] > -1) {
                ind++
                continue
            }
            let nx = ind % this.sides
            let ny = Math.floor(ind / this.sides)

            let choices = ['square']
            if (this.rectChance > 0 && ny < this.sides - 1) {
                choices.push('vertical')
                choices.push(...Array.from({ length: 1 / this.rectChance }, () => 'square'))
            }
            if (this.rectChance > 0 && nx < this.sides - 1 && key[ind + 1] === -1) {
                choices.push('horizontal')
                choices.push(...Array.from({ length: 1 / this.rectChance }, () => 'square'))
            }
            let shape = random(choices)
            if (shape === 'square') {
                let style = random(this.squareOptions)
                let cellOpts = {
                    nx,
                    ny,
                    w: 1,
                    h: 1,
                    color: random(this.fg),
                    duration: this._cellDuration * (style === 'quarterCircleLines' ? 2 : 1),
                    easing: this._cellEase,
                }

                key[ind] = this.cells.length

                if (style === 'triangle') {
                    this.cells.push(new PatternCellTriangle(cellOpts))
                } else if (style === 'lines') {
                    this.cells.push(new PatternCellLines(cellOpts))
                } else if (style === 'quarterCircle') {
                    this.cells.push(new PatternCellQuarterCircle(cellOpts))
                } else if (style === 'circle') {
                    this.cells.push(new PatternCellCircle(cellOpts))
                } else if (style === 'leaf') {
                    this.cells.push(new PatternCellLeaf(cellOpts))
                } else if (style === 'quarterCircleFill') {
                    this.cells.push(new PatternCellQuarterCircleFill(cellOpts))
                } else if (style === 'quarterCircleLines') {
                    this.cells.push(new PatternCellQuarterCircleLines(cellOpts))
                }
            } else {
                let style = random(this.rectOptions)
                let cellOpts = {
                    nx,
                    ny,
                    w: shape === 'vertical' ? 1 : 2,
                    h: shape === 'vertical' ? 2 : 1,
                    color: random(this.fg),
                    duration: this._cellDuration * (style === 'quarterCircleLines' ? 2 : 1),
                    easing: this._cellEase,
                }
                let next = shape === 'vertical' ? ind + this.sides : ind + 1
                if (style === 'halfCircle') {
                    let cell: PatternCell = new PatternCellHalfCircle(cellOpts)
                    this.cells.push(cell)
                } else if (style === 'quarterCircleLines') {
                    let cell: PatternCell = new PatternCellQuarterCircleLines(cellOpts)
                    this.cells.push(cell)
                } else if (style === 'quarterCircleFill') {
                    let cell: PatternCell = new PatternCellQuarterCircleFill(cellOpts)
                    this.cells.push(cell)
                } else {
                    let cell: PatternCell = new PatternCellQuarterCircle(cellOpts)
                    this.cells.push(cell)
                }
                key[ind] = this.cells.length
                key[next] = this.cells.length
            }
            ind++
        }

        this.map = key
    }

    shuffle = () => {
        this.cells = shuffle(this.cells)
        this.cells.forEach((cell, i) => {
            this.map[this.pointToIndex(cell.nx, cell.ny)] = i
        })
    }

    reset = () => {
        this.timeLast = null
        this.timeLastAdd = null
        this.cells.forEach((cell) => cell.reset())
        this.currentIndex = -1
    }

    draw = (ctx: CanvasRenderingContext2D, time: number, bg = true) => {
        if (!this.timeLast) this.timeLast = time
        if (!this.timeLastAdd) this.timeLastAdd = time

        let delta = time - this.timeLast
        let deltaAdd = time - this.timeLastAdd

        this.timeLast = time
        if (deltaAdd > 1000 / this.addPerSecond) {
            this.timeLastAdd = time
            this.currentIndex = Math.min(this.currentIndex + 1, this.cells.length)
        }

        if (bg) {
            ctx.fillStyle = this.bg
            ctx.fillRect(0, 0, this.size, this.size)
        }

        let cellSize = this.size / this.sides
        let cellsDone = true

        for (let i = -1; i <= this.currentIndex; i++) {
            let cell = this.cells[i]
            if (cell) {
                cell.tick(time)
                cell.draw(ctx, cellSize)
                if (cell.stage !== 'show') {
                    cellsDone = false
                }
            }
        }

        return cellsDone && this.currentIndex >= this.cells.length
    }
}
