import '~/style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import { GUI } from 'lil-gui'
import { Tile } from '../tiles'
import foot from './foot.png'

type FriezeName = 'hop' | 'jump' | 'sidle' | 'step' | 'spinHop' | 'spinSidle' | 'spinJump'
type FriezeFn = (ctx: CanvasRenderingContext2D, tile: Tile) => void

let width = 900
let height = 600
let { ctx, canvas } = createCanvas(width, height)

const params = {
    tileSize: 300,
    frieze: 'hop' as FriezeName,
    type: 'tile' as 'tile' | 'mouse',
    radius: 5,
    translateAmount: 1,
    glideAmount: 0.5,
    verticalMirror: 0.5,
    rotateOriginX: 0.75,
    rotateOriginY: 1,
    horizontalMirror: 1,
    debugTranslations: false,
    debugImg: false,
}

const debg = {
    resetDefaults: () => {
        params.translateAmount = 1
        params.glideAmount = 0.5
        params.verticalMirror = 0.5
        params.rotateOriginX = 0.75
        params.rotateOriginY = 1
        params.horizontalMirror = 1

        gui.controllersRecursive().forEach((c) => c.updateDisplay())
    },
}

class MouseDraw {
    canvas: HTMLCanvasElement
    isDrawing = false
    tileSize: number
    drawFn?: (x: number, y: number) => void

    constructor(canvas: HTMLCanvasElement, tileSize = 300) {
        this.canvas = canvas
        this.tileSize = tileSize

        this.canvas.addEventListener('mousedown', this.onMouseDown)
    }

    onMouseDown = () => {
        this.isDrawing = true
        this.canvas.addEventListener('mousemove', this.onMouseMove)
        this.canvas.addEventListener('mouseup', this.onMouseUp)
        this.canvas.addEventListener('mouseleave', this.onMouseUp)
    }

    onMouseMove = (e: MouseEvent) => {
        if (this.isDrawing) {
            if (this.drawFn) {
                this.drawFn(e.clientX, e.clientY)
            }
        }
    }

    onMouseUp = () => {
        this.isDrawing = false
        this.canvas.removeEventListener('mousemove', this.onMouseMove)
        this.canvas.removeEventListener('mouseup', this.onMouseUp)
    }
}

let points: { x: number; y: number; tileX: number; tileY: number }[] = []
const mouseDraw = new MouseDraw(canvas)

let drawTileSize = params.tileSize * 3
const tile = new Tile(drawTileSize, drawTileSize, window.devicePixelRatio)
tile.ctx.translate(drawTileSize * 0.5, drawTileSize * 0.5)
tile.ctx.translate(-params.tileSize * 0.5, -params.tileSize * 0.5)

let tileEl = document.createElement('div')
tileEl.setAttribute(
    'style',
    `width: 200px; height: 200px; background: #fff; position: fixed; bottom: 0; left: 0;`
)
tile.canvas.setAttribute('style', `width: 100%; height: 100%`)
tileEl.appendChild(tile.canvas)
document.body.appendChild(tileEl)

