import '~/style.css'
import createCanvas from '~/helpers/create-canvas'
import { Sizes } from '~/helpers/sizes'
import { ReflectOption, Tile } from '../tiles'
import { GUI } from 'lil-gui'

const sizes = new Sizes()

let { ctx } = createCanvas(sizes.width, sizes.height)

type FriezeFn = (ctx: CanvasRenderingContext2D, tile: HTMLCanvasElement) => void
type FriezeName = 'hop' | 'jump' | 'sidle' | 'step' | 'spinHop' | 'spinSidle' | 'spinJump'

const params = {
    showTile: true,
    showTileDraw: true,
    doubled: false,
    corners: true,
    cornersReflect: 'h-down' as ReflectOption,
    drawing: 'triangles',
    frieze: 'jump' as FriezeName,
    tileWidth: 90,
    tileHeight: 60,
}

// hop:       ∞∞   | p1 / p111         | just translation
// jump:      ∞*   | p11m?             | translation + horizontal mirror reflection
// sidle:     *∞∞  | p1m1?  pm11?      | translation + vertical mirror reflection
// step:      ∞×   | p1g1 ? p11g?      | glide reflection / translation
// spinhop:   22∞  | p112? p211? p2?   | translation + half turn
// spinsidle: 2*∞  | p2mg / pmg2?      | translation, half turn, vertical reflection, glide reflection
// spinjump:  *22∞ | p2mm              | translation, horizontal + vertical reflection, glide reflection, order 2 rotations

