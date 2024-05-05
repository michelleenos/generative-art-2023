import { random } from '~/helpers/utils'

export type Tile = {
    x: number
    y: number
    size: number
    progress: number
    color: string
    level: number
    inner: Tile[]
    index: number
    parent: Tile | null
}

type TileProps = {
    iterations: number
    minSize: number
    size: number
    speedAdd?: number
    palette: string[]
    method?: 'stack' | 'queue' | 'stack-rev' | 'queue-rev'
}
export class TilesEven {
    iterations: number
    minSize: number
    root: Tile
    size: number
    tileChanceMin = 0.7
    palette: string[]
    padding: number = 5
    lastTime: number | null = null
    lastAdd: number | null = null
    currentLevel = 1
    speedAdd = 10
    animating: Tile[] = []
    stackQueue: Tile[] = []
    method: 'stack' | 'queue' | 'stack-rev' | 'queue-rev' = 'stack'
    tileDuration: number

    constructor({ iterations = 3, minSize = 20, size, palette, speedAdd, method }: TileProps) {
        this.iterations = iterations
        this.minSize = minSize
        this.size = size
        this.palette = palette
        this.speedAdd = speedAdd || this.speedAdd
        this.tileDuration = 500
        this.method = method || this.method

        this.root = {
            x: 0,
            y: 0,
            size: this.size,
            progress: 0,
            color: palette[0],
            level: 0,
            inner: [],
            parent: null,
            index: 0,
        }

        this.makeTiles({ iterations: this.iterations, currentLevel: 1, tile: this.root })
        this.stackQueue.push(this.root)
    }

    makeTiles = ({
        iterations,
        currentLevel = 1,
        tileChance = 1,
        tile = this.root,
    }: {
        iterations: number
        currentLevel: number
        tileChance?: number
        tile: Tile
    }): void => {
        if (iterations === 0) return

        tile.inner = []

        let { x, y, size } = tile
        let divide = 2
        let step = (size - this.padding) / divide
        if (step < this.minSize) return

        let index = 0
        for (let yy = 0; yy < divide; yy++) {
            for (let xx = 0; xx < divide; xx++) {
                let newTile = {
                    x: x + this.padding + xx * step,
                    y: y + this.padding + yy * step,
                    size: step - this.padding,
                    progress: 0,
                    color: this.palette[currentLevel % this.palette.length],
                    level: currentLevel,
                    inner: [],
                    parent: tile,
                    index: index++,
                }

                if (Math.random() < tileChance) {
                    tile.inner.push(newTile)
                    this.makeTiles({
                        iterations: iterations - 1,
                        currentLevel: currentLevel + 1,
                        tile: newTile,
                        tileChance: Math.max(tileChance - 0.1, this.tileChanceMin),
                    })
                }
            }
        }
    }

    resetAnimation = () => {
        this.lastTime = null
        this.lastAdd = null
        this.stackQueue = [this.root]
    }

    drawTile = (ctx: CanvasRenderingContext2D, tile: Tile) => {
        let size = tile.size
        let cx = tile.x + tile.size / 2
        let cy = tile.y + tile.size / 2
        size *= Math.min(tile.progress, 1)
        let x = cx - size / 2
        let y = cy - size / 2

        ctx.fillStyle = tile.color
        ctx.beginPath()
        ctx.rect(x, y, size, size)
        ctx.fill()
    }

    draw = (ctx: CanvasRenderingContext2D, time: number): boolean => {
        if (!this.lastTime) this.lastTime = time
        if (!this.lastAdd) this.lastAdd = time

        let delta = time - this.lastTime
        let deltaAdd = time - this.lastAdd

        this.lastTime = time

        if (deltaAdd > 1000 / this.speedAdd) {
            this.lastAdd = time
            let tile =
                this.method === 'stack-rev' || this.method === 'queue'
                    ? this.stackQueue.shift()
                    : this.stackQueue.pop()

            if (tile) {
                if (tile.level !== this.currentLevel) this.currentLevel = tile.level
                this.animating.push(tile)
            }
        }

        let animating: Tile[] = []
        this.animating.forEach((tile) => {
            // tile.progress += delta / (1000 / (this.speedBase + tile.level))
            tile.progress += delta / this.tileDuration
            this.drawTile(ctx, tile)
            if (tile.progress >= 1) {
                tile.progress = 0
                if (this.method.endsWith('rev')) {
                    this.stackQueue.unshift(...tile.inner)
                } else {
                    this.stackQueue.push(...tile.inner)
                }
            } else {
                animating.push(tile)
            }
        })
        this.animating = animating

        if (!this.stackQueue.length && !this.animating.length) {
            this.resetAnimation()
            return true
        }

        return false
    }
}
