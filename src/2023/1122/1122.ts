import '../../style.css'
import createCanvas from '~/helpers/create-canvas'
import { Pane } from 'tweakpane'
import { rectCenter } from '~/helpers/shapes'
import { clamp, map, random, shuffle } from '~/helpers/utils'
import loop from '~/helpers/loop'
import easings from '~/helpers/easings'

let pal1 = ['#031d44', '#04395e', '#70a288', '#dab785', '#d5896f']
let pal2 = ['#f24333', '#ff8019', '#f6b02c', '#2ec2ea', '#3bed73', '#fc6c9c']
let pal3 = ['#040925', '#2a3ded', '#186f44', '#35a670', '#e3c819']
let pal4 = ['#d7263d', '#f46036', '#2e294e', '#1b998b', '#c5d86d']

const params = {
    n: 4,
    subdiv: 5,
    layers: 5,
    animate: false,
    useTiles: false,
}

let width = window.innerWidth
let height = window.innerHeight
let { ctx, resizeCanvas, canvas } = createCanvas(width, height)
let palette: string[]
let m: number, cellStep: number, subcell: number, cellSize: number, cells: Cell[]

type Movement = { start: number; dur: number }
type Style = 'stroke' | 'fill'

type LayerBase = {
    color: string
    style: Style
    angleStart: number
    move?: Movement
}

type LayerCircle = LayerBase & { type: 'circle'; size: number }
type LayerSquares = LayerBase & { type: 'squares'; radius: number; size: number }
type LayerTiles = LayerBase & {
    type: 'tiles'
    dbl: boolean
    sz1: number
    sz2: number
    skip: number[]
}
type LayerRects = LayerBase & {
    type: 'rects'
    w: number
    h: number
    dist: number
    sides: 'lr' | 'tb' | 'all'
}
type Layer = LayerCircle | LayerTiles | LayerRects | LayerSquares
type Cell = { x: number; y: number; layers: Layer[] }