const frieze: Record<FriezeName, FriezeFn> & {
    outline: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
} = {
    outline(ctx: CanvasRenderingContext2D, w: number, h: number) {
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(0, 0, w, h)
    },
    // ∞∞ | just translation | p1 / p111
    hop(ctx: CanvasRenderingContext2D, tile: HTMLCanvasElement) {
        let { width: w, height: h } = tile
        w /= sizes.pixelRatio
        h /= sizes.pixelRatio

        for (let x = 0; x < sizes.width; x += w) {
            ctx.save()
            ctx.translate(x, 0)
            this.outline(ctx, w, h)
            ctx.drawImage(tile, 0, 0, w, h)
            ctx.restore()
        }
    },
    // ∞* | translation + horizontal mirror reflection | p11m / pm11
    jump(ctx: CanvasRenderingContext2D, tile: HTMLCanvasElement) {
        let { width: w, height: h } = tile
        w /= sizes.pixelRatio
        h /= sizes.pixelRatio

        ctx.save()
        const reflectStep = () => {
            ctx.drawImage(tile, 0, 0, w, h)
            this.outline(ctx, w, h)

            ctx.translate(0, h * 2 - 1)
            ctx.scale(1, -1)
            ctx.drawImage(tile, 0, 0, w, h)
            this.outline(ctx, w, h)
        }

        let i = 0
        for (let x = 0; x < sizes.width; x += w) {
            ctx.save()
            ctx.translate(x, 0)
            reflectStep()
            ctx.restore()
            i++
        }

        ctx.restore()
    },
    // *∞∞ | translation + vertical mirror reflection | p1m1
    sidle(ctx: CanvasRenderingContext2D, tile: HTMLCanvasElement) {
        let { width: w, height: h } = tile
        w /= sizes.pixelRatio
        h /= sizes.pixelRatio

        ctx.save()
        const reflectStep = () => {
            ctx.drawImage(tile, 0, 0, w, h)
            this.outline(ctx, w, h)

            ctx.translate(w * 2 - 1, 0)
            ctx.scale(-1, 1)

            ctx.drawImage(tile, 0, 0, w, h)
            this.outline(ctx, w, h)
        }

        for (let x = 0; x < sizes.width; x += w * 2) {
            ctx.save()
            ctx.translate(x, 0)
            reflectStep()
            ctx.restore()
        }

        ctx.restore()
    },
    // ∞× | glide reflection / translation | p11g / p1a1?
    step(ctx: CanvasRenderingContext2D, tile: HTMLCanvasElement) {
        let { width: w, height: h } = tile
        w /= sizes.pixelRatio
        h /= sizes.pixelRatio

        for (let x = 0, i = 0; x < sizes.width; x += w, i++) {
            ctx.save()
            ctx.translate(x, 0)
            if (i % 2 === 1) {
                ctx.translate(0, h)
                ctx.scale(1, -1)
            }

            ctx.drawImage(tile, 0, 0, w, h)
            this.outline(ctx, w, h)
            ctx.restore()
        }
    },
    // 22∞ | translation + half turn | p2
    spinHop(ctx: CanvasRenderingContext2D, tile: HTMLCanvasElement) {
        let { width: w, height: h } = tile
        w /= sizes.pixelRatio
        h /= sizes.pixelRatio

        const reflectStep = () => {
            ctx.drawImage(tile, 0, 0, w, h)
            this.outline(ctx, w, h)

            // ctx.translate(w, h * 0.5)
            ctx.translate(w, h * 0.5)
            ctx.rotate(Math.PI)
            ctx.translate(-w, -h * 0.5)
            ctx.drawImage(tile, 0, 0, w, h)
            this.outline(ctx, w, h)
        }

        for (let x = 0; x < sizes.width; x += w * 2) {
            ctx.save()
            ctx.translate(x, 0)
            reflectStep()
            ctx.restore()
        }
    },
    // 2*∞ | translation, half turn, vertical reflection, glide reflection | p2mg / pma2?
    spinSidle(ctx: CanvasRenderingContext2D, tile: HTMLCanvasElement) {
        let { width: w, height: h } = tile
        w /= sizes.pixelRatio
        h /= sizes.pixelRatio

        const reflectStep = () => {
            ctx.drawImage(tile, 0, 0, w, h)
            this.outline(ctx, w, h)

            ctx.translate(w * 2, 0)
            ctx.scale(-1, 1)
            ctx.drawImage(tile, 0, 0, w, h)
            this.outline(ctx, w, h)
        }

        for (let x = 0, i = 0; x < sizes.width; x += w * 2, i++) {
            ctx.save()
            ctx.translate(x, 0)
            if (i % 2 === 1) {
                ctx.translate(0, h * 0.5)
                ctx.scale(1, -1)
                ctx.translate(0, -h * 0.5)
            }
            reflectStep()
            ctx.restore()
        }
    },
    // *22∞ | translation, horizontal + vertical reflection, glide reflection, order 2 rotations | p2mm
    spinJump(ctx: CanvasRenderingContext2D, tile: HTMLCanvasElement) {
        let { width: w, height: h } = tile
        w /= sizes.pixelRatio
        h /= sizes.pixelRatio

        const reflectStep = () => {
            ctx.drawImage(tile, 0, 0, w, h)
            this.outline(ctx, w, h)

            ctx.translate(w * 2, 0)
            ctx.scale(-1, 1)
            ctx.drawImage(tile, 0, 0, w, h)
            this.outline(ctx, w, h)

            ctx.translate(0, h * 2)
            ctx.scale(1, -1)
            ctx.drawImage(tile, 0, 0, w, h)
            this.outline(ctx, w, h)

            ctx.translate(w * 2, 0)
            ctx.scale(-1, 1)
            ctx.drawImage(tile, 0, 0, w, h)
            this.outline(ctx, w, h)
        }

        for (let x = 0; x < sizes.width; x += w * 2) {
            ctx.save()
            ctx.translate(x, 0)
            reflectStep()
            ctx.restore()
        }
    },
}

type DrawingOpts = {
    doubled?: boolean
    width?: number
    height?: number
    corners?: boolean
    reflect?: ReflectOption
}
type DrawingFn = (params: DrawingOpts) => {
    tileDraw: Tile
    tile: Tile
}

