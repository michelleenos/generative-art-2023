import { random } from '~/helpers/utils'

export type Cell = {
    posx: number
    posy: number
    x: number
    y: number
    weight: number
    gravity: number
    neighbors: Cell[]
    neighbors90: Cell[]
}

export class Grid {
    cells: Cell[][] = []
    width: number
    height: number
    count: { x: number; y: number }
    cellSize: { x: number; y: number }

    constructor(width: number, height: number, countX: number, countY: number) {
        this.width = width
        this.height = height
        this.count = { x: countX, y: countY }
        this.cellSize = { x: width / countX, y: height / countY }

        this.setCells()
        this.setCellNeighbors()
    }

    setCells = () => {
        this.cells = []

        for (let x = 0; x < this.count.x; x++) {
            let row: Cell[] = []
            for (let y = 0; y < this.count.y; y++) {
                let edgeX = x === 0 || x === this.count.x - 1
                let edgeY = y === 0 || y === this.count.y - 1
                let weight = edgeX && edgeY ? 3 : edgeX || edgeY ? 5 : 8
                row.push({
                    posx: (x - this.count.x / 2 + 0.5) * this.cellSize.x,
                    posy: (y - this.count.y / 2 + 0.5) * this.cellSize.y,
                    x,
                    y,
                    weight,
                    neighbors: [],
                    neighbors90: [],
                    gravity: 1,
                })
            }
            this.cells.push(row)
        }
    }

    setCellNeighbors = () => {
        for (let x = 0; x < this.count.x; x++) {
            let left = x > 0 ? x - 1 : null
            let right = x < this.count.x - 1 ? x + 1 : null
            for (let y = 0; y < this.count.y; y++) {
                let up = y > 0 ? y - 1 : null
                let down = y < this.count.y - 1 ? y + 1 : null

                let cell = this.cells[x][y]
                let neighbors90 = [
                    left !== null && this.cells[left][y],
                    up !== null && this.cells[x][up],
                    right !== null && this.cells[right][y],
                    down !== null && this.cells[x][down],
                ]

                let neighborsAll = [
                    ...neighbors90,
                    left !== null && up !== null && this.cells[left][up],
                    left !== null && down !== null && this.cells[left][down],
                    right !== null && up !== null && this.cells[right][up],
                    right !== null && down !== null && this.cells[right][down],
                ]

                cell.neighbors90.push(...(neighbors90.filter((n) => n) as Cell[]))
                cell.neighbors.push(...(neighborsAll.filter((n) => n) as Cell[]))
                cell.weight = 1
                cell.gravity = cell.neighbors.length + 1
            }
        }
    }

    weighLess(cell: Cell): void
    weighLess(x: number, y: number): void
    weighLess(xOrCell: number | Cell, y?: number) {
        let cell = typeof xOrCell === 'number' ? this.cells[xOrCell][y!] : xOrCell
        let prevWeight = cell.weight
        cell.weight = Math.max(0, prevWeight - 1)
        // cell.neighbors.forEach((n) => (n.gravity = Math.max(n.gravity - prevWeight, 1)))
        cell.neighbors90.forEach((n) => n.gravity--)
    }

    weighMore(cell: Cell): void
    weighMore(x: number, y: number): void
    weighMore(xOrCell: number | Cell, y?: number) {
        let cell = typeof xOrCell === 'number' ? this.cells[xOrCell][y!] : xOrCell
        let prevWeight = cell.weight
        cell.weight = Math.min(2, prevWeight + 1)
        cell.neighbors90.forEach(
            // (n) => (n.gravity = Math.min(n.gravity + (cell.weight - prevWeight), 8))
            (n) => n.gravity++
        )
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
        cell.neighbors90.forEach((neighbor) => {
            options.push(neighbor)
        })
        if (options.length === 0) {
            console.log('no options', cell)
            return
        }
        return random(options)
    }

    getNextWeighted(cell: Cell): Cell
    getNextWeighted(x: number, y: number): Cell
    getNextWeighted(xOrCell: number | Cell, y?: number) {
        let cell = typeof xOrCell === 'number' ? this.cells[xOrCell][y!] : xOrCell
        let options: Cell[] = []

        cell.neighbors90.forEach((neighbor) => {
            if (neighbor.weight > 0) {
                for (let i = 0; i < neighbor.gravity; i++) {
                    options.push(neighbor)
                }
            }
        })
        if (options.length === 0) {
            console.log('no options', cell)
            return
        }

        return random(options)
    }

    getRandom = () => {
        let x = Math.floor(Math.random() * this.count.x)
        let y = Math.floor(Math.random() * this.count.y)
        return this.cells[x][y]
    }
}
