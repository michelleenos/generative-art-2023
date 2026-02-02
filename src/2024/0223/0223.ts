import '~/style.css'
import { WalkGrid } from './walk'
import { Pane } from 'tweakpane'
import p5 from 'p5'

let C = {
    count: 2,
    countInner: 15,
    walkers: 4,
    maxPoints: 10,
    symmetry: 'reflection',
    style: 'lines',
}

const paletteHex = '083d77-f4d35e-5adbff-550527-f95738'.split('-').map((c) => '#' + c)

const pane = new Pane()

type GridOpts = {
    cells?: number
    walkersCount?: number
    sizeOuter: number
    pos: p5.Vector
    palette: string[]
    symmetry?: 'reflection' | 'rotation'
    style?: 'lines' | 'rects'
}

class Grid {
    walkers: WalkGrid[] = []
    walkersCount
    sizeOuter: number
    sizeInner: number
    cells: number
    pos: p5.Vector
    palette: string[]
    colorIndex: number = 0
    stepsCount = 0
    stepsBetweenAdd: number
    stepsLastAdd = 0
    symmetry: 'reflection' | 'rotation'
    style: 'lines' | 'rects'

    constructor({
        cells = 9,
        pos,
        sizeOuter,
        palette,
        walkersCount = 2,
        symmetry = 'rotation',
        style = 'lines',
    }: GridOpts) {
        this.cells = cells
        this.sizeOuter = sizeOuter
        this.walkersCount = walkersCount
        this.sizeInner = sizeOuter / cells
        this.pos = pos
        this.symmetry = symmetry
        this.palette = [...palette]
        this.style = style
        this.stepsBetweenAdd = Math.floor(Math.random() * 10) + 10

        this.add()
    }

    add = () => {
        let color = this.palette[this.colorIndex]
        this.walkers.push(
            new WalkGrid({
                color,
                size: this.cells,
                maxPoints: C.maxPoints,
            }),
        )
        this.colorIndex = (this.colorIndex + 1) % this.palette.length
        this.stepsLastAdd = this.stepsCount
    }

    draw(p: p5) {
        this.stepsCount++
        p.push()
        p.translate(this.pos.x, this.pos.y)
        p.fill(240)
        p.noStroke()
        p.rect(0, 0, this.sizeOuter)

        this.walkers.forEach((walker, i) => {
            walker.step()
            if (walker.dead) {
                this.walkers[i] = new WalkGrid({
                    color: this.palette[this.colorIndex],
                    size: this.cells,
                    maxPoints: C.maxPoints,
                })
                this.colorIndex = (this.colorIndex + 1) % this.palette.length
            }

            let color = p.color(walker.color)
            color = p.lerpColor(color, p.color(240), 1 - walker.life)

            if (this.style === 'rects') {
                p.fill(color)
                walker.points.forEach(([x, y]) => {
                    if (this.symmetry === 'rotation') {
                        this.rect(p, x, y)
                        this.rect(p, this.cells - y - 1, x)
                        this.rect(p, y, this.cells - x - 1)
                        this.rect(p, this.cells - x - 1, this.cells - y - 1)
                    } else {
                        this.rect(p, x, y)
                        this.rect(p, this.cells - x - 1, y)
                        this.rect(p, x, this.cells - y - 1)
                        this.rect(p, this.cells - x - 1, this.cells - y - 1)
                    }
                })
            } else {
                p.stroke(color)
                p.strokeWeight(this.sizeInner * 0.5)
                walker.points.forEach(([x, y], i) => {
                    if (i === 0) return
                    let [x1, y1] = walker.points[i - 1]

                    if (this.symmetry === 'rotation') {
                        this.line(p, x1, y1, x, y)
                        this.line(p, this.cells - y1 - 1, x1, this.cells - y - 1, x)
                        this.line(p, y1, this.cells - x1 - 1, y, this.cells - x - 1)
                        this.line(
                            p,
                            this.cells - x1 - 1,
                            this.cells - y1 - 1,
                            this.cells - x - 1,
                            this.cells - y - 1,
                        )
                    } else {
                        this.line(p, x1, y1, x, y)
                        this.line(p, this.cells - x1 - 1, y1, this.cells - x - 1, y)
                        this.line(p, x1, this.cells - y1 - 1, x, this.cells - y - 1)
                        this.line(
                            p,
                            this.cells - x1 - 1,
                            this.cells - y1 - 1,
                            this.cells - x - 1,
                            this.cells - y - 1,
                        )
                    }
                })
            }
        })

        if (
            this.walkers.length < this.walkersCount &&
            this.stepsCount - this.stepsLastAdd > this.stepsBetweenAdd
        ) {
            this.add()
        }

        p.pop()
    }

