import { random } from '~/helpers/utils'
import { type PatternCell } from './cells/pattern-cell'
import { PatternStyleOpts, createPattern, type CornersPattern } from './grid-stuff'

export type BasePatternOpts = {
    size: number
    sides?: number
    palette?: string[]
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
    palette: string[] = ['#1a1a1a']
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
        this.squareOptions = opts.squareOptions || this.squareOptions
        this.rectOptions = opts.rectOptions || this.rectOptions
        this.rectChance = opts.rectChance !== undefined ? opts.rectChance : this.rectChance
        this.cornerPattern = opts.cornerPattern || this.cornerPattern
        this.noisePattern = opts.noisePattern || this.noisePattern
        if (opts.palette) this.palette = opts.palette
    }

    get count() {
        return this.cells.length
    }

    setColors(palette: string[]) {
        this.palette = palette
        this.setCellColors()
    }

    setCellColors() {
        this.cells.forEach((cell) => (cell.color = random(this.palette)))
    }

    create(opts: Partial<Parameters<typeof createPattern>[1]> = {}) {
        let { map, cells } = createPattern(this.sides, {
            rectChance: this.rectChance,
            cornersPattern: this.cornerPattern,
            squareOptions: this.squareOptions,
            rectOptions: this.rectOptions,
            colors: this.palette,
            styleOpts: this.styleOpts,
            noisePattern: this.noisePattern,
            ...opts,
        })

        this.mapRef = map
        this.cells = cells
    }

    draw(ctx: CanvasRenderingContext2D) {
        let cellSize = this.size / this.sides
        this.cells.forEach((cell) => cell.draw(ctx, cellSize))
    }
}
