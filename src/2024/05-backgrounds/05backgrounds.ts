import '~/style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import { map, random, shuffle } from '~/helpers/utils'
import { createNoise2D } from 'simplex-noise'
import easing from '~/helpers/easings'

let noise2d = createNoise2D()
// let SIZE = 900
// const { ctx, canvas } = createCanvas(SIZE, SIZE)

let palettes = [
    ['#dc5132', '#a46589', '#7a82b8', '#8ad0a6', '#c4f0a8', '#a0bb07', '#ffcf33', '#ec9f05'],
    ['#533a71', '#454a96', '#6184d8', '#50c5b7', '#9cec5b', '#f0f465', '#ff4a1c', '#ed254e'],
    ['#874286', '#856596', '#f9c8ce', '#a8d7a8', '#b6cccc', '#8aadbc', '#7a7eb8', '#fc814a'],
    ['#87425d', '#3c2e6b', '#0081af', '#a7d6c3', '#285943', '#8a8fbd', '#9a79b8', '#fcee49'],
]

const hue = (start: number, add: number) => {
    let h = start + add
    return h < 0 ? 360 + h : h % 360
}

export const lotsOfCircles = (
    ctx: CanvasRenderingContext2D,
    sz: number,
    count = sz * 5,
    min = sz * 0.0125,
    max = sz * 0.025
) => {
    for (let i = 0; i < count; i++) {
        ctx.beginPath()
        ctx.arc(random(sz), random(sz), random(min, max), 0, Math.PI * 2)
        ctx.fill()
    }
}

type HSL = [number, number, number]
type RGROpts =
    | [x: number, y: number, r: number]
    | [x0: number, y0: number, r0: number, r1: number]
    | [x0: number, y0: number, r0: number, x1: number, y1: number, r1: number]

function rgr(ctx: CanvasRenderingContext2D, hsl: HSL, ...args: RGROpts) {
    let gr: CanvasGradient
    if (args.length === 3) {
        let [x, y, r] = args
        gr = ctx.createRadialGradient(x, y, 0, x, y, r)
    } else if (args.length === 4) {
        let [x0, y0, r0, r1] = args
        gr = ctx.createRadialGradient(x0, y0, r0, x0, y0, r1)
    } else {
        let [x0, y0, r0, x1, y1, r1] = args
        gr = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1)
    }
    let ns = `${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%`
    gr.addColorStop(0, `hsla(${ns}, 1)`)
    gr.addColorStop(0.6, `hsla(${ns}, 0.4)`)
    gr.addColorStop(1, `hsla(${ns}, 0)`)
    return gr
}

export const bgNoisy1 = (
    size: number,
    hsl1: HSL = [0, 0, 0],
    hsl2: HSL = [0, 100, 100],
    freq = 0.01
) => {
    let canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    let ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.fillStyle = `hsl(${hsl1[0]}, ${hsl1[1]}%, ${hsl1[2]}%)`
    ctx.fillRect(0, 0, size, size)
    for (let x = 0; x < size; x += 1) {
        for (let y = 0; y < size; y += 1) {
            let amt = noise2d(x * freq, y * freq)
            amt = map(amt, -1, 1, 0.25, 0.75)
            ctx.beginPath()
            ctx.fillStyle = `hsla(${hsl2[0]}, ${hsl2[1]}%, ${hsl2[2]}%, ${amt})`
            ctx.arc(x, y, 1, 0, Math.PI * 2)
            ctx.fill()
        }
    }
    return canvas
}

export const bgDotsHoriz = (size: number, r = 1.2, yval = 0.5, c1 = '#fff', c2 = '#000') => {
    let { canvas, ctx } = createCanvas(size, size, true, false)
    ctx.fillStyle = c1
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = c2
    for (let x = 0; x < size; x += 1) {
        for (let y = 0; y < size; y += 1) {
            let distance = y - size * yval
            let chance = easing.inQuart(1 - Math.min(Math.abs(distance) / (size * 0.5), 1)) * 0.15
            if (Math.random() < chance) {
                ctx.beginPath()
                ctx.arc(x, y, r, 0, Math.PI * 2)
                ctx.fill()
            }
        }
    }

    return canvas
}

export const bgDotsCirc = (size: number, c1 = '#fff', c2 = '#000') => {
    let { canvas, ctx } = createCanvas(size, size, true, false)
    ctx.fillStyle = c1
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = c2
    for (let x = 0; x < size; x += 1) {
        for (let y = 0; y < size; y += 1) {
            let dist = Math.hypot(x - size * 0.5, y - size * 0.5)
            let chance = easing.inQuart(1 - Math.min(dist / (size * 0.6), 1)) * 0.15
            if (Math.random() < chance) {
                ctx.beginPath()
                ctx.arc(x, y, 1.2, 0, Math.PI * 2)
                ctx.fill()
            }
        }
    }

    return canvas
}

export const bgDots = (size: number, c1 = '#fff', c2 = '#000') => {
    let { canvas, ctx } = createCanvas(size, size)
    ctx.fillStyle = c1
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = c2
    for (let x = 0; x < size; x += 7) {
        for (let y = 0; y < size; y += 7) {
            ctx.beginPath()
            ctx.arc(x, y, 2.5, 0, Math.PI * 2)
            ctx.fill()
        }
    }
    return canvas
}

export const bgFluffy = (size: number, v1 = 198, v2 = 75) => {
    // hsl(198, 27%, 64%)
    // hsl(180, 18%, 76%)
    // hsl(353, 80%, 88%)

    let { ctx, canvas } = createCanvas(size, size, true, false)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, size, size)

    ctx.fillStyle = `hsl(${hue(v1, 150)}, 80%, ${v2 + 15}%)`
    ctx.fillRect(0, 0, size, size)

    for (let i = 0; i < 6; i++) {
        let x = random(size)
        let y = random(size)
        let gr = rgr(ctx, [v1, 23, v2 + random(-5, 15)], x, y, random(size * 0.3, size * 0.6))
        ctx.fillStyle = gr
        ctx.beginPath()
        ctx.fillRect(0, 0, size, size)
        ctx.fill()
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    lotsOfCircles(ctx, size)

    return canvas
}

export const bgFluffy2 = (size: number, v1 = 350, v2 = 90) => {
    let { ctx, canvas } = createCanvas(size, size, true, false)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, size, size)

    ctx.fillStyle = `hsl(${hue(v1, 20)}, 70%, ${v2}%)`
    ctx.fillRect(0, 0, size, size)

    for (let i = 0; i < 10; i++) {
        let x = random(size)
        let y = random(size)
        let gr = rgr(ctx, [v1, 20, v2 + random(10)], x, y, random(size * 0.2, size * 0.4))
        ctx.fillStyle = gr
        ctx.beginPath()
        ctx.fillRect(0, 0, size, size)
        ctx.fill()
    }
    return canvas
}

// function draw() {
//     ctx.clearRect(0, 0, SIZE, SIZE)

//     ctx.drawImage(bgDotsCirc(SIZE), 0, 0, SIZE, SIZE)
// }

// draw()
