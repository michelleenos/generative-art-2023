import '~/style.css'
import p5 from 'p5'
import { clamp } from '~/helpers/utils'
import { Pane } from 'tweakpane'
import RefreshContainer from '~/helpers/refresh-container'

let paletteHex = ['#f4d35e', '#f95738', '#550527', '#083d77', '#5adbff']

paletteHex = ['#083d77', '#1B9AAA', '#550527', '#7D59AB']
// let count = 20

const C = {
    symmetry: 'reflection',
    durAlpha: 1.5,
    durSize: 1,
    durWait: 3,
    stepRate: 15,
    sizeMax: 0.75,
    sizeStep: 0.15,
    count: 19,
    walk: 'weighted',
    showBase: true,
}
const pane = new Pane()
const rc = new RefreshContainer(pane)

type Cell = {
    posx: number
    posy: number
    x: number
    y: number
    alpha: number
    amountSize: number
    weight: number
    mode: 'none' | 'leaving' | 'entering' | 'waiting'
    progressWait: number
    weightSteps: number
}

function adjustWeightAround(x: number, y: number, cells: Cell[][], amount: number) {
    for (let ix = -1; ix <= 1; ix++) {
        for (let iy = -1; iy <= 1; iy++) {
            let cell = cells[x + ix]?.[y + iy]
            if (cell) cell.weight = clamp(cell.weight + amount, 1, 8)
        }
    }
}

function getWeightedOpts(x: number, y: number, cells: Cell[][]) {
    let options: Cell[] = []
    let maxWeight = 1
    for (let ix = -1; ix <= 1; ix++) {
        for (let iy = -1; iy <= 1; iy++) {
            if (ix === 0 && iy === 0) continue
            let cell = cells[x + ix]?.[y + iy]
            if (cell) {
                if (cell.weight > maxWeight) maxWeight = cell.weight
                options.push(cell)
            }
        }
    }

    return options.filter((cell) => cell.weight === maxWeight)
}

function getOpts(x: number, y: number, cells: Cell[][]) {
    let options: Cell[] = []
    for (let ix = -1; ix <= 1; ix++) {
        for (let iy = -1; iy <= 1; iy++) {
            if (ix === 0 && iy === 0) continue
            let cell = cells[x + ix]?.[y + iy]
            if (cell) options.push(cell)
        }
    }
    return options
}

