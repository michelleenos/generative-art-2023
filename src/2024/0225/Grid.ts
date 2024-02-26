import { random } from '~/helpers/utils'

export type Cell = {
    posx: number
    posy: number
    x: number
    y: number
    weight: number
    neighbors: Cell[]
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

        console.log(this.cells)
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
                let neighbors = [
                    left !== null && this.cells[left][y],
                    up !== null && this.cells[x][up],
                    right !== null && this.cells[right][y],
                    down !== null && this.cells[x][down],

                    left !== null && up !== null && this.cells[left][up],
                    left !== null && down !== null && this.cells[left][down],
                    right !== null && up !== null && this.cells[right][up],
                    right !== null && down !== null && this.cells[right][down],
                ]

                cell.neighbors.push(...(neighbors.filter((n) => n) as Cell[]))
                cell.weight = cell.neighbors.length
            }
        }
    }

    weighLess(cell: Cell): void
    weighLess(x: number, y: number): void
    weighLess(xOrCell: number | Cell, y?: number) {
        let cell = typeof xOrCell === 'number' ? this.cells[xOrCell][y!] : xOrCell
        cell.weight = Math.max(1, cell.weight - 4)
        cell.neighbors.forEach((ncell) => {
            ncell.weight = Math.max(1, ncell.weight - 1)
        })
        // for (let ix = -1; ix <= 1; ix++) {
        //     for (let iy = -1; iy <= 1; iy++) {
        //         let cx = x + ix
        //         let cy = y + iy
        //         if (this.cells[cx] && this.cells[cx][cy]) {
        //             let weight = this.cells[cx][cy].weight
        //             this.cells[cx][cy].weight = Math.max(1, weight - 1)
        //         }
        //     }
        // }
    }

    weighMore(cell: Cell): void
    weighMore(x: number, y: number): void
    weighMore(xOrCell: number | Cell, y?: number) {
        let cell = typeof xOrCell === 'number' ? this.cells[xOrCell][y!] : xOrCell
        cell.weight = Math.min(8, cell.weight + 1)
        cell.neighbors.forEach((ncell) => {
            ncell.weight = Math.min(8, ncell.weight + 1)
        })
    }

    getNextWeighted(cell: Cell): Cell
    getNextWeighted(x: number, y: number): Cell
    getNextWeighted(xOrCell: number | Cell, y?: number) {
        let cell = typeof xOrCell === 'number' ? this.cells[xOrCell][y!] : xOrCell
        let options: Cell[] = []
        cell.neighbors.forEach((ncell) => {
            for (let i = 0; i < ncell.weight; i++) {
                options.push(ncell)
            }
        })

        return random(options)
    }

    getRandom = () => {
        let x = Math.floor(Math.random() * this.count.x)
        let y = Math.floor(Math.random() * this.count.y)
        return this.cells[x][y]
    }
}
