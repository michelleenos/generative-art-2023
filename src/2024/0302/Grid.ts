import { random } from '~/helpers/utils'
import p5 from 'p5'

export type Cell = {
    posx: number
    posy: number
    x: number
    y: number
    weight: number
    gravity: number
    neighbors: Cell[]
}

export class Grid {
    cells: Cell[][] = []
    _size: number
    _count: number
    _divSize: number
    angles: 90 | 45

    constructor(size: number, count: number, angles: 90 | 45 = 45) {
        this._size = size
        this._count = count
        this._divSize = size / this._count
        this.angles = angles

        this.setCells()
        this.setCellNeighbors()
    }

    get divSize() {
        return this._divSize
    }
    get size() {
        return this._size
    }
    set size(s: number) {
        this._size = s
        this._divSize = s / this._count
        this.setCells()
        this.setCellNeighbors()
    }

    setCells = () => {
        this.cells = []

        for (let x = 0; x < this._count; x++) {
            let row: Cell[] = []
            for (let y = 0; y < this._count; y++) {
                row.push({
                    posx: (x - this._count / 2 + 0.5) * this._divSize,
                    posy: (y - this._count / 2 + 0.5) * this._divSize,
                    x,
                    y,
                    weight: 1,
                    neighbors: [],
                    gravity: 1,
                })
            }
            this.cells.push(row)
        }
    }

    drawCells = (p: p5, showGravity = false) => {
        this.cells.forEach((row) => {
            row.forEach((cell) => {
                p.push()
                p.translate(cell.posx, cell.posy)
                p.fill(255, 20)
                p.rect(0, 0, p.min(this._divSize, this._divSize) * 0.8)

                if (showGravity) {
                    p.fill(255)
                    p.text('g: ' + cell.gravity, 0, 0)
                    p.text('w: ' + cell.weight, 0, 10)
                }

                p.pop()
            })
        })
    }

    setCellNeighbors = () => {
        for (let x = 0; x < this._count; x++) {
            let left = x > 0 ? x - 1 : null
            let right = x < this._count - 1 ? x + 1 : null

            for (let y = 0; y < this._count; y++) {
                let up = y > 0 ? y - 1 : null
                let down = y < this._count - 1 ? y + 1 : null

                let cell = this.cells[x][y]
                cell.neighbors = []
                left !== null && cell.neighbors.push(this.cells[left][y])
                up !== null && cell.neighbors.push(this.cells[x][up])
                right !== null && cell.neighbors.push(this.cells[right][y])
                down !== null && cell.neighbors.push(this.cells[x][down])

                if (this.angles === 45) {
                    left !== null && up !== null && cell.neighbors.push(this.cells[left][up])
                    left !== null && down !== null && cell.neighbors.push(this.cells[left][down])
                    right !== null && up !== null && cell.neighbors.push(this.cells[right][up])
                    right !== null && down !== null && cell.neighbors.push(this.cells[right][down])
                }

                cell.weight = 1
                cell.gravity = cell.neighbors.length + 1
            }
        }
    }

    weighLess(cell: Cell): void
    weighLess(x: number, y: number): void
    weighLess(xOrCell: number | Cell, y?: number) {
        let cell = typeof xOrCell === 'number' ? this.cells[xOrCell][y!] : xOrCell
        cell.weight = Math.max(0, cell.weight - 1)
    }

    weighMore(cell: Cell): void
    weighMore(x: number, y: number): void
    weighMore(xOrCell: number | Cell, y?: number) {
        let cell = typeof xOrCell === 'number' ? this.cells[xOrCell][y!] : xOrCell
        cell.weight = Math.min(2, cell.weight + 1)
    }

    updateGravity(cell: Cell): void
    updateGravity(x: number, y: number): void
    updateGravity(xOrCell: number | Cell, y?: number) {
        let cell = typeof xOrCell === 'number' ? this.cells[xOrCell][y!] : xOrCell
        cell.gravity = cell.neighbors.reduce((gravity, neighbor) => gravity + neighbor.weight, 1)
    }

    getNext(cell: Cell): Cell
    getNext(x: number, y: number): Cell
    getNext(xOrCell: number | Cell, y?: number) {
        let cell = typeof xOrCell === 'number' ? this.cells[xOrCell][y!] : xOrCell
        let options: Cell[] = []
        cell.neighbors.forEach((neighbor) => {
            options.push(neighbor)
        })
        if (options.length === 0) {
            return
        }
        return random(options)
    }

    getNextWeighted(cell: Cell): Cell
    getNextWeighted(x: number, y: number): Cell
    getNextWeighted(xOrCell: number | Cell, y?: number) {
        let cell = typeof xOrCell === 'number' ? this.cells[xOrCell][y!] : xOrCell
        let options: Cell[] = []

        cell.neighbors.forEach((neighbor) => {
            if (neighbor.weight > 0) {
                this.updateGravity(neighbor)
                for (let i = 0; i < neighbor.gravity; i++) {
                    options.push(neighbor)
                }
            }
        })
        if (options.length === 0) return

        return random(options)
    }

    getRandom = () => {
        let x = Math.floor(Math.random() * this._count)
        let y = Math.floor(Math.random() * this._count)
        return this.cells[x][y]
    }
}
