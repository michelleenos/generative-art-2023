import '../../style.css'
import { random, shuffle } from '~/helpers/utils'
import createCanvas from '~/helpers/canvas/createCanvas'
import { polygon, burst, zigzag, rectCenter } from '~/helpers/shapes'
import { crazyTiles } from '~/helpers/crazy-tiles'
import { Pane } from 'tweakpane'

let palettes = {
    darks: [
        ['#6a105e', '#fa0939', '#0C2F4B', '#ed2b92'],
        ['#0e1428', '#5D2A42', '#3f612d', '#1d201f', '#414066'],
        ['#D01FD0', '#25A2DB', '#02BA36', '#BB1B4E'],
        ['#281951', '#4A64BF', '#E32033', '#FA5621'],
    ],
    lights: [
        ['#f6b02c', '#f24333', '#ff7a27', '#058ed9', '#5bc4f1', '#FC6C9C'],
        ['#f0a202', '#f18805', '#d95d39', '#d1dede', '#ceff1a'],
        ['#50b2d3', '#FF9F31', '#3CBC50', '#81d560'],
    ],
}

type Props = {
    iterations: number
    divisions: '2s' | '2s-3s' | 'random'
    minSize: number
}

let props: Props = {
    iterations: 8,
    divisions: '2s-3s',
    minSize: 20,
}

let width = 700
let height = 700
let { ctx } = createCanvas(width, height)
let colors = [...random(palettes.darks), ...random(palettes.lights)]

function setPane() {
    let pane = new Pane()
    let folder = pane.addFolder({ title: 'settings' })
    folder.addInput(props, 'iterations', { min: 1, max: 15, step: 1 })
    folder.addInput(props, 'divisions', {
        options: {
            '2s': '2s',
            '2s-3s': '2s-3s',
            random: 'random',
        },
    })

    folder.addInput(props, 'minSize', { min: -1, max: 300, step: 1 })
    folder.addButton({ title: 'new palette+redraw' }).on('click', () => {
        colors = [...random(palettes.darks), ...random(palettes.lights)]
        draw()
    })

    folder.addButton({ title: 'redraw' }).on('click', draw)
    pane.on('change', draw)
}

const getCheckerboard = (w: number, h: number) => {
    const gcdIsh = (a: number, b: number): number => {
        // console.log(a, b)
        if (b < 3 || a < 3) return a
        return gcdIsh(b, a % b)
    }
    let size = gcdIsh(w, h)
    while (size > 40) {
        size /= 2
    }
    let chX = size
    let chY = size
    let nx = Math.ceil(w / chX)
    let ny = Math.ceil(h / chY)

    let leftover = w % size
    chX += leftover / nx
    chY += leftover / ny
    return [nx, ny, chX, chY]
}

