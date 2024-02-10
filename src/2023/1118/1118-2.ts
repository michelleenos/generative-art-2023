import '../../style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import { random } from '~/helpers/utils'
import loop from '~/helpers/loop'

let yellow = '#f6b02c',
    green = '#9bc53d',
    blue = '#5bc0eb',
    blue2 = '#2c497f',
    red = '#e55934',
    orange = '#f96900'
const colorCombos = [
    [green, orange],
    [orange, blue],
    [blue2, yellow],
    [red, yellow],
    [blue2, orange],
]
let compositeOptions: GlobalCompositeOperation[] = ['screen', 'overlay', 'source-over']

let width = window.innerWidth
let height = window.innerHeight
let { ctx, resizeCanvas, canvas } = createCanvas(width, height)
let PARAMS = {
    blendModes: false,
    size: 50,
    margin: 1,
}

let cols: number, rows: number, translateX: number, translateY: number, cells: Grid
let fg = blue2,
    bg = orange,
    step = 0,
    maxTries = 10,
    iteration = -1,
    currentX = 0,
    currentY = 0,
    scaleX = 1,
    scaleY = 1

class Grid<T = any> {
    items: T[] = []
    cols: number
    rows: number

    constructor(cols: number, rows: number) {
        this.cols = cols
        this.rows = rows
        this.items = new Array(cols * rows)
    }

    get(x: number, y: number) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return undefined
        return this.items[x + y * this.cols]
    }

    set(x: number, y: number, value: T) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return
        this.items[x + y * this.cols] = value
    }
}

function newLayer() {
    cells = new Grid(cols, rows)

    iteration++
    fg = colorCombos[iteration % colorCombos.length][0]
    bg = colorCombos[iteration % colorCombos.length][1]

    currentX = Math.floor(random(cols))
    currentY = Math.floor(random(rows))
    scaleX = random([1, -1])
    scaleY = random([1, -1])
}

function tile(x: number, y: number, scaleX = 1, scaleY = 1) {
    let { size, margin } = PARAMS
    let cx = x * (size + margin) + size / 2
    let cy = y * (size + margin) + size / 2

    ctx.save()
    ctx.translate(cx + translateX, cy + translateY)
    ctx.scale(scaleX, scaleY)

    ctx.fillStyle = bg
    ctx.fillRect(-size / 2, -size / 2, size, size)

    ctx.fillStyle = fg
    ctx.beginPath()
    ctx.moveTo(-size / 2, -size / 2)
    ctx.arc(-size / 2, -size / 2, size * 0.75, 0, Math.PI * 0.5)
    ctx.fill()

    ctx.restore()
}

function newCell() {
    if (PARAMS.blendModes && random() < 0.02) {
        ctx.globalCompositeOperation = random(compositeOptions)
        console.log(ctx.globalCompositeOperation)
    }
    if (step % 2 === 0) {
        currentY -= scaleY
        if (currentY > cells.rows - 1 || currentY < 0) currentY = 0
        scaleY *= -1
        scaleX = random([1, -1])

        if (cells.get(currentX - scaleX, currentY)) {
            scaleX *= -1
        }
    } else {
        currentX -= scaleX
        if (currentX > cells.cols - 1 || currentX < 0) currentX = 0
        scaleX *= -1
        scaleY = random([1, -1])

        if (cells.get(currentX, currentY - scaleY)) {
            scaleY *= -1
        }
    }

    let exists = cells.get(currentX, currentY)
    let tries = 0

    while (exists && tries < maxTries) {
        currentX = Math.floor(random(cells.cols))
        currentY = Math.floor(random(cells.rows))
        scaleX = random([1, -1])
        scaleY = random([1, -1])
        exists = cells.get(currentX, currentY)
        tries++
    }

    if (tries >= maxTries) {
        return newLayer()
    }

    cells.set(currentX, currentY, [scaleX, scaleY])
    step++
    tile(currentX, currentY, scaleX, scaleY)
}

function baseLayer() {
    ctx.fillStyle = '#ffdebd'
    ctx.fillRect(0, 0, width, height)

    for (let i = 0; i < cols * rows; i++) {
        const x = i % cols
        const y = Math.floor(i / cols)
        tile(x, y, x % 2 === 0 ? -1 : 1, y % 2 === 0 ? -1 : 1)
    }
}

function start() {
    let { size, margin } = PARAMS
    let w = Math.min(width * 0.9, 1200)
    let h = Math.min(height * 0.9, 1200)
    cols = Math.floor(w / (size + margin))
    rows = Math.floor(h / (size + margin))
    translateX = (width - (size + margin) * cols + margin) / 2
    translateY = (height - (size + margin) * rows + margin) / 2

    baseLayer()
    newLayer()
}

window.addEventListener('resize', () => {
    width = window.innerWidth
    height = window.innerHeight
    resizeCanvas(width, height)
    start()
})

start()

let lastTime = 0
loop((time) => {
    let deltaTime = time - lastTime

    if (deltaTime > 50) {
        newCell()
        lastTime = time
    }
})
