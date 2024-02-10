import '../../style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import { Pane } from 'tweakpane'
import { rectCenter } from '~/helpers/canvas/shapes'
import { clamp, map, random, shuffle } from '~/helpers/utils'
import loop from '~/helpers/loop'
import easings from '~/helpers/easings'

let pal1 = ['#031d44', '#04395e', '#70a288', '#dab785', '#d5896f']
let pal2 = ['#f24333', '#ff8019', '#f6b02c', '#2ec2ea', '#3bed73', '#fc6c9c']
let pal3 = ['#040925', '#2a3ded', '#186f44', '#35a670', '#e3c819']
let pal4 = ['#d7263d', '#f46036', '#2e294e', '#1b998b', '#c5d86d']

const params = {
    n: 5,
    subcells: 4,
    animate: false,
}

let width = window.innerWidth
let height = window.innerHeight
let { ctx, resizeCanvas, canvas } = createCanvas(width, height)
let palette: string[]
let m: number, cellStep: number, subcell: number, cellSize: number, cells: Cell[]
let subDivisions: [number, number, number, number][] = [],
    subSubDivisions: [number, number, number, number][] = []

type Movement = { start: number; dur: number }
type Style = 'stroke' | 'fill'
type LayerTiles = {
    type: 'tiles'
    dbl: boolean
    sizeMin: number
    sizeMax: number
    style: Style
    color: string
    skip: number[]
    move?: Movement
}
type LayerRects = { type: 'rects'; style: Style; color: string; w: number; h: number; dist: number }
type LayerRectsSwitch = {
    type: 'rectsSwitch'
    style: Style
    color: string
    w: number
    h: number
    dist: number
    edges: 'lr' | 'tb'
    move?: { start: number; dur: number }
}
type LayerSquareCorners = { type: 'squareCorners'; style: Style; color: string; size: number }
type LayerCircle = { type: 'circle'; style: Style; color: string; radius: number }

type Layer = LayerTiles | LayerRects | LayerSquareCorners | LayerCircle | LayerRectsSwitch
type Cell = { x: number; y: number; layers: Layer[] }

function createCells() {
    let cells: Cell[] = []
    let total = params.n * params.n
    for (let i = 0; i < total; i++) {
        palette = shuffle(palette)
        let x = (i % params.n) * cellStep
        let y = Math.floor(i / params.n) * cellStep
        let layers: Layer[] = []
        let rectsSoFar: { h: number; dist: number }[] = []

        for (let j = 0; j < 4; j++) {
            let color = palette[j % palette.length]
            let options = ['rects', 'squareCorners', 'rectsSwitch']
            j < 2 ? options.push('tiles') : options.push('circle')
            let type = random(options)

            if (type === 'tiles') {
                // let dbl = random() < 0.5
                let dbl = false
                let step = dbl ? subcell / 2 : subcell
                let n = dbl ? params.subcells * 2 : params.subcells
                let sizeMin = step * random(0.15, 0.3)
                let sizeMax = step * random(0.4, 0.85)
                // let style: Style = dbl ? 'fill' : random() < 0.5 ? 'stroke' : 'fill'
                let tiles = []
                let skip = []

                for (let i = 0; i < n * n; i++) {
                    if (random() < 0.1) skip.push(i)
                }

                let move

                move = {
                    start: random(0, 1),
                    dur: 0.3,
                }
                layers.push({ type, sizeMin, sizeMax, style: 'fill', color, skip, dbl, move })
            } else if (type === 'rects' || type === 'rectsSwitch') {
                let w = random(0.5, 0.9)
                let hStart = 0.1
                let hEnd = 0.4
                if (rectsSoFar.length >= 2) continue
                if (rectsSoFar.some((rect) => rect.h > 0.3)) hEnd = 0.2
                let h = random(hStart, hEnd)
                let dist = random(0.05, hEnd > 0.25 ? 0.25 : 0.4)
                rectsSoFar.push({ h, dist })
                let style: Style =
                    (dist - h / 2 <= 0.05 && dist > 0.1) || h > 0.25
                        ? 'stroke'
                        : random() < 0.5
                        ? 'stroke'
                        : 'fill'

                if (type === 'rectsSwitch') {
                    let edges: 'lr' | 'tb' = random(['lr', 'tb'])
                    let layer: LayerRectsSwitch = { type, w, h, dist, style, color, edges }
                    if (random() < 0.5) {
                        layer['move'] = { start: random(0, 1), dur: 0.3 }
                    }
                    layers.push(layer)
                } else {
                    layers.push({ type, w, h, dist, style, color })
                }
            } else if (type === 'squareCorners') {
                let size = cellSize * random(0.1, 0.3)
                let style: Style = random() < 0.5 ? 'stroke' : 'fill'
                layers.push({ type, size, style, color })
            } else if (type === 'circle') {
                let radius = cellSize * random(0.05, 0.3)
                let style: Style = random() < 0.5 ? 'stroke' : 'fill'
                layers.push({ type, style, color, radius })
            }
        }

        cells.push({ x, y, layers })
    }
    return cells
}

