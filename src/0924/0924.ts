import '../style.css'
import { random, shuffle } from '~/helpers/utils'
import createCanvas from '~/helpers/canvas/createCanvas'

let colors = ['#3682ce', '#1d1f6c', '#2eca5d', '#cd293f', '#f36f1d', '#ffb129']
colors = ['#281951', '#4A64BF', '#50b2d3', '#FF9F31', '#3CBC50', '#E32033', '#FA5621']
colors = [
    '#f6b02c',
    '#6a105e',
    '#f24333',
    '#058ed9',
    '#BB1B4E',
    '#E0002D',
    '#143642',
    '#5bc0eb',
    '#ec89df',
    '#5cb52d',
]
let width = 800
let height = 800

let { ctx } = createCanvas(width, height)

const rectCenter = (x: number, y: number, w: number, h: number) => {
    ctx.rect(x - w / 2, y - h / 2, w, h)
}

function polygon(cx: number, cy: number, r: number, sides: number, rotation = 0) {
    let step = (Math.PI * 2) / sides
    ctx.beginPath()
    for (let i = 0; i < sides; i++) {
        ctx.lineTo(cx + Math.cos(i * step + rotation) * r, cy + Math.sin(i * step + rotation) * r)
    }
    ctx.closePath()
}

function burst(
    x: number,
    y: number,
    radius: number,
    nodes: number,
    vary: number,
    start: number = 0
) {
    for (let i = 0; i < 2 * Math.PI; i += 0.01) {
        let ri = radius + Math.sin(i * nodes + start) * vary

        let x1 = x + Math.cos(i) * ri
        let y1 = y + Math.sin(i) * ri
        ctx.lineTo(x1, y1)
    }
}

const getCheckerboard = (w: number, h: number) => {
    let nx, ny, chX, chY
    if (w < h) {
        nx = 4
        chX = w / nx
        ny = Math.floor(h / chX)
        chY = h / ny
    } else {
        ny = 4
        chY = h / ny
        nx = Math.floor(w / chY)
        chX = w / nx
    }
    return [nx, ny, chX, chY]
}

function crazyTiles(
    x: number,
    y: number,
    w: number,
    h: number,
    iterations = 6,
    fn: (x: number, y: number, w: number, h: number) => void
) {
    iterations--

    if (iterations === 0 || w < 50 || h < 50) {
        fn(x, y, w, h)
        return
    }

    if (w > h) {
        let w1 = w / random([2, 4])
        let w2 = w - w1
        let x1 = x - w / 2 + w1 / 2
        let x2 = x + w / 2 - w2 / 2

        crazyTiles(x1, y, w1, h, iterations, fn)
        crazyTiles(x2, y, w2, h, iterations, fn)
    } else {
        // let h1 = random(h * 0.15, h * 0.85)
        let h1 = h / random([2, 4])
        let h2 = h - h1
        let y1 = y - h / 2 + h1 / 2
        let y2 = y + h / 2 - h2 / 2

        crazyTiles(x, y1, w, h1, iterations, fn)
        crazyTiles(x, y2, w, h2, iterations, fn)
    }
}

