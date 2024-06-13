import '../../style.css'
import createCanvas from '../../helpers/canvas/createCanvas'
import { Sizes } from '~/helpers/sizes'
import { Tile } from './tiles'
import { GUI } from 'lil-gui'

const sizes = new Sizes()

let { ctx, canvas, resizeCanvas } = createCanvas(sizes.width, sizes.height)

const frieze = {
    outline(ctx: CanvasRenderingContext2D, w: number, h: number) {
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(0, 0, w, h)
    },
    // ∞∞ | just translation
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
    // ∞* | translation + horizontal mirror reflection
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
    // *∞∞ | translation + vertical mirror reflection
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
    // ∞× | glide reflection / translation
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

    // 22∞ | translation + half turn
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
    // 2*∞ | translation, half turn, vertical reflection, glide reflection
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
    // *22∞ | translation, horizontal + vertical reflection, glide reflection, order 2 rotations
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

const drawings = {
    wings: () => {
        let tileWidth = 130
        let tileHeight = 130

        let tile = new Tile(tileWidth, tileHeight, sizes.pixelRatio)
        let tileDraw = new Tile(tileWidth * 2, tileHeight * 2, sizes.pixelRatio)

        tileDraw.scale(0.7)
        tileDraw.translate(0.5, -0.15)
        tileDraw.ctx.rotate(Math.PI * 0.125)
        tileDraw.triangle()
        tileDraw.stroke()
        tile.tileToCorners(tileDraw, { reflect: 'h-down' })

        return tile
    },
    ornate: (double = false) => {
        let tileWidth = 90
        let tileHeight = 60
        let tile = new Tile(tileWidth, tileHeight, sizes.pixelRatio)
        let tileDraw = new Tile(tileWidth * 2, tileHeight * 2, sizes.pixelRatio)
        if (double) {
            tileDraw.leaf(1, 0.5, 0.5, 0.73)
            tileDraw.stroke()
        }
        tileDraw.flipVertical()
        tileDraw.leaf(1, 0.5, 0.5, 0.73)
        tileDraw.stroke()

        // changing reflect here makes other cool patterns
        tile.tileToCorners(tileDraw, { reflect: 'v-right' })
        // spinJump is good
        return tile
    },
}

function draw() {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, sizes.width, sizes.height)

    let tile = drawings.ornate()
    ctx.save()
    ctx.translate(0, sizes.height * 0.1)
    frieze.spinJump(ctx, tile.canvas)
    ctx.restore()
}

draw()
