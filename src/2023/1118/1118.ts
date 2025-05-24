import '../../style.css'
import createCanvas from '~/helpers/create-canvas'
import { random } from '~/helpers/utils'
import loop from '~/helpers/loop'

let yellow = '#f6b02c'
let blue = '#5bc0eb'
let green = '#9bc53d'
let blue2 = '#2c497f'
let red = '#e55934'
let orange = '#f96900'

let width = window.innerWidth
let height = window.innerHeight

const colorCombos = [
    [blue2, orange],
    [green, orange],
    [orange, yellow],
    [blue2, yellow],
    [red, yellow],
]

let { ctx, resizeCanvas } = createCanvas(width, height)

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
        if (!this.xInRange(x) || !this.yInRange(y)) return undefined
        return this.items[x + y * this.cols]
    }

    set(x: number, y: number, value: T) {
        if (!this.xInRange(x) || !this.yInRange(y)) return
        this.items[x + y * this.cols] = value
    }

    xInRange(x: number) {
        return x > -1 && x < this.cols
    }

    yInRange(y: number) {
        return y > -1 && y < this.rows
    }
}

class Walker {
    x: number
    y: number
    scaleX: 1 | -1 = random([1, -1])
    scaleY: 1 | -1 = random([1, -1])
    step = 0
    maxTries = 10

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    walk() {
        if (this.step % 2 === 0) {
            this.y -= this.scaleY
            if (this.y > cells.rows - 1 || this.y < 0) this.y = 0
            this.scaleY *= -1
            this.scaleX = random([1, -1])

            if (cells.get(this.x - this.scaleX, this.y)) {
                this.scaleX *= -1
            }
        } else {
            this.x -= this.scaleX
            if (this.x > cells.cols - 1 || this.x < 0) this.x = 0
            this.scaleX *= -1
            this.scaleY = random([1, -1])

            if (cells.get(this.x, this.y - this.scaleY)) {
                this.scaleY *= -1
            }
        }

        let exists = cells.get(this.x, this.y)
        let tries = 0
        while (exists && tries < this.maxTries) {
            this.x = Math.floor(random(cells.cols))
            this.y = Math.floor(random(cells.rows))
            this.scaleX = random([1, -1])
            this.scaleY = random([1, -1])
            exists = cells.get(this.x, this.y)
            tries++
        }

        if (tries >= this.maxTries) {
            return newLayer()
        }

        cells.set(this.x, this.y, [this.scaleX, this.scaleY])
        this.step++
    }
}

let cells: Grid
let walker = new Walker(0, 0)
let cellsData = {
    size: 50,
    margin: 1,
    cols: 0,
    rows: 0,
    translateX: 0,
    translateY: 0,
    fg: colorCombos[0][0],
    bg: colorCombos[0][1],
    iteration: -1,
}

function newLayer() {
    cells = new Grid(cellsData.cols, cellsData.rows)

    cellsData.iteration++
    cellsData.fg = colorCombos[cellsData.iteration % colorCombos.length][0]
    cellsData.bg = colorCombos[cellsData.iteration % colorCombos.length][1]

    walker.x = Math.floor(random(cellsData.cols))
    walker.y = Math.floor(random(cellsData.rows))
    walker.scaleX = random([1, -1])
    walker.scaleY = random([1, -1])
}

function tile(cx: number, cy: number, size: number, flipX: 1 | -1 = 1, flipY: 1 | -1 = 1) {
    let radius = size * 0.75
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(flipX, flipY)

    ctx.beginPath()
    ctx.moveTo(-size / 2, -size / 2)
    ctx.arc(-size / 2, -size / 2, radius, 0, Math.PI * 0.5)
    ctx.fill()

    ctx.restore()
}

function draw(first = false) {
    let { size, margin, cols, rows, translateX, translateY, bg, fg } = cellsData

    ctx.save()
    ctx.translate(translateX, translateY)

    for (let i = 0; i < cols * rows; i++) {
        const x = i % cols
        const y = Math.floor(i / cols)
        let cell = cells.get(x, y)

        if (cell || first) {
            const cx = x * (size + margin) + size / 2
            const cy = y * (size + margin) + size / 2

            if (cell) {
                let [scaleX, scaleY] = cell
                ctx.fillStyle = bg
                ctx.fillRect(cx - size / 2, cy - size / 2, size, size)

                ctx.fillStyle = fg
                tile(cx, cy, size, scaleX, scaleY)
            } else {
                ctx.fillStyle = orange
                ctx.fillRect(cx - size / 2, cy - size / 2, size, size)
                ctx.fillStyle = blue
                tile(cx, cy, size, x % 2 === 0 ? -1 : 1, y % 2 === 0 ? -1 : 1)
            }
        }
    }

    ctx.restore()
}

function reset() {
    ctx.fillStyle = '#ffdebd'
    ctx.fillRect(0, 0, width, height)

    const { size, margin } = cellsData
    let w = Math.min(width * 0.9, 1200)
    let h = Math.min(height * 0.9, 1200)
    const cols = Math.floor(w / (size + margin))
    const rows = Math.floor(h / (size + margin))

    cellsData.cols = cols
    cellsData.rows = rows
    cellsData.translateX = (width - (size + margin) * cols + margin) / 2
    cellsData.translateY = (height - (size + margin) * rows + margin) / 2

    newLayer()
    draw(true)
}

window.addEventListener('resize', () => {
    width = window.innerWidth
    height = window.innerHeight
    resizeCanvas(width, height)
    reset()
})

let lastTime = 0
loop((time) => {
    let deltaTime = time - lastTime

    if (deltaTime > 25) {
        walker.walk()
        draw()
        lastTime = time
    }
})

reset()
