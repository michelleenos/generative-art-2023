import { random, shuffle } from '~/helpers/utils'

type Cell = { x: number; y: number; taken: boolean }
type Square = {
    x: number
    y: number
    size: number
    progress: number
    color: string
    increaseAddSpeed?: boolean
}

export class Grid {
    #steps: number = 30
    #cellSize: number
    #size: number
    baseCells: Cell[][] = []
    palette: string[] = ['#ffffff', '#000000', '#404040']
    squares: Square[] = []
    growing: Square[] = []
    animateIndex = 0
    addPerSecond: number
    addPerSecondCurrent: number
    lastTime: number | null = null
    lastAdd: number | null = null
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
        this.addPerSecond = this.#steps
        this.addPerSecondCurrent = this.addPerSecond

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

        let lastSquares: Square[] = []
        this.baseCells.forEach((row) => {
            row.forEach((cell) => {
                if (!cell.taken) {
                    lastSquares.push({
                        x: cell.x,
                        y: cell.y,
                        size: this.#cellSize,
                        progress: 0,
                        color: random(this.palette),
                    })
                }
            })
        })

        lastSquares = shuffle(lastSquares)
        this.squares.push(...lastSquares)
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
        this.squares.forEach((square) => this.drawSquare(ctx, square))
    }

    drawSquare = (ctx: CanvasRenderingContext2D, square: Square, useProgress = true) => {
        let size = square.size - this.gap
        let cx = square.x + square.size / 2
        let cy = square.y + square.size / 2
        if (useProgress) {
            size *= Math.min(square.progress, 1)
        }
        let x = cx - size / 2
        let y = cy - size / 2

        ctx.fillStyle = square.color
        ctx.beginPath()
        ctx.rect(x, y, size, size)
        ctx.fill()
    }

    drawSquaresAnimate = (ctx: CanvasRenderingContext2D, t: number): boolean => {
        if (!this.lastTime) this.lastTime = t
        if (!this.lastAdd) this.lastAdd = t
        let elapsed = t - this.lastTime
        let elapsedSinceAdd = t - this.lastAdd
        this.lastTime = t
        let ms = 1000 / this.addPerSecondCurrent

        if (elapsedSinceAdd > ms) {
            this.lastAdd = t
            let toDraw = Math.round(elapsedSinceAdd / ms)

            for (let i = 0; i < toDraw; i++) {
                let square = this.squares[this.animateIndex]
                if (square) {
                    this.growing.push(square)
                    if (square.increaseAddSpeed) {
                        this.addPerSecondCurrent *= 2
                    }
                }
                this.animateIndex++
            }
        }

        this.growing.forEach((square) => {
            square.progress += elapsed / 1500
            this.drawSquare(ctx, square)
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
        this.addPerSecondCurrent = this.addPerSecond
    }

    resize = (newSize: number) => {
        let oldSize = this.#size
        this.#size = newSize
        this.#cellSize = newSize / this.#steps
        this.baseCells.forEach((row) => {
            row.forEach((cell) => {
                cell.x = (cell.x / oldSize) * newSize
                cell.y = (cell.y / oldSize) * newSize
            })
        })

        this.squares.forEach((sqr) => {
            sqr.x = (sqr.x / oldSize) * newSize
            sqr.y = (sqr.y / oldSize) * newSize
            sqr.size = (sqr.size / oldSize) * newSize
        })
    }
}