    rect = (p: p5, x: number, y: number) => {
        let pos = p.createVector(x, y)
        pos.sub(this.cells / 2, this.cells / 2)
            .mult(this.sizeInner)
            .add(this.sizeInner / 2, this.sizeInner / 2)
        p.rect(pos.x, pos.y, this.sizeInner * 0.9)
    }

    line = (p: p5, x1: number, y1: number, x2: number, y2: number) => {
        let pos1 = p.createVector(x1, y1)
        let pos2 = p.createVector(x2, y2)
        pos1.sub(this.cells / 2, this.cells / 2)
            .mult(this.sizeInner)
            .add(this.sizeInner / 2, this.sizeInner / 2)
        pos2.sub(this.cells / 2, this.cells / 2)
            .mult(this.sizeInner)
            .add(this.sizeInner / 2, this.sizeInner / 2)
        p.line(pos1.x, pos1.y, pos2.x, pos2.y)
    }

    // drawStackedCells = (p: p5, x: number, y: number, cells: (Cell | null)[]) => {
    //     cells.forEach((cell, i) => {
    //         if (!cell) return
    //         let size = (4 - i) * this.innerSize * 0.15 + this.innerSize * 0.18
    //         p.push()
    //         p.noStroke()
    //         p.translate(x * this.innerSize, y * this.innerSize)
    //         p.translate(this.innerSize * 0.5, this.innerSize * 0.5)
    //         let color = p.lerpColor(
    //             p.color(this.palette[cell.colorIndex]),
    //             p.color(255, 100),
    //             easings.inCubic(1 - cell.amount)
    //         )
    //         // let color = p.color(this.palette[cell.colorIndex])
    //         // color.setAlpha(cell.amount * 255)
    //         p.fill(color)
    //         p.rect(-size * 0.5, -size * 0.5, size, size)
    //         p.pop()
    //     })
    // }
}

new p5(
    (p: p5) => {
        let m: number
        let grids: Grid[] = []

        function setup() {
            m = p.min(p.width, p.height) * 0.9
            let grid = p.floor(m / C.count)
            let palette = paletteHex.map((c) => p.color(c))

            grids = []
            for (let x = -(C.count / 2); x < C.count / 2; x++) {
                for (let y = -(C.count / 2); y < C.count / 2; y++) {
                    grids.push(
                        new Grid({
                            pos: p.createVector((x + 0.5) * grid, (y + 0.5) * grid),
                            sizeOuter: grid * 0.9,
                            cells: C.countInner,
                            walkersCount: C.walkers,
                            palette: p.shuffle(palette),
                            symmetry: C.symmetry as 'reflection' | 'rotation',
                            style: C.style as 'lines' | 'rects',
                        }),
                    )
                }
            }
        }

        pane.addBinding(C, 'count', { min: 1, max: 10, step: 1 }).on('change', setup)
        pane.addBinding(C, 'countInner', { min: 1, max: 30, step: 1 }).on('change', setup)
        pane.addBinding(C, 'walkers', { min: 1, max: 10, step: 1 }).on('change', setup)
        pane.addBinding(C, 'maxPoints', { min: 1, max: 30, step: 1 }).on('change', setup)
        pane.addBinding(C, 'symmetry', {
            options: { reflection: 'reflection', rotation: 'rotation' },
        }).on('change', (e) => {
            grids.forEach((g) => (g.symmetry = e.value as 'reflection' | 'rotation'))
        })
        pane.addBinding(C, 'style', { options: { lines: 'lines', rects: 'rects' } }).on(
            'change',
            (e) => {
                grids.forEach((g) => (g.style = e.value as 'lines' | 'rects'))
            },
        )

        p.setup = function () {
            p.createCanvas(window.innerWidth, window.innerHeight)
            setup()
            p.frameRate(10)
            p.rectMode(p.CENTER)
        }

        p.draw = function () {
            p.background(250)
            p.translate(p.width / 2, p.height / 2)
            grids.forEach((g) => g.draw(p))
        }
    },
    document.getElementById('sketch') ?? undefined,
)
