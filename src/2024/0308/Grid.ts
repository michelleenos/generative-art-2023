import { random } from '~/helpers/utils'

type Cell = { x: number; y: number; taken: boolean }
type Square = { x: number; y: number; size: number; progress: number; color: string }

export class Grid {
    #steps: number = 30
    #cellSize: number
    #size: number
    baseCells: Cell[][] = []
    palette: string[] = ['#ffffff', '#000000', '#404040']
    squares: Square[] = []
    growing: Square[] = []
    animateIndex = 0
    addPerSecond = 20
    lastTime: number | null = null
    lastAdd = 0
    gap: number = 3

    constructor({
        steps,
        size = window.innerWidth,
        palette,
        gap,
    }: { size?: number; palette?: string[]; steps?: number; gap?: number } = {}) {
        if (steps) this.#steps = steps
        if (gap) this.gap = gap
        if (palette) this.palette = palette

        this.#size = size
        this.#cellSize = size / this.#steps

        this.makeGrid()
    }

    makeGrid = () => {
        this.baseCells = []
        for (let xi = 0; xi < this.#steps; xi++) {
            let row: Cell[] = []
            for (let yi = 0; yi < this.#steps; yi++) {
                row.push({ x: xi * this.#cellSize, y: yi * this.#cellSize, taken: false })
            }
            this.baseCells.push(row)
        }
    }

    makeSquares = () => {
        let consecutiveFailures = 0
        let minSize = 3
        let maxSize = 6
        let maxFailures = 10

        this.squares = []

        while (minSize > 1) {
            let square = this.maybeFindSquare({ minSize, maxSize, maxTries: 100 })
            if (square) {
                this.squares.push(square)
                consecutiveFailures = 0
            } else {
                consecutiveFailures++
                if (consecutiveFailures >= maxFailures) {
                    minSize--
                    maxSize--
                    consecutiveFailures = 0
                }
            }
        }

        this.baseCells.forEach((row) => {
            row.forEach((cell) => {
                if (!cell.taken) {
                    this.squares.push({
                        x: cell.x,
                        y: cell.y,
                        size: this.#cellSize,
                        progress: 0,
                        color: random(this.palette),
                    })
                }
            })
        })
    }

    maybeFindSquare = ({
        maxTries = 100,
        currentTry = 0,
        minSize = 1,
        maxSize = 5,
    } = {}): Square | void => {
        if (currentTry >= maxTries) return

        let choiceX = Math.floor(random(this.#steps))
        let choiceY = Math.floor(random(this.#steps))
        let squareSizeIdeal = Math.floor(random(minSize, maxSize))
        let squareSize = 1

        let cell = this.baseCells[choiceX][choiceY]
        if (cell.taken) {
            return this.maybeFindSquare({ maxTries, currentTry: currentTry + 1, minSize, maxSize })
        }

        while (squareSize < squareSizeIdeal) {
            let canExpand = true
            let nextX = choiceX + squareSize
            let nextY = choiceY + squareSize
            if (nextX >= this.#steps || nextY >= this.#steps) break

            for (let yi = choiceY; yi <= nextY; yi++) {
                let nextCell = this.baseCells[nextX][yi]
                if (nextCell.taken) {
                    canExpand = false
                    break
                }
            }

            for (let xi = choiceX; xi <= nextX; xi++) {
                let nextCell = this.baseCells[xi][nextY]
                if (nextCell.taken) {
                    canExpand = false
                    break
                }
            }

            if (canExpand) squareSize++
            else break
        }

        if (squareSize < minSize) {
            return this.maybeFindSquare({ maxTries, currentTry: currentTry + 1, minSize, maxSize })
        }

        for (let xi = choiceX; xi < choiceX + squareSize; xi++) {
            for (let yi = choiceY; yi < choiceY + squareSize; yi++) {
                this.baseCells[xi][yi].taken = true
            }
        }

        return {
            x: cell.x,
            y: cell.y,
            size: squareSize * this.#cellSize,
            progress: 0,
            color: random(this.palette),
        }
    }

    drawBase = (ctx: CanvasRenderingContext2D) => {
        this.baseCells.forEach((row) => {
            row.forEach((cell) => {
                ctx.fillStyle = this.palette[0]
                ctx.strokeStyle = this.palette[1]
                ctx.beginPath()
                ctx.rect(cell.x, cell.y, this.#cellSize, this.#cellSize)
                ctx.fill()
                ctx.stroke()
            })
        })
    }

    drawSquares = (ctx: CanvasRenderingContext2D) => {
        this.squares.forEach((square) => {
            let size = square.size - this.gap
            let cx = square.x + square.size / 2
            let cy = square.y + square.size / 2
            let scale = Math.min(square.progress, 1)
            size *= scale
            let x = cx - size / 2
            let y = cy - size / 2

            ctx.fillStyle = square.color
            ctx.beginPath()
            ctx.rect(x, y, size, size)
            ctx.fill()
        })
    }

    drawSquaresAnimate = (ctx: CanvasRenderingContext2D, t: number): boolean => {
        if (!this.lastTime) this.lastTime = t
        let elapsed = t - this.lastTime
        this.lastTime = t

        let elapsedSinceAdd = t - this.lastAdd

        if (elapsedSinceAdd > 1000 / this.addPerSecond) {
            this.lastAdd = t
            let toDraw = Math.round(elapsedSinceAdd / (1000 / this.addPerSecond))

            for (let i = 0; i < toDraw; i++) {
                let square = this.squares[this.animateIndex]
                if (square) this.growing.push(square)
                this.animateIndex++
            }
        }

        this.growing.forEach((square) => {
            let duration = 1500
            square.progress += elapsed / duration
            let size = square.size - this.gap
            let cx = square.x + square.size / 2
            let cy = square.y + square.size / 2
            let scale = Math.min(square.progress, 1)
            size *= scale
            let x = cx - size / 2
            let y = cy - size / 2

            ctx.fillStyle = square.color
            ctx.beginPath()
            ctx.rect(x, y, size, size)
            ctx.fill()
        })

        this.growing = this.growing.filter((square) => square.progress < 1)

        if (this.animateIndex >= this.squares.length && this.growing.length === 0) {
            this.resetAnimation()
            return true
        }

        return false
    }

    resetAnimation = () => {
        this.lastTime = null
        this.lastAdd = 0
        this.animateIndex = 0
    }
}