function patterns(cx: number, cy: number, w: number, h: number) {
    let n = Math.floor(random(9))
    let cols = shuffle(colors)

    let x = cx - w / 2
    let y = cy - h / 2
    let min = Math.min(w, h)
    let max = Math.max(w, h)
    let r = min * 0.5

    ctx.save()

    ctx.beginPath()
    rectCenter(ctx, { cx, cy, w, h })
    ctx.fillStyle = cols[0]
    ctx.fill()

    if (n === 0) {
        // circle(s)
        ctx.clip()
        let r = (w + h) * random(0.35, 1)
        let step = r * random(0.05, 0.15)
        let xx = cx + random(-min / 2, min / 2)
        let yy = cy + random(-min / 2, min / 2)
        ctx.fillStyle = cols[1]

        let i = 0
        while (r - i * step > 10) {
            ctx.beginPath()
            ctx.arc(xx, yy, r - i * step, 0, Math.PI * 2)
            ctx.fillStyle = cols[i % 2 === 0 ? 1 : 2]
            ctx.fill()
            i++
        }
    } else if (n === 1) {
        // triangle(s)
        let num = w > h ? Math.floor(random(1, 5)) : 1
        let step = w / num
        let size = Math.min(step * 0.45, r * 0.9)

        for (let i = 0; i < num; i++) {
            polygon(ctx, {
                cx: x + step * i + step / 2,
                cy: cy + size * 0.2,
                r: size,
                sides: 3,
                rotation: Math.PI / 6,
            })
            ctx.fillStyle = cols[1]
            ctx.fill()
        }
    } else if (n === 2) {
        // plus (rotated or not)
        ctx.lineWidth = min * 0.15
        ctx.strokeStyle = cols[1]
        let side = min * 0.35
        if (random() < 0.5) {
            ctx.beginPath()
            ctx.moveTo(cx - side, cy)
            ctx.lineTo(cx + side, cy)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(cx, cy - side)
            ctx.lineTo(cx, cy + side)
            ctx.stroke()
        } else {
            ctx.beginPath()
            ctx.moveTo(cx - side, cy - side)
            ctx.lineTo(cx + side, cy + side)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(cx + side, cy - side)
            ctx.lineTo(cx - side, cy + side)
            ctx.stroke()
        }
    } else if (n === 3) {
        // outline rects
        ctx.clip()
        let size = random() < 0.5 ? w : h
        let wid = size * 0.12
        let step = size * 0.17
        let xx = cx + random(-min / 2, min / 2)
        let yy = cy + random(-min / 2, min / 2)
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
        // burst
        burst(ctx, {
            cx,
            cy,
            r: min * 0.35,
            nodes: Math.floor(random(5, 9)),
            vary: min * 0.1,
            start: random(Math.PI),
        })
        ctx.fillStyle = cols[1]
        ctx.fill()
    } else if (n === 5) {
        // rounded rects
        let num = h > 80 ? Math.floor(random(2, 5)) : random([1, 2])
        let rectWidth = w * 0.8
        let stepHeight = (h * 0.9) / num
        let rectHeight = (h * 0.8) / num
        let space = (h * 0.1) / 2 + (stepHeight - rectHeight) / 2
        let xx = x + w * 0.1
        ctx.beginPath()
        for (let i = 0; i < num; i++) {
            let yy = y + stepHeight * i + space
            ctx.roundRect(xx, yy, rectWidth, rectHeight, r * 0.1)
        }
        ctx.fillStyle = cols[1]
        ctx.fill()
    } else if (n === 6) {
        // zigzags
        ctx.beginPath()
        rectCenter(ctx, { cx, cy, w, h })
        ctx.fillStyle = cols[1]
        ctx.fill()
        ctx.clip()

        let step = random(min * 0.1, min * 0.35)
        let zig = step / 2
        ctx.lineWidth = zig * random(0.7, 1.3)
        ctx.strokeStyle = cols[2]

        zigzag(ctx, {
            x: cx - w,
            y: cy - h,
            w: w * 2,
            h: h * 2,
            step,
            zig,
            dir: random() < 0.5 ? 'horizontal' : 'vertical',
        })
    } else if (n === 7) {
        // checker
        ctx.clip()
        let [nx, ny, chX, chY] = getCheckerboard(w, h)
        let xx = x
        let yy = y
        ctx.fillStyle = cols[1]
        for (let xi = 0; xi < nx; xi++) {
            for (let yi = 0; yi < ny; yi++) {
                ctx.beginPath()
                if (xi % 2 === yi % 2) {
                    ctx.rect(xx + chX * xi, yy + chY * yi, chX, chY)
                    ctx.fill()
                }
            }
        }
    } else if (n === 8) {
        // diamonds
        let stepx = w / Math.floor(random(2, 9))
        let stepy = h / Math.floor(random(3, 9))
        let square = Math.min(stepx, stepy) / 3
        for (let xi = 0; xi < w / stepx; xi++) {
            for (let yi = 0; yi < h / stepy; yi++) {
                ctx.beginPath()
                polygon(ctx, {
                    cx: x + stepx * xi + stepx / 2,
                    cy: y + stepy * yi + stepy / 2,
                    r: square,
                    sides: 4,
                })
                ctx.fillStyle = cols[1]
                ctx.fill()
            }
        }
    }

    ctx.restore()
}

function draw() {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)

    crazyTiles({
        x: width / 2,
        y: height / 2,
        w: width,
        h: height,
        iterations: props.iterations,
        fn: patterns,
        minSize: props.minSize,
    })
}

setPane()
draw()