const drawings: { [key: string]: DrawingFn } = {
    triangles: ({ doubled = false, corners, reflect, width = 130, height = 130 } = {}) => {
        let tileWidth = width
        let tileHeight = height

        let tile = new Tile(tileWidth, tileHeight, sizes.pixelRatio)
        let tileDraw = new Tile(tileWidth * 2, tileHeight * 2, sizes.pixelRatio)

        tileDraw.scale(0.7)
        tileDraw.translate(0.1, 0)
        tileDraw.triangle(0.3)
        tileDraw.stroke()

        if (doubled) {
            tileDraw.translate(0.35, -0.15)
            tileDraw.ctx.rotate(Math.PI * 0.125)
            tileDraw.triangle(0.2)
            tileDraw.stroke()
        }
        if (corners) {
            tile.tileToCorners(tileDraw, { reflect })
        } else {
            tile.imageFill(tileDraw.canvas)
        }

        return { tile, tileDraw }
    },
    ornate: ({ doubled = false, corners, reflect = 'v-left', width = 90, height = 60 } = {}) => {
        let tileWidth = width
        let tileHeight = height
        let tile = new Tile(tileWidth, tileHeight, sizes.pixelRatio)
        let tileDraw = new Tile(tileWidth * 2, tileHeight * 2, sizes.pixelRatio)
        tileDraw.leaf(1, 0.5, 0.5, 0.73)
        tileDraw.stroke()
        if (doubled) {
            tileDraw.flipVertical()
            tileDraw.leaf(1, 0.5, 0.5, 0.73)
            tileDraw.stroke()
        }

        // changing reflect here makes other cool patterns
        if (corners) {
            tile.tileToCorners(tileDraw, { reflect })
        } else {
            tile.imageFill(tileDraw.canvas)
        }

        // return tileDraw
        // spinJump is good
        return { tile, tileDraw }
    },
    debg: ({ width = 90, height = 60, corners, reflect } = {}) => {
        let tileWidth = width
        let tileHeight = height
        let tile = new Tile(tileWidth, tileHeight, sizes.pixelRatio)
        let tileDraw = new Tile(tileWidth * 2, tileHeight * 2, sizes.pixelRatio)
        tileDraw.debugCirc()

        if (corners) {
            tile.tileToCorners(tileDraw, { reflect })
        } else {
            tile.imageFill(tileDraw.canvas)
        }

        return { tile, tileDraw }
    },
}

function draw() {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, sizes.width, sizes.height)
    ctx.save()

    let { tile, tileDraw } = drawings[params.drawing]({
        doubled: params.doubled,
        reflect: params.cornersReflect,
        corners: params.corners,
        width: params.tileWidth,
        height: params.tileHeight,
    })
    ctx.save()
    ctx.translate(0, sizes.height * 0.1)
    frieze[params.frieze](ctx, tile.canvas)
    ctx.restore()

    let { w: tileWidth, h: tileHeight } = tile

    if (params.showTile) {
        ctx.drawImage(tile.canvas, 200, 500, tileWidth, tileHeight)
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.rect(200, 500, tileWidth, tileHeight)
        ctx.stroke()
    }
    if (params.showTileDraw) {
        ctx.drawImage(tileDraw.canvas, 400, 500, tileWidth * 2, tileHeight * 2)
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.rect(400, 500, tileWidth * 2, tileHeight * 2)
        ctx.moveTo(400 + tileWidth, 500)
        ctx.lineTo(400 + tileWidth, 500 + tileHeight * 2)
        ctx.moveTo(400, 500 + tileHeight)
        ctx.lineTo(400 + tileWidth * 2, 500 + tileHeight)
        ctx.stroke()
    }

    ctx.restore()
}

const gui = new GUI().onChange(draw)
gui.add(params, 'showTile')
gui.add(params, 'showTileDraw')
gui.add(params, 'doubled')
gui.add(params, 'corners')
gui.add(params, 'cornersReflect', ['none', 'h-down', 'h-up', 'v-left', 'v-right'])
gui.add(params, 'drawing', ['triangles', 'ornate', 'debg'])
gui.add(params, 'frieze', {
    'f1 / ∞∞ / p1': 'hop',
    'f2 / ∞× / p11g': 'step',
    'f3 / *∞∞ / p1m1 ': 'sidle',
    'f4 / 22∞ / p2': 'spinHop',
    'f5 / p2mg': 'spinSidle',
    'f6 / ∞* / p11m': 'jump',
    'f7 / *22∞ / p2mm': 'spinJump',
})
gui.add(params, 'tileWidth', 10, 500, 1)
gui.add(params, 'tileHeight', 10, 500, 1)

draw()