const frieze: Record<FriezeName, FriezeFn> = {
    // ∞∞ | just translation | p1 / p111
    hop(ctx: CanvasRenderingContext2D, tile: Tile) {
        let ts = params.tileSize
        for (let i = -10; i < 10; i++) {
            ctx.save()
            ctx.translate(i * ts * params.translateAmount, 0)
            drawTile(ctx, tile)
            ctx.restore()
        }
    },
    // ∞* | translation + horizontal mirror reflection | p11m / pm11
    jump(ctx: CanvasRenderingContext2D, tile: Tile) {
        let ts = params.tileSize

        for (let i = -10; i < 10; i++) {
            ctx.save()
            ctx.translate(i * ts * params.translateAmount, 0)
            drawTile(ctx, tile)

            if (params.debugTranslations && i === 0) {
                drawDebug(ctx, ts, 'red', 0)
            }

            ctx.translate(0, params.horizontalMirror * ts)
            if (params.debugTranslations && i === 0) {
                drawDebug(ctx, ts, 'blue', 0)
            }
            ctx.scale(1, -1)
            ctx.translate(0, -params.horizontalMirror * ts)

            if (params.debugTranslations && i === 0) {
                drawDebug(ctx, ts, 'green', 1)
            }
            drawTile(ctx, tile)
            ctx.restore()
        }
    },
    // *∞∞ | translation + vertical mirror reflection | p1m1
    sidle(ctx: CanvasRenderingContext2D, tile: Tile) {
        let ts = params.tileSize

        ctx.save()

        for (let i = -10; i < 10; i += 1) {
            ctx.save()
            ctx.translate(i * ts * params.translateAmount, 0)

            drawTile(ctx, tile)

            if (params.debugTranslations && i === 0) {
                drawDebug(ctx, ts, 'red', 0)
            }

            ctx.translate(ts * params.verticalMirror, 0)
            ctx.scale(-1, 1)
            ctx.translate(ts * -params.verticalMirror, 0)

            if (params.debugTranslations && i === 0) {
                drawDebug(ctx, ts, 'blue', 1)
            }

            drawTile(ctx, tile)

            ctx.restore()
        }

        ctx.restore()
    },
    // ∞× | glide reflection / translation | p11g / p1a1?
    step(ctx: CanvasRenderingContext2D, tile: Tile) {
        let ts = params.tileSize

        for (let i = -10; i < 10; i++) {
            ctx.save()
            ctx.translate(i * ts * params.translateAmount, 0)
            if (params.debugTranslations && i === 1) {
                drawDebug(ctx, ts, 'red', 0)
            }
            drawTile(ctx, tile)

            ctx.translate(ts * params.glideAmount, 0)
            ctx.translate(0, params.horizontalMirror * ts)
            ctx.scale(1, -1)
            if (params.debugTranslations && i === 1) {
                drawDebug(ctx, ts, 'green', 1)
            }
            ctx.translate(0, -params.horizontalMirror * ts)
            if (params.debugTranslations && i === 1) {
                drawDebug(ctx, ts, 'blue', 1)
            }

            drawTile(ctx, tile)
            ctx.restore()
        }
    },
    // 22∞ | translation + half turn
    spinHop(ctx: CanvasRenderingContext2D, tile: Tile) {
        let ts = params.tileSize

        for (let i = -10; i < 10; i += 1) {
            ctx.save()
            ctx.translate(i * ts * params.translateAmount, 0)
            if (params.debugTranslations && i === 0) {
                drawDebug(ctx, ts, 'red', 0)
            }
            drawTile(ctx, tile)

            // ctx.translate(ts * params.glideAmount, 0)
            // if (params.debugTranslations && i === 0) {
            //     drawDebug(ctx, ts, 'green', 0)
            // }

            ctx.translate(ts * params.rotateOriginX, ts * params.rotateOriginY)
            ctx.rotate(Math.PI)
            ctx.translate(-ts * params.rotateOriginX, -ts * params.rotateOriginY)
            drawTile(ctx, tile)
            if (params.debugTranslations && i === 0) {
                drawDebug(ctx, ts, 'blue', 3)
            }

            ctx.restore()
        }
    },
    // 2*∞ | translation, half turn, vertical reflection, glide reflection
    spinSidle(ctx: CanvasRenderingContext2D, tile: Tile) {
        let ts = params.tileSize
        for (let i = -10; i < 10; i++) {
            ctx.save()
            ctx.translate(i * ts * params.translateAmount, 0)

            // if (Math.abs(i) % 2 === 1) {
            //     ctx.translate(0, ts * 2)
            //     ctx.scale(1, -1)
            // }
            drawTile(ctx, tile)

            if (params.debugTranslations && i === 0) {
                drawDebug(ctx, ts, 'red', 0)
            }

            ctx.save()
            ctx.translate(ts * params.verticalMirror, 0)
            ctx.scale(-1, 1)
            ctx.translate(ts * -params.verticalMirror, 0)
            drawTile(ctx, tile)
            ctx.restore()

            ctx.translate(ts * params.rotateOriginX, ts * params.rotateOriginY)
            ctx.rotate(Math.PI)
            ctx.translate(-ts * params.rotateOriginX, -ts * params.rotateOriginY)
            if (params.debugTranslations && i === 0) {
                drawDebug(ctx, ts, 'green', 1)
            }

            drawTile(ctx, tile)

            ctx.save()
            ctx.translate(ts * params.verticalMirror, 0)
            ctx.scale(-1, 1)
            ctx.translate(ts * -params.verticalMirror, 0)
            drawTile(ctx, tile)
            ctx.restore()

            // ctx.translate(ts * params.verticalMirror, 0)
            // ctx.scale(-1, 1)
            // ctx.translate(ts * -params.verticalMirror, 0)

            // drawTile(ctx, tile)
            // reflectStep()
            ctx.restore()
        }
    },
    // *22∞ | translation, horizontal + vertical reflection, glide reflection, order 2 rotations | p2mm
    spinJump(ctx: CanvasRenderingContext2D, tile: Tile) {
        let ts = params.tileSize
        for (let i = -10; i < 10; i++) {
            ctx.save()
            ctx.translate(i * ts * params.translateAmount, 0)

            if (params.debugTranslations && i === 0) {
                drawDebug(ctx, ts, 'green', 0)
            }
            drawTile(ctx, tile)

            ctx.save()
            ctx.translate(ts * params.verticalMirror, 0)
            ctx.scale(-1, 1)
            ctx.translate(ts * -params.verticalMirror, 0)
            if (params.debugTranslations && i === 0) {
                drawDebug(ctx, ts, 'blue', 1)
            }
            drawTile(ctx, tile)
            ctx.restore()

            // ctx.translate(0, ts * 2)
            ctx.translate(0, ts * params.horizontalMirror)
            ctx.scale(1, -1)
            ctx.translate(0, -ts * params.horizontalMirror)

            if (params.debugTranslations && i === 0) {
                drawDebug(ctx, ts, 'red', 0)
            }
            drawTile(ctx, tile)

            ctx.translate(ts * params.verticalMirror, 0)
            ctx.scale(-1, 1)
            ctx.translate(ts * -params.verticalMirror, 0)
            if (params.debugTranslations && i === 0) {
                drawDebug(ctx, ts, 'blue', 1)
            }
            drawTile(ctx, tile)

            // ctx.translate(ts, 0)
            // ctx.scale(-1, 1)
            // drawTile(ctx, tile)

            // ctx.translate(ts, 0)
            // ctx.scale(-1, 1)
            // drawTile(ctx, tile)

            ctx.restore()
        }
    },
}
mouseDraw.drawFn = (x, y) => {
    ctx.fillStyle = '#000'
    // let stepsY = Math.ceil(sizes.height / params.tileSize)

    let tileX = x % (params.tileSize * params.translateAmount)
    let tileY = y % params.tileSize
    points.push({ x, y, tileX, tileY })

    tile.ctx.fillStyle = '#000'
    tile.ctx.beginPath()
    tile.ctx.arc(tileX, y, params.radius, 0, Math.PI * 2)
    tile.ctx.fill()

    draw()
}

