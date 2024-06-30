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

type TileWithTreeProps = Omit<Tile, 'inner' | 'parent'> & {
    treeX: number
    treeY: number
    treeWidth: number
    treeOffset: number
    inner: TileWithTreeProps[]
    parent?: TileWithTreeProps
}

type TileProps = { iterations: number; minSize: number; size: number; palette: string[] }
export class TilesEven {
    iterations: number
    minSize: number
    tiles: Tile
    size: number
    tileChanceMin = 0.7
    palette: string[]
    padding: number = 10

    constructor({ iterations = 3, minSize = 20, size, palette }: TileProps) {
        this.iterations = iterations
        this.minSize = minSize
        this.size = size
        this.palette = palette

        this.tiles = {
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

        this.makeTiles({ iterations: this.iterations, currentLevel: 1, tile: this.tiles })
    }

    makeTiles = ({
        iterations,
        currentLevel = 1,
        tileChance = 1,
        tile = this.tiles,
    }: {
        iterations: number
        currentLevel: number
        tileChance?: number
        tile: Tile
    }): void => {
        if (iterations === 0) return

        tile.inner = []

        let { x, y, size } = tile
        // let divide = Math.floor(Math.random() * 4) + 2
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
}

const makeTileTree = (
    tile: Tile,
    width: number,
    offset: number = 0,
    parent?: TileWithTreeProps
) => {
    let treeX = width / 2 + offset
    let treeY = (tile.level + 1) * 100

    let childWidth = width / tile.inner.length

    let treeTile: TileWithTreeProps = {
        ...tile,
        treeX,
        treeY,
        treeWidth: width,
        treeOffset: offset,
        parent,
        inner: [],
    }

    treeTile.inner = tile.inner.map((child, i) => {
        let childOffset = i * childWidth + offset + childWidth * 0.1
        return makeTileTree(child, childWidth * 0.8, childOffset, treeTile)
    })

    return treeTile
}

export class TilesDraw {
    tilesEven: TilesEven
    tilesWithTree: TileWithTreeProps
    lastTime: number | null = null
    lastAdd: number | null = null
    addSpeed = 1000 / 10
    gap: number = 15
    animating: TileWithTreeProps[] = []
    stackQueue: TileWithTreeProps[] = []
    // stack: TileWithTreeProps[] = []
    // queue: TileWithTreeProps[] = []
    gfxTile: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }
    grxTree: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }
    // size: number
    treeWidth: number
    treeHeight: number
    mainSize: number
    methodIn: 'push' | 'unshift' = 'push'
    methodOut: 'pop' | 'shift' = 'pop'

    constructor(tiles: TilesEven) {
        // this.size = width
        this.mainSize = tiles.size
        this.treeWidth = tiles.size * 2
        this.treeHeight = tiles.size * 2
        this.tilesEven = tiles
        // this.animating = [this.tiles]
        this.tilesWithTree = makeTileTree(this.tilesEven.tiles, this.treeWidth)
        this.animating = [this.tilesWithTree]
        this.stackQueue = [this.tilesWithTree]

        let tileCanvas = document.createElement('canvas')
        tileCanvas.width = this.tilesEven.size
        tileCanvas.height = this.tilesEven.size
        this.gfxTile = {
            canvas: tileCanvas,
            ctx: tileCanvas.getContext('2d')!,
        }

        let treeCanvas = document.createElement('canvas')
        treeCanvas.width = this.treeWidth
        treeCanvas.height = this.treeHeight
        this.grxTree = {
            canvas: treeCanvas,
            ctx: treeCanvas.getContext('2d')!,
        }
    }

    drawTree = (ctx: CanvasRenderingContext2D, tile: TileWithTreeProps) => {
        let treeCtx = this.grxTree.ctx

        let drawTreeStep = (tile: TileWithTreeProps) => {
            treeCtx.fillStyle = tile.color
            treeCtx.beginPath()
            treeCtx.arc(tile.treeX, tile.treeY, Math.max((5 - tile.level) * 5, 5), 0, 2 * Math.PI)
            treeCtx.fill()
            tile.inner.forEach((child) => {
                drawTreeStep(child)
            })
        }

        drawTreeStep(tile)
        // let mid = this.size / 2
        // let mid = this.mainSize

        ctx.globalAlpha = 0.4
        ctx.drawImage(this.grxTree.canvas, this.mainSize, 0, this.treeWidth, this.treeHeight)
        ctx.globalAlpha = 1
        treeCtx.clearRect(0, 0, this.treeWidth, this.treeHeight)
    }

    drawWithoutGrow = (ctx: CanvasRenderingContext2D, time: number): boolean => {
        if (!this.lastTime) this.lastTime = time
        if (!this.lastAdd) this.lastAdd = time

        this.lastTime = time

        let deltaSinceAdded = time - this.lastAdd
        if (deltaSinceAdded > this.addSpeed) {
            this.lastAdd = time
            let tile = this.methodOut === 'pop' ? this.stackQueue.pop() : this.stackQueue.shift()
            // tile && this.animating.push(tile)
            if (tile) {
                let size = tile.size
                let cx = tile.x + tile.size / 2
                let cy = tile.y + tile.size / 2
                let y = cy - size / 2
                let x = cx - size / 2

                let tileCtx = this.gfxTile.ctx
                tileCtx.fillStyle = tile.color
                tileCtx.beginPath()
                tileCtx.rect(x, y, size, size)
                tileCtx.fill()

                let treeCtx = this.grxTree.ctx
                treeCtx.fillStyle = tile.color
                treeCtx.beginPath()
                let radius = Math.max((5 - tile.level) * 5, 5)
                treeCtx.ellipse(tile.treeX, tile.treeY, radius, radius, 0, 0, Math.PI * 2)
                treeCtx.fill()

                if (tile.parent) {
                    treeCtx.strokeStyle = tile.color
                    treeCtx.lineWidth = 0.5
                    treeCtx.beginPath()
                    treeCtx.moveTo(tile.treeX, tile.treeY)
                    treeCtx.lineTo(tile.parent.treeX, tile.parent.treeY)
                    treeCtx.stroke()
                }

                this.methodIn === 'push'
                    ? this.stackQueue.push(...tile.inner)
                    : this.stackQueue.unshift(...tile.inner)
            }
        }

        ctx.drawImage(this.gfxTile.canvas, 0, 0, this.mainSize, this.mainSize)
        ctx.drawImage(this.grxTree.canvas, this.mainSize, 0, this.treeWidth, this.treeHeight)

        if (!this.stackQueue.length) {
            this.reset()
            return true
        }

        return false
    }

    reset = () => {
        this.lastTime = null
        this.lastAdd = null
        this.animating = [this.tilesWithTree]
        this.stackQueue = [this.tilesWithTree]
    }
}