new p5((p: p5) => {
    let m: number
    let gridSize: number
    let palette: p5.Color[]
    let cells: Cell[][] = []
    let pointers: { x: number; y: number }[] = []

    let fold = pane.addFolder({ title: 'settings' })
    fold.addInput(C, 'symmetry', { options: { rotation: 'rotation', reflection: 'reflection' } })
    fold.addInput(C, 'durAlpha', { min: 0, max: 5 })
    fold.addInput(C, 'durSize', { min: 0, max: 5 })
    fold.addInput(C, 'durWait', { min: 0, max: 5 })
    fold.addInput(C, 'stepRate', { min: 1, max: 60, step: 1 })
    fold.addInput(C, 'walk', { options: { weighted: 'weighted', random: 'random' } })
    fold.addInput(C, 'showBase')

    const checkSizes = () => {
        if (C.sizeMax - C.sizeStep * 3 < 0) {
            C.sizeMax = C.sizeStep * 3 + 0.1
            rc.refresh()
        }
    }

    fold.addInput(C, 'sizeMax', { min: 0, max: 5, step: 0.001 }).on('change', checkSizes)
    fold.addInput(C, 'sizeStep', { min: 0, max: 2, step: 0.001 }).on('change', checkSizes)
    fold.addInput(C, 'count', { min: 5, max: 50, step: 1 }).on('change', doSetup)

    function getSizes() {
        m = p.min(p.width, p.height) * 0.9
        gridSize = Math.floor(m / C.count)

        for (let x = 0; x < cells.length; x++) {
            for (let y = 0; y < cells[x].length; y++) {
                let cell = cells[x][y]
                cell.posx = (x - C.count / 2 + 0.5) * gridSize
                cell.posy = (y - C.count / 2 + 0.5) * gridSize
            }
        }
    }

    function doSetup() {
        let { count } = C
        m = p.min(p.width, p.height) * 0.9
        gridSize = Math.floor(m / count)

        palette = paletteHex.map((c) => p.color(c))

        p.rectMode(p.CENTER)

        pointers = [
            { x: Math.floor(count / 2), y: Math.floor(count / 2) },
            { x: Math.floor(count / 2), y: Math.floor(count / 2) },
            // { x: count - 1, y: count - 1 },
            // { x: 0, y: count - 1 },
            // { x: count - 1, y: 0 },
        ]

        cells = []
        for (let x = 0; x < count; x++) {
            let row: Cell[] = []
            for (let y = 0; y < count; y++) {
                row.push({
                    posx: (x - count / 2 + 0.5) * gridSize,
                    posy: (y - count / 2 + 0.5) * gridSize,
                    x,
                    y,
                    weightSteps: 0,
                    alpha: 0,
                    amountSize: 0,
                    mode: 'none',
                    progressWait: -1,
                    weight: 8,
                    // weight: (x === 0 || x === count - 1) && (y === 0 || y === count - 1) ? 3 : 8,
                })
            }
            cells.push(row)
        }
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        doSetup()
    }

    function step() {
        pointers.forEach((pointer) => {
            let current = cells[pointer.x][pointer.y]
            if (current.mode === 'none') {
                current.alpha = 1
                current.amountSize = 0
                current.mode = 'entering'
            } else if (current.mode === 'waiting') {
                current.progressWait = 0
            } else if (current.mode === 'leaving') {
                current.mode = 'entering'
                current.alpha = current.alpha // stay the same, will increase with show fn
                current.amountSize = 1 // should already be 1
            } else if (current.mode === 'entering') {
                // don't change anything
            }
            current.weightSteps = 8
            adjustWeightAround(pointer.x, pointer.y, cells, -1)
            let nextOptions =
                C.walk === 'weighted'
                    ? getWeightedOpts(pointer.x, pointer.y, cells)
                    : getOpts(pointer.x, pointer.y, cells)
            let next = p.random(nextOptions)
            pointer.x = next.x
            pointer.y = next.y
        })
    }

    let lastStep = 0
    p.draw = function () {
        let time = p.millis()
        let delta = time - lastStep
        if (delta > 1000 / C.stepRate) {
            step()
            lastStep = time
        }
        show(delta)

        p.fill(255)
        p.text(p.frameRate().toFixed(2), 10, 10)
    }

    function show(delta: number) {
        let { count } = C
        p.background('#e8d7ff')
        p.push()
        p.noStroke()

        delta = delta * 0.001

        p.translate(p.width / 2, p.height / 2)

        if (C.showBase) {
            for (let x = 0; x < count; x++) {
                for (let y = 0; y < count; y++) {
                    let cell = cells[x][y]
                    p.fill(0, 0, 0, 10)
                    p.circle(cell.posx, cell.posy, gridSize * C.sizeMax)
                }
            }
        }

        for (let x = 0; x < count; x++) {
            for (let y = 0; y < count; y++) {
                let cell = cells[x][y]

                if (cell.mode === 'entering') {
                    cell.amountSize = Math.min(cell.amountSize + delta * (1 / C.durSize), 1)
                    if (cell.alpha < 1) cell.alpha += delta * (1 / C.durAlpha)

                    if (cell.amountSize >= 1 && cell.alpha >= 1) {
                        cell.mode = 'waiting'
                        cell.amountSize = 1
                        cell.alpha = 1
                        cell.progressWait = 0
                    }
                } else if (cell.mode === 'waiting') {
                    cell.progressWait += delta * (1 / C.durWait)

                    if (cell.progressWait >= 1) {
                        cell.mode = 'leaving'
                        cell.progressWait = -1
                    }
                } else if (cell.mode === 'leaving') {
                    cell.alpha -= delta * (1 / C.durAlpha)
                    if (cell.alpha <= 0) {
                        cell.mode = 'none'
                        cell.amountSize = 0
                        cell.alpha = 1
                        adjustWeightAround(x, y, cells, 1)
                    }
                }

                let oppx = count - 1 - x
                let oppy = count - 1 - y
                let quarter =
                    x < count / 2 && y < count / 2 ? 4 : x < count / 2 ? 3 : y < count / 2 ? 2 : 1

                let size = gridSize * C.sizeMax - gridSize * C.sizeStep * (4 - quarter)
                let color = palette[quarter - 1]
                color.setAlpha(255 * cell.alpha)

                p.fill(color)
                p.noStroke()

                if (C.symmetry === 'reflection') {
                    p.circle(cell.posx, cell.posy, size * cell.amountSize)
                    p.circle(cells[oppx][y].posx, cells[oppx][y].posy, size * cell.amountSize)
                    p.circle(cells[x][oppy].posx, cells[x][oppy].posy, size * cell.amountSize)
                    p.circle(cells[oppx][oppy].posx, cells[oppx][oppy].posy, size * cell.amountSize)
                } else {
                    p.circle(cell.posx, cell.posy, size * cell.amountSize)
                    p.circle(cells[oppy][x].posx, cells[oppy][x].posy, size * cell.amountSize)
                    p.circle(cells[y][oppx].posx, cells[y][oppx].posy, size * cell.amountSize)
                    p.circle(cells[oppx][oppy].posx, cells[oppx][oppy].posy, size * cell.amountSize)
                }
            }
        }

        p.pop()
    }

    p.windowResized = function () {
        p.resizeCanvas(window.innerWidth, window.innerHeight)
        getSizes()
    }

    // @ts-ignore
    window.drawing = {
        step,
        show,
        pointers,
    }
}, document.getElementById('sketch') ?? undefined)
