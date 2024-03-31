import '~/style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import loop from '~/helpers/loop'
import { random, shuffle } from '~/helpers/utils'

const width = window.innerWidth
const height = window.innerHeight
const { ctx, canvas } = createCanvas(width, height)
let looping: ReturnType<typeof loop>

let palettes = [
    // https://coolors.co/dc5132-a46589-7a82b8-8ad0a6-c4f0a8-a0bb07-ffcf33-ec9f05
    ['#dc5132', '#a46589', '#7a82b8', '#8ad0a6', '#c4f0a8', '#a0bb07', '#ffcf33', '#ec9f05'],
    // https://coolors.co/533a71-454a96-6184d8-50c5b7-9cec5b-f0f465-ff4a1c-ed254e
    ['#533a71', '#454a96', '#6184d8', '#50c5b7', '#9cec5b', '#f0f465', '#ff4a1c', '#ed254e'],
    // https://coolors.co/874286-856596-f9c8ce-a8d7a8-b6cccc-8aadbc-7a7eb8-fc814a
    ['#874286', '#856596', '#f9c8ce', '#a8d7a8', '#b6cccc', '#8aadbc', '#7a7eb8', '#fc814a'],
    // https://coolors.co/87425d-3c2e6b-0081af-a7d6c3-285943-8a8fbd-9a79b8-fcee49
    ['#87425d', '#3c2e6b', '#0081af', '#a7d6c3', '#285943', '#8a8fbd', '#9a79b8', '#fcee49'],
]

const quarterCircle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) => {
    let corner = random(['tl', 'tr', 'bl', 'br'])
    ctx.beginPath()
    if (corner === 'tr') {
        ctx.moveTo(x + w, y)
        ctx.arc(x + w, y, r, Math.PI / 2, Math.PI)
    } else if (corner === 'bl') {
        ctx.moveTo(x, y + h)
        ctx.arc(x, y + h, r, Math.PI * 1.5, 0)
    } else if (corner === 'br') {
        ctx.moveTo(x + w, y + h)
        ctx.arc(x + w, y + h, r, Math.PI, Math.PI * 1.5)
    } else if (corner === 'tl') {
        ctx.moveTo(x, y)
        ctx.arc(x, y, r, 0, Math.PI / 2)
    }
    ctx.closePath()
    ctx.fill()
}

const triangle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath()
    if (random() < 0.5) {
        ctx.moveTo(x, y)
        ctx.lineTo(x + size, y)
        ctx.lineTo(x, y + size)
    } else {
        ctx.moveTo(x + size, y + size)
        ctx.lineTo(x, y)
        ctx.lineTo(x, y + size)
    }
    ctx.closePath()
    ctx.fill()
}

class Pattern {
    size: number
    sides: number
    cells: { nx: number; ny: number; w: number; h: number }[] = []

    constructor(size: number) {
        this.size = size
        this.sides = 10

        this.create()
    }

    create = () => {
        let key = Array.from({ length: this.sides * this.sides }, () => 0)
        let ind = 0
        while (ind < key.length) {
            if (key[ind] === 1) {
                ind++
                continue
            }
            let nx = ind % this.sides
            let ny = Math.floor(ind / this.sides)

            let choices = ['square']
            if (ny < this.sides - 1) choices.push('vertical')
            if (nx < this.sides - 1 && key[ind + 1] !== 1) choices.push('horizontal')
            let style = random(choices)
            if (style === 'vertical') {
                let below = ind + this.sides
                if (below < key.length) {
                    key[ind] = 1
                    key[below] = 1
                    this.cells.push({ nx, ny, w: 1, h: 2 })
                }
            } else if (style === 'horizontal') {
                let right = ind + 1
                if (right < key.length) {
                    key[ind] = 1
                    key[right] = 1
                    this.cells.push({ nx, ny, w: 2, h: 1 })
                }
            } else {
                key[ind] = 1
                this.cells.push({ nx, ny, w: 1, h: 1 })
            }
            ind++
        }
    }

    draw = (ctx: CanvasRenderingContext2D) => {
        let cellSize = this.size / this.sides
        this.cells.forEach((cell) => {
            let x = cell.nx * cellSize
            let y = cell.ny * cellSize
            let w = cell.w * cellSize
            let h = cell.h * cellSize
            ctx.strokeStyle = '#000'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.fillStyle = random(palettes[0])
            ctx.rect(x, y, w, h)
            ctx.fill()
            // ctx.stroke()

            if (cell.w === 1 && cell.h === 1) {
                let style = random(['quarterCircle', 'triangle'])
                ctx.fillStyle = random(palettes[1])
                if (style === 'quarterCircle') {
                    quarterCircle(ctx, x, y, w, h, cellSize * 0.95)
                } else {
                    triangle(ctx, x, y, cellSize)
                }
            }
        })
    }
}

let size = Math.min(width, height) * 0.9
let pattern = new Pattern(size)

ctx.translate((width - size) / 2, (height - size) / 2)
pattern.draw(ctx)
// const draw = (t: number) => {
// }
// looping = loop(draw)
