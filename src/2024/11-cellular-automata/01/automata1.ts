import '~/style.css'
import createCanvas from '~/helpers/create-canvas'
import { Sizes } from '~/helpers/sizes'
import loop from '~/helpers/loop'
import GUI from 'lil-gui'
import { random } from '~/helpers/utils'

type Bit = 0 | 1
type Bits = Bit[]
// let rule90: Bits = [0, 1, 0, 1, 1, 0, 1, 0]
// like: rule 73, 62, 45

let sizes = new Sizes()
let { ctx } = createCanvas(sizes.width, sizes.height)

type AutomataOpts = {
    cols: number
    maxGenerations?: number
    seed?: 'random' | 'center' | 'specks'
    rule?: number
    leftVal?: Bit
    rightVal?: Bit
}
class ElementaryAutomata {
    cols: number
    generation = 0
    cells: Bits[]
    maxGenerations: number | undefined
    ruleset!: Bits
    seed: 'random' | 'center' | 'specks' = 'center'
    leftVal: Bit
    rightVal: Bit

    constructor({
        cols,
        maxGenerations,
        seed = 'center',
        rule = 90,
        leftVal = 0,
        rightVal = 0,
    }: AutomataOpts) {
        this.cols = cols
        this.maxGenerations = maxGenerations
        this.cells = [new Array(cols).fill(0)]
        this.seed = seed
        this.rule = rule
        this.leftVal = leftVal
        this.rightVal = rightVal
        this.cells[0] = this.getSeedGeneration()
    }

    get currentGeneration() {
        return this.cells[this.generation]
    }

    get rule() {
        return parseInt(this.ruleset.join(''), 2)
    }

    set rule(rule: number) {
        let binary = rule.toString(2).padStart(8, '0')
        this.ruleset = binary.split('').map((n) => parseInt(n)) as Bits
    }

    /**
     *
     * @returns true if a new generation was created, false otherwise
     */
    step = (): boolean => {
        if (this.maxGenerations === undefined || this.generation < this.maxGenerations) {
            this.nextGeneration()
            return true
        }
        return false
    }

    getSeedGeneration = () => {
        if (this.seed === 'center') {
            let newGen = new Array(this.cols).fill(0)
            newGen[Math.floor(this.cols / 2)] = 1
            return newGen
        } else if (this.seed === 'specks') {
            let newGen = new Array(this.cols).fill(0)
            let i = Math.floor(random(5, 10))
            while (i < this.cols + 10) {
                newGen[i] = 1
                i += Math.floor(random(5, 10))
            }
            return newGen
        } else {
            return this.cells[0].map(() => (Math.random() > 0.5 ? 1 : 0))
        }
    }

    nextGeneration = () => {
        let prev = this.cells[this.generation]
        let next: Bits = new Array(prev.length).fill(0)
        for (let i = 0; i < prev.length; i++) {
            let left = prev[i - 1] || this.leftVal
            let me = prev[i]
            let right = prev[i + 1] || this.rightVal
            let index = parseInt(`${left}${me}${right}`, 2)
            next[i] = this.ruleset[7 - index]
        }
        this.cells.push(next)
        this.generation++
    }

    restart = () => {
        this.generation = 0
        this.cells = [this.cells[0]]
    }

    regenerateFromSeed = () => {
        this.cells = [this.getSeedGeneration()]
        this.generation = 0
    }

    adjustCols = (newCols: number) => {
        let redoCount = this.generation
        this.cols = newCols
        this.cells = [this.getSeedGeneration()]
        this.generation = 0
        for (let i = 0; i < redoCount; i++) {
            this.nextGeneration()
        }
    }
}

type AutomataDrawOpts = {
    cellSize: number
    sizes: Sizes
    ctx: CanvasRenderingContext2D
    seed?: AutomataOpts['seed']
}
class AutomataDraw {
    automata!: ElementaryAutomata
    sizes: Sizes
    ctx: CanvasRenderingContext2D
    _cellSize: number

    constructor({ cellSize, sizes, ctx, seed = 'center' }: AutomataDrawOpts) {
        this._cellSize = cellSize
        this.sizes = sizes
        this.ctx = ctx
        this.init(seed)
    }

    get rule() {
        return this.automata.rule
    }

    set rule(rule: number) {
        this.automata.rule = rule
    }

    get seed() {
        return this.automata.seed
    }

    set seed(seed: AutomataOpts['seed']) {
        this.init(seed)
    }

    set cellSize(newCellSize: number) {
        this._cellSize = newCellSize
        this.automata.adjustCols(Math.floor(this.sizes.width / newCellSize))
        this.automata.maxGenerations = Math.floor(this.sizes.height / newCellSize)
        this.drawAll()
    }

    get cellSize() {
        return this._cellSize
    }

    set leftVal(val: Bit) {
        this.automata.leftVal = val
        this.restart()
    }

    set rightVal(val: Bit) {
        this.automata.rightVal = val
        this.restart()
    }

    get leftVal() {
        return this.automata.leftVal
    }

    get rightVal() {
        return this.automata.rightVal
    }

    firstDraw = () => {
        this.ctx.fillStyle = '#fff'
        this.ctx.fillRect(0, 0, this.sizes.width, this.sizes.height)
        this.drawGeneration(0)
    }

    drawAll = () => {
        this.ctx.fillStyle = '#fff'
        this.ctx.fillRect(0, 0, this.sizes.width, this.sizes.height)
        for (let i = 0; i < this.automata.generation; i++) {
            this.drawGeneration(i)
        }
    }

    restart = () => {
        let { ctx } = this
        this.automata.restart()
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, this.sizes.width, this.sizes.height)
        this.drawGeneration(0)
    }

    init = (seed: AutomataOpts['seed']) => {
        let { sizes, _cellSize } = this
        this.automata = new ElementaryAutomata({
            cols: Math.floor(sizes.width / _cellSize),
            maxGenerations: Math.floor(sizes.height / _cellSize),
            seed: seed ?? this.automata['seed'] ?? 'center',
            rule: this.automata ? this.automata.rule : 90,
            leftVal: this.automata ? this.automata.leftVal : 0,
            rightVal: this.automata ? this.automata.rightVal : 0,
        })

        this.firstDraw()
    }

    regenerate = () => {
        this.automata.regenerateFromSeed()
        this.firstDraw()
    }

    step = () => {
        if (this.automata.step()) this.drawGeneration(this.automata.generation)
    }

    drawGeneration = (gen: number) => {
        let { ctx, sizes } = this
        let cells = this.automata.cells[gen]
        let top = gen * this._cellSize

        ctx.save()
        let totalWidth = cells.length * this._cellSize
        let offset = (sizes.width - totalWidth) / 2
        ctx.translate(offset, 0)

        for (let i = 0; i < cells.length; i++) {
            if (cells[i] === 1) {
                ctx.fillStyle = 'black'
                ctx.fillRect(i * this._cellSize, top, this._cellSize, this._cellSize)
            }
        }
        ctx.restore()
    }
}

const automata = new AutomataDraw({ cellSize: 15, sizes, ctx })
// @ts-ignore
window.automata = automata

const gui = new GUI()
gui.add(automata, 'seed', ['center', 'random', 'specks'])
gui.add(automata, 'cellSize', 1, 40, 1)
gui.add(automata, 'rule', 0, 255, 1).onChange(() => automata.restart())
gui.add(automata, 'leftVal', [0, 1])
gui.add(automata, 'rightVal', [0, 1])
gui.add(automata, 'restart')
gui.add(automata, 'regenerate')

loop(automata.step)
