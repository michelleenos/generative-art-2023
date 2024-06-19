import { random, shuffle } from '~/helpers/utils'
import { type PatternCell } from './cells/pattern-cell'
import { PatternStyleOpts, createPattern, type CornersPattern } from './grid-stuff'

export type BasePatternOpts = {
    size: number
    sides?: number
    palette?: string[]
    bg?: string
    fg?: string[]
    squareOptions?: PatternCell['style'][]
    rectOptions?: PatternCell['style'][]
    rectChance?: number
    cornerPattern?: CornersPattern
    noisePattern?: boolean
}

export class BasePattern {
    size: number
    sides: number = 10
    cells: PatternCell[] = []

    noisePattern: boolean = false

    bg: string = '#1a1a1a'
    fg: string[] = ['#ebebeb']
    map: number[] = []
    mapRef: (PatternCell | null)[] = []

    styleOpts: PatternStyleOpts = {}

    squareOptions: PatternCell['style'][] = [
        'triangle',
        'triangle',
        'lines',
        'quarterCircle',
        'circle',
        'leaf',
    ]
    rectOptions: PatternCell['style'][] = ['halfCircle', 'quarterCircle']
    rectChance = 0.5

    cornerPattern: CornersPattern = false

    constructor(opts: BasePatternOpts) {
        this.size = opts.size
        this.sides = opts.sides || this.sides
        this.bg = opts.bg || this.bg
        this.fg = opts.fg || this.fg
        this.squareOptions = opts.squareOptions || this.squareOptions
        this.rectOptions = opts.rectOptions || this.rectOptions
        this.rectChance = opts.rectChance !== undefined ? opts.rectChance : this.rectChance
        this.cornerPattern = opts.cornerPattern || this.cornerPattern
        this.noisePattern = opts.noisePattern || this.noisePattern

        if (opts.fg) {
            this.setColors(opts.fg, opts.bg)
        } else if (opts.palette) {
            this.setColors(opts.palette, opts.bg)
        }
    }

    get count() {
        return this.cells.length
    }

    setColors(palette: string[], newBg?: string) {
        // let colors: { bg?: string; fg?: string[] } = {}
        if (palette.length === 0 && newBg) {
            this.bg = newBg
        } else if (palette.length === 1) {
            if (newBg) {
                this.bg = newBg
                this.fg = palette
            } else {
                this.bg = palette[0]
            }
        } else {
            this.fg = shuffle(palette)
            this.bg = newBg || this.fg.shift()!
        }

        this.setCellColors()
    }

    setCellColors() {
        this.cells.forEach((cell) => (cell.color = random(this.fg)))
    }

    create(opts: Partial<Parameters<typeof createPattern>[1]> = {}) {
        let { map, cells } = createPattern(this.sides, {
            rectChance: this.rectChance,
            cornersPattern: this.cornerPattern,
            squareOptions: this.squareOptions,
            rectOptions: this.rectOptions,
            colors: this.fg,
            styleOpts: this.styleOpts,
            noisePattern: this.noisePattern,
            ...opts,
        })

        this.mapRef = map
        this.cells = cells
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.bg
        ctx.fillRect(0, 0, this.size, this.size)
        let cellSize = this.size / this.sides
        this.cells.forEach((cell) => cell.draw(ctx, cellSize))
    }
}
