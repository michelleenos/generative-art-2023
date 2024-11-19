import '~/style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import { Sizes } from '~/helpers/sizes'
import loop from '~/helpers/loop'
import GUI from 'lil-gui'
import { random } from '~/helpers/utils'
import chroma from 'chroma-js'

type Bit = 0 | 1
type Bits = Bit[]
// let rule90: Bits = [0, 1, 0, 1, 1, 0, 1, 0]
// like: rule 73, 62, 45

let sizes = new Sizes()
let { ctx } = createCanvas(sizes.width, sizes.height)

type AutomataSeed = 'random' | 'center' | 'specks' | 'flecks'
type AutomataOpts = {
    cols: number
    seed?: AutomataSeed
    rule?: number
}
class ElementaryAutomata {
    generation = 0
    cells: Bits
    ruleset!: Bits
    seed: AutomataSeed

    constructor({ cols, seed = 'center', rule = 90 }: AutomataOpts) {
        this.seed = seed
        this.cells = this.getSeedGeneration(cols)
        this.rule = rule
    }

    get cols() {
        return this.cells.length
    }

    set cols(newCols: number) {
        this.changeCols(newCols)
    }

    get rule() {
        return parseInt(this.ruleset.join(''), 2)
    }

    set rule(rule: number) {
        let binary = rule.toString(2).padStart(8, '0')
        this.ruleset = binary.split('').map((n) => parseInt(n)) as Bits
    }

    stepCount(count: number) {
        let i = 0
        while (i < count) {
            this.nextGeneration()
            i++
        }
    }

    getSeedGeneration = (cols: number) => {
        let newGen = new Array(cols).fill(0)

        switch (this.seed) {
            case 'center':
                newGen[Math.floor(cols / 2)] = 1
                break
            case 'specks':
                let i = Math.floor(random(5, 10))
                while (i < cols) {
                    newGen[i] = 1
                    i += Math.floor(random(5, 10))
                }
                break
            case 'flecks':
                let j = Math.floor(random(1, 6))
                let len = Math.floor(random(3, 8))
                while (j < cols) {
                    newGen[j] = 1
                    len--
                    if (len <= 0) {
                        j += Math.floor(random(5, 10))
                        len = Math.floor(random(3, 8))
                    } else {
                        j++
                    }
                }
                break
            case 'random':
                newGen = newGen.map(() => (Math.random() > 0.5 ? 1 : 0))
                break
        }
        return newGen
    }

    nextGeneration = () => {
        let prev = this.cells
        let next: Bits = new Array(prev.length).fill(0)
        for (let i = 0; i < prev.length; i++) {
            let left = prev[i - 1] || 0
            let me = prev[i]
            let right = prev[i + 1] || 0
            let index = parseInt(`${left}${me}${right}`, 2)
            next[i] = this.ruleset[7 - index] // since rules go from 111 to 000
        }
        this.cells = next
        this.generation++
    }

    restart() {
        this.cells = this.getSeedGeneration(this.cells.length)
        this.generation = 0
    }

    changeCols(newCols: number) {
        let currentCols = this.cells.length
        if (newCols > currentCols) {
            let diff = newCols - currentCols
            let left = new Array(Math.floor(diff / 2)).fill(0)
            let right = new Array(Math.ceil(diff / 2)).fill(0)
            this.cells = [...left, ...this.cells, ...right]
        } else {
            let diff = currentCols - newCols
            this.cells = this.cells.slice(
                Math.floor(diff / 2),
                this.cells.length - Math.ceil(diff / 2)
            )
        }
    }
}

interface AutomataDrawOpts extends AutomataOpts {
    sizes: Sizes
    ctx: CanvasRenderingContext2D
    seed?: AutomataSeed
    rule?: number
    colors?: string[]
}

class AutomataDraw extends ElementaryAutomata {
    sizes: Sizes
    ctx: CanvasRenderingContext2D
    maxRows: number
    paused = false
    lastTime = 0
    frameRate = 50
    cellSize: number
    topOffset = 0
    colors = ['#fff', '#000']

    constructor({ cols, sizes, ctx, seed = 'center', rule, colors }: AutomataDrawOpts) {
        super({ cols, seed, rule })
        this.cellSize = Math.floor(sizes.width / cols)
        this.maxRows = Math.floor(sizes.height / this.cellSize)
        this.sizes = sizes
        this.ctx = ctx
        if (colors) this.colors = colors

        this.firstDraw()
    }

    set cols(newCols: number) {
        super.cols = newCols
        this.cellSize = Math.ceil(this.sizes.width / newCols)
        this.maxRows = Math.ceil(this.sizes.height / this.cellSize)
    }

    get cols() {
        return super.cols
    }

    bg = () => {
        this.ctx.fillStyle = this.colors[0]
        this.ctx.fillRect(0, 0, this.sizes.width, this.sizes.height)
    }

    firstDraw = () => {
        this.bg()
        this.drawGeneration()
    }

    step() {
        this.nextGeneration()
        this.drawGeneration()
    }

    restart() {
        super.restart()
        this.topOffset = 0
        this.firstDraw()
    }

    drawGeneration = () => {
        let { ctx } = this
        let cells = this.cells
        // let top = Math.ceil(this.generation % this.maxRows) * this.cellSize

        for (let i = 0; i < cells.length; i++) {
            ctx.fillStyle = cells[i] === 1 ? this.colors[1] : this.colors[0]
            ctx.fillRect(i * this.cellSize, this.topOffset, this.cellSize, this.cellSize)
        }
        this.topOffset += this.cellSize
        if (this.topOffset >= this.sizes.height) {
            this.topOffset = 0
        }
    }

    loop = (ms: number) => {
        let delta = ms - this.lastTime
        if (delta > 1000 / this.frameRate) {
            this.lastTime = ms
            if (!this.paused) this.step()
        }
    }

    pause = () => {
        this.paused = true
    }

    play = () => {
        this.paused = false
    }
}

const automataDrawing = new AutomataDraw({
    cols: 50,
    sizes,
    ctx,
    colors: [chroma.random().hex(), chroma.random().hex()],
})

const debg = {
    step10: () => automataDrawing.stepCount(10),
    step20: () => automataDrawing.stepCount(20),
    step: () => automataDrawing.step(),
    cols: automataDrawing.cols,
}

const gui = new GUI()
gui.add(automataDrawing, 'seed', ['center', 'random', 'specks', 'flecks']).onChange(() =>
    automataDrawing.restart()
)
gui.add(automataDrawing, 'rule', 0, 255, 1)
gui.add(automataDrawing, 'frameRate', 1, 100, 1)
gui.add(automataDrawing, 'restart')
gui.add(automataDrawing, 'generation').disable().listen()
gui.add(debg, 'cols', 10, 200, 1).onFinishChange((val: number) => {
    automataDrawing.cols = val
})

let playFolder = gui.addFolder('play/pause/step').close()
playFolder.add(automataDrawing, 'pause')
playFolder.add(automataDrawing, 'play')
playFolder.add(debg, 'step')
playFolder.add(debg, 'step10')

loop(automataDrawing.loop)

// @ts-ignore
window.automata = automataDrawing