const drawDebug = (
    ctx: CanvasRenderingContext2D,
    size: number,
    color: 'red' | 'green' | 'blue',
    rotate: number
) => {
    ctx.save()
    let rgb = color === 'red' ? [255, 0, 0] : color === 'green' ? [0, 255, 0] : [0, 0, 255]
    ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.2)`
    ctx.beginPath()
    ctx.rect(0, 0, size, size)
    ctx.stroke()
    ctx.clip()

    let sz2 = size * 2
    let steps = 16
    let step = sz2 / steps
    ctx.lineWidth = step * 0.5
    ctx.translate(size * 0.5, size * 0.5)
    ctx.rotate(Math.PI * 0.25 * rotate)
    ctx.translate(-sz2 * 0.5, -sz2 * 0.5)
    for (let i = 0; i < steps; i++) {
        ctx.beginPath()
        ctx.moveTo((i + 0.5) * step, 0)
        ctx.lineTo((i + 0.5) * step, sz2)
        // ctx.moveTo((i + steps / 2) * step * 2, size)
        // ctx.lineTo(size, (i + steps / 2) * step * 2)
        // ctx.moveTo(size - (i + 1) * step, size)
        // ctx.lineTo(size, size - (i + 1) * step)
        ctx.stroke()
    }
    ctx.restore()

    ctx.save()
    ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.4)`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `bold ${size * 0.5}px sans-serif`
    ctx.fillText(`a`, size * 0.5, size * 0.5)

    ctx.restore()
}