function createCells() {
    let cells: Cell[] = []
    let total = params.n * params.n
    for (let i = 0; i < total; i++) {
        palette = shuffle(palette)
        let x = (i % params.n) * cellStep
        let y = Math.floor(i / params.n) * cellStep
        let layers: Layer[] = []

        for (let j = 0; j < params.layers; j++) {
            let color = palette[j % palette.length]
            let options = ['rects', 'squares', 'circle']
            let angleStart = random([0, Math.PI / params.subdiv])
            if (params.useTiles) options.push('tiles')
            // j < 2 ? options.push('tiles') : options.push('circle')
            let type = random(options)
            if (type === 'tiles') {
                let dbl = random() < 0.5

                let n = dbl ? params.subdiv * 2 : params.subdiv
                let skip = new Array(n * n).reduce((acc, _, i) => {
                    if (random() < 0.1) acc.push(i)
                    return acc
                }, [])
                layers.push({
                    type,
                    angleStart,
                    sz1: (dbl ? subcell / 2 : subcell) * random(0.15, 0.3),
                    sz2: (dbl ? subcell / 2 : subcell) * random(0.4, 0.85),
                    style: 'fill',
                    color,
                    skip,
                    dbl: random() < 0.5,
                    move: {
                        start: random(0, 1),
                        dur: 0.3,
                    },
                })
            } else if (type === 'rects') {
                let w = random(0.3, 0.9)
                let hStart = 0.1
                let hEnd = 0.4
                let h = random(hStart, hEnd)
                let dist = random(0.05, 0.4)

                // let overlapping = (dist - h/2 <= 0.05 && dist > 0.1) || h > 0.25
                let overlap = dist - h / 2 <= 0.05 || h > 0.25

                layers.push({
                    type,
                    w,
                    h,
                    dist,
                    angleStart,
                    style: overlap ? 'stroke' : random() < 0.5 ? 'stroke' : 'fill',
                    color,
                    sides: params.subdiv === 4 ? random(['lr', 'tb', 'all']) : 'all',
                    move: random() < 0.5 ? { start: random(0, 1), dur: 0.3 } : undefined,
                })
            } else if (type === 'squares') {
                let size = cellSize * random(0.1, 0.3)
                let style: Style = random() < 0.5 ? 'stroke' : 'fill'
                layers.push({ type, size, radius: random(0.15, 0.3), style, color, angleStart })
            } else if (type === 'circle') {
                let style: Style = random() < 0.5 ? 'stroke' : 'fill'
                layers.push({ type, style, color, angleStart, size: cellSize * random(0.05, 0.3) })
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
    subcell = Math.floor(cellSize / params.subdiv)
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

    cells.forEach((cell) => {
        let { x, y, layers } = cell
        ctx.save()
        ctx.translate(x, y)

        layers.forEach((layer) => {
            if (layer.type === 'tiles') {
                let { dbl, sz1, sz2, style, color, move, skip } = layer
                let i = 0
                for (let xi = 0; xi < params.subdiv * (dbl ? 2 : 1); xi++) {
                    for (let yi = 0; yi < params.subdiv * (dbl ? 2 : 1); yi++) {
                        i++
                        if (skip.includes(i)) continue
                        let cx = (xi * subcell + subcell / 2) * (dbl ? 0.5 : 1)
                        let cy = (yi * subcell + subcell / 2) * (dbl ? 0.5 : 1)

                        style === 'fill' ? (ctx.fillStyle = color) : (ctx.strokeStyle = color)
                        let size = sz2
                        if (move && params.animate) {
                            let { start, dur } = move
                            let t = normalizeTime((per + xi * 0.05 + yi * 0.05) % 1, start, dur)
                            let val = easings.inOutSine(t * 2)
                            size = sz2 - val * sz1
                        }
                        ctx.beginPath()
                        rectCenter(ctx, { cx, cy, size })
                        style === 'fill' ? ctx.fill() : ctx.stroke()
                    }
                }
            } else if (layer.type === 'rects') {
                let { w, h, dist, style, color, move, sides } = layer
                style === 'fill' ? (ctx.fillStyle = color) : (ctx.strokeStyle = color)
                ctx.save()
                ctx.translate(cellSize / 2, cellSize / 2)
                ctx.rotate(layer.angleStart)
                let angle = (Math.PI * 2) / params.subdiv

                if (move && params.animate) {
                    let { start, dur } = move
                    let prog = normalizeTime(per, start, dur)
                    let val = easings.inQuint(prog)
                    dist = map(val, 0, 1, -dist, dist)
                }

                for (let i = 0; i < params.subdiv; i++) {
                    if (sides === 'lr' && i % 2 === 1) continue
                    if (sides === 'tb' && i % 2 === 0) continue
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
            } else if (layer.type === 'squares') {
                let { size, radius, style, color } = layer
                style === 'fill' ? (ctx.fillStyle = color) : (ctx.strokeStyle = color)
                ctx.save()
                ctx.translate(cellSize / 2, cellSize / 2)
                ctx.rotate(layer.angleStart)
                let angle = (Math.PI * 2) / params.subdiv
                let cx = cellSize * radius
                let cy = cellSize * radius
                for (let i = 0; i < params.subdiv; i++) {
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
                let { size, style, color } = layer
                style === 'fill' ? (ctx.fillStyle = color) : (ctx.strokeStyle = color)
                ctx.beginPath()
                ctx.arc(cellSize / 2, cellSize / 2, size, 0, Math.PI * 2)
                style === 'fill' ? ctx.fill() : ctx.stroke()
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
    folder.addBinding(params, 'animate')
    folder.addBinding(params, 'subdiv', { min: 2, max: 10, step: 1 }).on('change', setup)
    folder.addBinding(params, 'layers', { min: 1, max: 10, step: 1 }).on('change', setup)
    folder.addBinding(params, 'n', { min: 2, max: 10, step: 1 }).on('change', setup)
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