function setup() {
    m = Math.min(width, height) * 0.9
    cellStep = m / params.n
    cellSize = cellStep * 0.8
    subcell = Math.floor(cellSize / params.subcells)
    subDivisions = []
    subSubDivisions = []

    for (let xi = 0; xi < params.subcells; xi++) {
        for (let yi = 0; yi < params.subcells; yi++) {
            let x = xi * subcell + subcell / 2
            let y = yi * subcell + subcell / 2
            subDivisions.push([x, y, xi, yi])
        }
    }

    for (let xi = 0; xi < params.subcells * 2; xi++) {
        for (let yi = 0; yi < params.subcells * 2; yi++) {
            let x = xi * subcell * 0.5 + subcell * 0.25
            let y = yi * subcell * 0.5 + subcell * 0.25
            subSubDivisions.push([x, y, xi, yi])
        }
    }

    palette = random([pal1, pal2, pal3, pal4])
    palette = shuffle(palette)

    cells = createCells()
}

function draw(time: number = 0) {
    let per = ((time * 0.001) / 5) % 1
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#fff7e2'
    ctx.fillRect(0, 0, width, height)

    ctx.lineWidth = 3

    ctx.save()
    ctx.translate((width - m + cellStep - cellSize) / 2, (height - m + cellStep - cellSize) / 2)

    cells.forEach((cell, ci) => {
        let { x, y, layers } = cell
        ctx.save()
        ctx.translate(x, y)

        layers.forEach((layer, i) => {
            if (layer.type === 'tiles') {
                let { dbl, sizeMin, sizeMax, style, color, move, skip } = layer
                let tiles = dbl ? subSubDivisions : subDivisions

                tiles.forEach(([cx, cy, xi, yi], i) => {
                    if (skip.includes(i)) return
                    style === 'fill' ? (ctx.fillStyle = color) : (ctx.strokeStyle = color)
                    let size = sizeMax
                    if (move && params.animate) {
                        let { start, dur } = move
                        let t = normalizeTime((per + xi * 0.05 + yi * 0.05) % 1, start, dur)
                        let val = easings.inOutSine(t * 2)
                        size = sizeMax - val * sizeMin
                    }
                    ctx.beginPath()
                    rectCenter(ctx, { cx, cy, size })
                    style === 'fill' ? ctx.fill() : ctx.stroke()
                })
            } else if (layer.type === 'rects') {
                let { w, h, dist, style, color } = layer
                style === 'fill' ? (ctx.fillStyle = color) : (ctx.strokeStyle = color)
                ctx.save()
                ctx.translate(cellSize / 2, cellSize / 2)
                let angle = (Math.PI * 2) / params.subcells
                // ctx.rotate(val * Math.PI * 0.5)
                // let scale = map(Math.sin(val * Math.PI), -1, 1, 1, 1.3)
                // ctx.scale(scale, scale)

                for (let i = 0; i < params.subcells; i++) {
                    ctx.save()
                    ctx.rotate(angle * i)
                    ctx.beginPath()
                    ctx.moveTo(w * cellSize * -0.5, dist * cellSize + h * cellSize * 0.5)
                    ctx.lineTo(w * cellSize * 0.5, dist * cellSize + h * cellSize * 0.5)
                    ctx.lineTo(w * cellSize * 0.5, dist * cellSize - h * cellSize * 0.5)
                    ctx.lineTo(w * cellSize * -0.5, dist * cellSize - h * cellSize * 0.5)
                    ctx.closePath()
                    style === 'fill' ? ctx.fill() : ctx.stroke()
                    ctx.restore()
                }

                ctx.restore()
            } else if (layer.type === 'rectsSwitch') {
                let { w, h, dist, style, color, edges, move } = layer
                style === 'fill' ? (ctx.fillStyle = color) : (ctx.strokeStyle = color)
                ctx.save()
                ctx.translate(cellSize / 2, cellSize / 2)
                let angle = (Math.PI * 2) / params.subcells

                if (move && params.animate) {
                    let { start, dur } = move
                    let prog = normalizeTime(per, start, dur)
                    let val = easings.inQuint(prog)
                    dist = map(val, 0, 1, -dist, dist)
                }

                if (edges === 'lr') ctx.rotate(angle)

                for (let i = 0; i < 2; i++) {
                    ctx.save()
                    if (i === 1) ctx.scale(-1, -1)
                    ctx.beginPath()
                    ctx.moveTo(w * cellSize * -0.5, dist * cellSize + h * cellSize * 0.5)
                    ctx.lineTo(w * cellSize * 0.5, dist * cellSize + h * cellSize * 0.5)
                    ctx.lineTo(w * cellSize * 0.5, dist * cellSize - h * cellSize * 0.5)
                    ctx.lineTo(w * cellSize * -0.5, dist * cellSize - h * cellSize * 0.5)
                    ctx.closePath()
                    style === 'fill' ? ctx.fill() : ctx.stroke()
                    ctx.restore()
                }

                ctx.restore()
            } else if (layer.type === 'squareCorners') {
                let { size, style, color } = layer
                style === 'fill' ? (ctx.fillStyle = color) : (ctx.strokeStyle = color)
                ctx.save()
                ctx.translate(cellSize / 2, cellSize / 2)
                let angle = (Math.PI * 2) / params.subcells
                let cx = cellSize * 0.25
                let cy = cellSize * 0.25
                for (let i = 0; i < params.subcells; i++) {
                    ctx.save()
                    ctx.rotate(angle * i)
                    ctx.translate(cx, cy)
                    ctx.rotate(Math.PI * 0.25)
                    ctx.beginPath()
                    rectCenter(ctx, { cx: 0, cy: 0, size })
                    style === 'fill' ? ctx.fill() : ctx.stroke()
                    ctx.restore()
                }
                ctx.restore()
            } else if (layer.type === 'circle') {
                let { radius, style, color } = layer
                style === 'fill' ? (ctx.fillStyle = color) : (ctx.strokeStyle = color)
                ctx.save()
                ctx.translate(cellSize / 2, cellSize / 2)
                ctx.beginPath()
                ctx.arc(0, 0, radius, 0, Math.PI * 2)
                style === 'fill' ? ctx.fill() : ctx.stroke()
                ctx.restore()
            }
        })

        ctx.restore()
    })

    ctx.restore()
}

const normalizeTime = (cur: number, start: number, dur: number) => {
    if (cur < start) {
        cur += 1
    }
    let diff = cur - start
    return clamp(diff / dur, 0, 1)
}

function setupPane() {
    const pane = new Pane()
    let folder = pane.addFolder({ title: 'controls' })
}

window.addEventListener('resize', () => {
    width = window.innerWidth
    height = window.innerHeight
    resizeCanvas(width, height)
    setup()
})

canvas.addEventListener('click', () => {
    setup()
})

setupPane()
setup()
loop(draw)