function drawPoints() {
    let stepsX = Math.ceil(width / params.tileSize)
    let stepsY = Math.ceil(height / params.tileSize)

    ctx.save()
    ctx.fillStyle = '#000'
    switch (params.frieze) {
        case 'hop':
            for (let i = 0; i < stepsX; i++) {
                ctx.save()
                ctx.translate(params.tileSize * i, 0)
                points.forEach(({ y, tileX }) => {
                    ctx.beginPath()
                    ctx.arc(tileX, y, params.radius, 0, Math.PI * 2)
                    ctx.fill()
                })
                ctx.restore()
            }
            break
        case 'jump': // horizontal mirror reflection + translation
            for (let i = 0; i < stepsX; i++) {
                ctx.save()
                ctx.translate(params.tileSize * i, 0)

                points.forEach(({ y, tileX }) => {
                    ctx.beginPath()
                    ctx.arc(tileX, y, params.radius, 0, Math.PI * 2)
                    ctx.fill()

                    ctx.beginPath()
                    ctx.arc(tileX, height - y, params.radius, 0, Math.PI * 2)
                    ctx.fill()
                })

                ctx.restore()
            }
            break
        case 'sidle':
            for (let i = 0; i < stepsX; i++) {
                ctx.save()
                ctx.translate(params.tileSize * i, 0)
                points.forEach(({ y, tileX }) => {
                    ctx.beginPath()
                    ctx.arc(tileX, y, params.radius, 0, Math.PI * 2)
                    ctx.fill()

                    ctx.beginPath()
                    ctx.arc(params.tileSize - tileX, y, params.radius, 0, Math.PI * 2)
                    ctx.fill()
                })

                ctx.restore()
            }
            break
        case 'step':
            for (let i = 0; i < stepsX; i++) {
                ctx.save()
                ctx.translate(params.tileSize * i, 0)
                points.forEach(({ y, tileX }) => {
                    ctx.beginPath()
                    ctx.arc(tileX, y, params.radius, 0, Math.PI * 2)
                    ctx.fill()

                    ctx.beginPath()
                    ctx.arc(
                        tileX + params.tileSize * 0.5,
                        height - y,
                        params.radius,
                        0,
                        Math.PI * 2
                    )
                    ctx.fill()
                })
                ctx.restore()
            }
            break
        case 'spinHop':
            for (let i = 0; i < stepsX; i++) {
                ctx.save()
                ctx.translate(params.tileSize * i, 0)
                points.forEach(({ y, tileX }) => {
                    ctx.beginPath()
                    ctx.arc(tileX, y, params.radius, 0, Math.PI * 2)
                    ctx.fill()

                    ctx.beginPath()
                    ctx.arc(
                        params.tileSize + params.tileSize * 0.5 - tileX,
                        height - y,
                        params.radius,
                        0,
                        Math.PI * 2
                    )
                    ctx.fill()
                })
                ctx.restore()
            }
            break
        case 'spinSidle':
            for (let i = 0; i < stepsX; i++) {
                ctx.save()
                ctx.translate(params.tileSize * i, 0)
                points.forEach(({ y, tileX }) => {
                    ctx.beginPath()
                    ctx.arc(tileX, y, params.radius, 0, Math.PI * 2)
                    ctx.fill()

                    ctx.beginPath()
                    ctx.arc(params.tileSize - tileX, y, params.radius, 0, Math.PI * 2)
                    ctx.fill()

                    ctx.beginPath()
                    ctx.arc(
                        tileX + params.tileSize * 0.5,
                        height - y,
                        params.radius,
                        0,
                        Math.PI * 2
                    )
                    ctx.fill()

                    ctx.beginPath()
                    ctx.arc(
                        params.tileSize + params.tileSize * 0.5 - tileX,
                        height - y,
                        params.radius,
                        0,
                        Math.PI * 2
                    )
                    ctx.fill()
                })
                ctx.restore()
            }
            break
        case 'spinJump':
            for (let i = 0; i < stepsX; i++) {
                ctx.save()
                ctx.translate(params.tileSize * i, 0)
                points.forEach(({ y, tileX }) => {
                    ctx.beginPath()
                    ctx.arc(tileX, y, params.radius, 0, Math.PI * 2)
                    ctx.fill()

                    ctx.beginPath()
                    ctx.arc(tileX, height - y, params.radius, 0, Math.PI * 2)
                    ctx.fill()

                    ctx.beginPath()
                    ctx.arc(params.tileSize - tileX, y, params.radius, 0, Math.PI * 2)
                    ctx.fill()

                    ctx.beginPath()
                    ctx.arc(params.tileSize - tileX, height - y, params.radius, 0, Math.PI * 2)
                    ctx.fill()
                })
                ctx.restore()
            }
            break
    }
    ctx.restore()
}