function patterns(x: number, y: number, w: number, h: number) {
    let n = Math.floor(random(8))
    let cols = shuffle(colors)

    let min = Math.min(w, h)
    let max = Math.max(w, h)
    let r = min * 0.5

    ctx.save()

    ctx.beginPath()
    rectCenter(x, y, w, h)
    ctx.fillStyle = cols[0]
    ctx.fill()

    if (n === 0) {
        ctx.beginPath()
        ctx.arc(x, y, r * 0.9, 0, Math.PI * 2)
        ctx.fillStyle = cols[1]
        ctx.fill()
    } else if (n === 1) {
        let num = w > h ? Math.floor(random(1, 5)) : 1
        let step = w / num
        let size = Math.min(step * 0.45, r * 0.9)

        for (let i = 0; i < num; i++) {
            ctx.beginPath()
            polygon(x - w / 2 + step * i + step / 2, y + size * 0.2, size, 3, Math.PI / 6)
            ctx.fillStyle = cols[1]
            ctx.fill()
        }
    } else if (n === 2) {
        ctx.lineWidth = min * 0.15
        ctx.strokeStyle = cols[1]
        let side = r * 0.7
        if (random() < 0.5) {
            ctx.beginPath()
            ctx.moveTo(x - side, y)
            ctx.lineTo(x + side, y)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(x, y - side)
            ctx.lineTo(x, y + side)
            ctx.stroke()
        } else {
            ctx.beginPath()
            ctx.moveTo(x - side, y - side)
            ctx.lineTo(x + side, y + side)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(x + side, y - side)
            ctx.lineTo(x - side, y + side)
            ctx.stroke()
        }
    } else if (n === 3) {
        ctx.clip()

        let size = random() < 0.5 ? max : min
        let wid = size * 0.12
        let step = size * 0.17
        let xx = x + random(-r, r)
        let yy = y + random(-r, r)
        ctx.fillStyle = cols[1]

        for (let i = 0; i < 3; i++) {
            let x1 = xx - size / 2 + step * i
            let x2 = xx + size / 2 - step * i
            let y1 = yy - size / 2 + step * i
            let y2 = yy + size / 2 - step * i

            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y1)
            ctx.lineTo(x2, y2)
            ctx.lineTo(x1, y2)
            ctx.closePath()
            ctx.moveTo(x1 + wid, y1 + wid)
            ctx.lineTo(x2 - wid, y1 + wid)
            ctx.lineTo(x2 - wid, y2 - wid)
            ctx.lineTo(x1 + wid, y2 - wid)
            ctx.closePath()
            ctx.fill('evenodd')
        }
    } else if (n === 4) {
        let nodes = Math.floor(random(5, 9))
        let radius = r * 0.7
        let vary = r * 0.2
        let start = random(Math.PI)
        ctx.beginPath()
        burst(x, y, radius, nodes, vary, start)
        ctx.fillStyle = cols[1]
        ctx.fill()
    } else if (n === 5) {
        let num = h > 80 ? Math.floor(random(2, 5)) : random([1, 2])
        let rectWidth = w * 0.8
        let stepHeight = (h * 0.9) / num
        let rectHeight = (h * 0.8) / num
        let space = (h * 0.1) / 2 + (stepHeight - rectHeight) / 2
        let xx = x - w / 2 + w * 0.1
        ctx.beginPath()
        for (let i = 0; i < num; i++) {
            let yy = y - h / 2 + stepHeight * i + space
            ctx.roundRect(xx, yy, rectWidth, rectHeight, r * 0.1)
        }
        ctx.fillStyle = cols[1]
        ctx.fill()
    } else if (n === 6) {
        ctx.beginPath()
        rectCenter(x, y, w, h)
        ctx.fillStyle = cols[1]
        ctx.fill()
        ctx.clip()

        let step = random(min * 0.1, min * 0.35)
        let zig = step / 2
        ctx.lineWidth = zig * random(0.7, 1.3)
        ctx.strokeStyle = cols[2]

        if (random() < 0.5) {
            for (let yy = y - h; yy <= y + h; yy += step) {
                ctx.beginPath()
                let xi = 0
                for (let xx = x - w; xx <= x + w; xx += step) {
                    xi += 1
                    ctx.lineTo(xx, yy + (xi % 2 === 0 ? zig * -1 : zig))
                }
                ctx.stroke()
            }
        } else {
            for (let xx = x - w; xx <= x + w; xx += step) {
                ctx.beginPath()
                let yi = 0
                for (let yy = y - h; yy <= y + h; yy += step) {
                    yi += 1
                    ctx.lineTo(xx + (yi % 2 === 0 ? zig * -1 : zig), yy)
                }
                ctx.stroke()
            }
        }
    } else if (n === 7) {
        ctx.clip()
        let [nx, ny, chX, chY] = getCheckerboard(w, h)

        let xx = x - w / 2
        let yy = y - h / 2

        for (let xi = 0; xi < nx; xi++) {
            for (let yi = 0; yi < ny; yi++) {
                ctx.beginPath()
                ctx.rect(xx + chX * xi, yy + chY * yi, chX, chY)
                ctx.fillStyle = xi % 2 === yi % 2 ? cols[1] : cols[2]
                ctx.fill()
            }
        }
    }

    ctx.restore()
}

function draw() {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, width, height)

    crazyTiles(width / 2, height / 2, width, height, 8, patterns)
}

draw()