function clear() {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)

    ctx.beginPath()
    let stepsX = Math.ceil(width / params.tileSize)
    let stepsY = Math.ceil(height / params.tileSize)
    for (let i = -stepsX; i < stepsX; i++) {
        for (let j = -stepsY; j < stepsY; j++) {
            ctx.moveTo(i * params.tileSize, j * params.tileSize)
            ctx.lineTo(i * params.tileSize + params.tileSize, j * params.tileSize)
            ctx.moveTo(i * params.tileSize, j * params.tileSize)
            ctx.lineTo(i * params.tileSize, j * params.tileSize + params.tileSize)
        }
    }
    ctx.stroke()
}

const gui = new GUI()
gui.add(params, 'frieze', ['hop', 'jump', 'sidle', 'step', 'spinHop', 'spinSidle', 'spinJump'])
gui.add(params, 'translateAmount', 0.1, 2, 0.01)
gui.add(params, 'glideAmount', 0, 2, 0.01)
gui.add(params, 'verticalMirror', 0, 1, 0.01)
gui.add(params, 'horizontalMirror', 0, 1, 0.01)
gui.add(params, 'rotateOriginX', 0, 2, 0.01)
gui.add(params, 'rotateOriginY', 0, 2, 0.01)
gui.add(params, 'debugTranslations')
gui.add(params, 'debugImg')
gui.add(debg, 'resetDefaults')
// gui.add(params, 'type', ['tile', 'mouse'])

gui.onChange(draw)

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        clearTile()
        clear()
        points = []
    }
})

function clearTile() {
    tile.ctx.clearRect(-params.tileSize, -params.tileSize, tile.w, tile.h)
    // tile.ctx.clearRect(0, 0, tile.w, tile.h)
}

const drawTile = (ctx: CanvasRenderingContext2D, tile: Tile) => {
    ctx.drawImage(tile.canvas, -params.tileSize, -params.tileSize, tile.w, tile.h)
    // ctx.drawImage(tile.canvas, 0, 0, params.tileSize, params.tileSize)
}

function draw() {
    clear()
    let ts = params.tileSize

    let tileCopy = new Tile(tile.w, tile.h, window.devicePixelRatio)
    tileCopy.ctx.drawImage(tile.canvas, 0, 0, tile.w, tile.h)
    // tileCopy.ctx.drawImage(tile.canvas, 0, 0, ts, ts)

    if (params.debugImg) {
        let hw = footImg.height / footImg.width
        let imgSize = ts * 0.8
        let imgX = ts * 0.1
        let imgY = ts * 0.2
        tileCopy.ctx.save()
        tileCopy.ctx.translate(drawTileSize * 0.5, drawTileSize * 0.5)
        tileCopy.ctx.translate(-params.tileSize * 0.5, -params.tileSize * 0.5)

        if (params.frieze === 'sidle') {
            imgSize *= 0.5
            tileCopy.ctx.translate(ts * 0.45, ts * 0.5)
            tileCopy.ctx.rotate(Math.PI * -0.5)
            tileCopy.ctx.translate(-ts * 0.45, -ts * 0.5)
        }

        if (params.frieze === 'spinSidle') {
            imgSize *= 0.5
            tileCopy.ctx.translate(ts * 0.5, ts * 0.5)
            tileCopy.ctx.rotate(Math.PI * 0.5)
            tileCopy.ctx.translate(-ts * 0.5, -ts * 0.5)
            imgX = ts * 0.5
            imgY = ts * 0.15
        }

        if (params.frieze === 'spinJump') {
            imgSize *= 0.5
            imgY = ts * 0.6
            imgX = ts * 0.05
        }

        tileCopy.ctx.drawImage(footImg, imgX, imgY, imgSize, imgSize * hw)
        tileCopy.ctx.restore()
    }

    // tileCopy.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    // tileCopy.ctx.fillRect(ts, ts, ts, ts)

    frieze[params.frieze](ctx, tileCopy)
}

let footImg = new Image()
footImg.src = foot
footImg.onload = draw

draw()
