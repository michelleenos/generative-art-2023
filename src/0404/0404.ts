import '../style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import { Pane } from 'tweakpane'
import map from '~/helpers/map'
import random from '~/helpers/random'
import loop from '~/helpers/loop'
import canvasToVideo from '~/helpers/canvas-to-video'
import shuffle from '~/helpers/shuffle'

let width = window.innerWidth
let height = window.innerHeight
let { ctx, canvas } = createCanvas(width, height)

const PARAMS = {
    numPetals: 10,
    rotationDiff: Math.PI,
    numLines: 80,
    drawAtOnce: 3,
    cpVarX: 0.1,
    cpVarY: 0.02,
}

let pane = new Pane()
let flower = pane.addFolder({ title: 'flower' })
flower.addInput(PARAMS, 'numPetals', { min: 1, max: 40, step: 2 })
flower.addInput(PARAMS, 'numLines', { min: 10, max: 400, step: 1 })
flower.addInput(PARAMS, 'drawAtOnce', { min: 1, max: 10, step: 1 })
flower.addInput(PARAMS, 'cpVarX', {
    label: 'cp x var (thickness)',
    min: 0,
    max: 1,
    step: 0.01,
})
flower.addInput(PARAMS, 'cpVarY', { min: 0, max: 0.5, step: 0.01, label: 'cp y var (wiggliness)' })
flower.addButton({ title: 'restart & record' }).on('click', () => petalStart(true))
flower.addButton({ title: 'restart' }).on('click', () => petalStart())

function circle(x, y, radius = 5) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
}

type PetalOpts = {
    x: number
    y: number
    endRangeY?: [number, number]
    endRangeX?: [number, number]
    controlRangeX?: [number, number]
    controlVarX?: number
    controlVarY?: number
    rotation?: number
}

class Petal {
    x: number
    y: number
    start: { x: number; y: number } = { x: 0, y: 0 }
    end: { x: number; y: number }
    cp1: { x: number; y: number }
    cp2: { x: number; y: number }
    controlVarX: number
    controlVarY: number
    rotation: number

    constructor({
        x,
        y,
        endRangeX = [-100, 100],
        endRangeY = [300, 500],
        controlRangeX = [50, 100],
        controlVarX = 50,
        controlVarY = 100,
        rotation = 0,
    }: PetalOpts) {
        this.x = x
        this.y = y
        this.controlVarX = controlVarX
        this.controlVarY = controlVarY
        this.rotation = rotation
        this.end = {
            x: random(endRangeX[0], endRangeX[1]),
            y: random(-endRangeY[0], -endRangeY[1]),
        }
        this.cp1 = {
            x: random(-controlRangeX[0], -controlRangeX[1]),
            y: random(this.end.y * 0.1, this.end.y * 0.4),
        }
        this.cp2 = {
            x: random(controlRangeX[0], controlRangeX[1]),
            y: random(this.end.y * 0.6, this.end.y * 0.9),
        }
    }

    draw = (t) => {
        t *= 0.01
        // ctx.clearRect(0, 0, width, height)
        let cp1 = {
            x: this.cp1.x + this.controlVarX * Math.sin(t * 1.5 + Math.PI),
            y: this.cp1.y + Math.sin(t * 0.8) * this.controlVarY,
        }
        let cp2 = {
            x: this.cp2.x + this.controlVarX * Math.sin(t * 2.5),
            y: this.cp2.y + Math.sin(t) * this.controlVarY,
        }

        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)

        ctx.beginPath()
        ctx.moveTo(this.start.x, this.start.y)
        ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, this.end.x, this.end.y)
        // ctx.closePath()
        ctx.stroke()
        ctx.restore()
    }
}

class PetalDrawer {
    numLines: number
    positions: number[]
    currentPetal: number = 0
    currentLine: number = 0
    petal: Petal
    done: boolean = false
    startAt: number
    color: string

    constructor({ numLines = 50, positions, startAt = 0, color = 'rgba(255,255,255,0.1)' }) {
        this.numLines = numLines
        this.positions = positions
        this.startAt = startAt
        this.color = color
        this.petal = createPetal(width, height, this.positions[this.currentPetal])
    }

    draw = (t: DOMHighResTimeStamp, elapsed: number) => {
        if (this.done) return
        if (elapsed < this.startAt) return
        if (this.currentLine < this.numLines) {
            this.currentLine++
            ctx.strokeStyle = this.color
            this.petal?.draw(t)
        } else {
            if (this.currentPetal >= this.positions.length - 1) {
                this.done = true
                return
            }
            this.currentLine = 0
            this.currentPetal++
            this.petal = createPetal(width, height, this.positions[this.currentPetal])
        }
    }
}

let recorder
let count = 0
let start: DOMHighResTimeStamp = 0
let petalLoop: ReturnType<typeof loop>
let drawers: PetalDrawer[] = []
let rotationStep

ctx.lineWidth = 0.5
ctx.strokeStyle = 'rgba(255,255,255,0.1)'
ctx.fillStyle = 'rgba(255,255,255,0.1)'

function draw(t: DOMHighResTimeStamp) {
    count++

    if (drawers.every((drawer) => drawer.done)) {
        petalLoop.stop()
        if (recorder) recorder.stop()
        return
    }

    drawers.forEach((drawer) => drawer.draw(t, count))
}

function createPetal(width, height, rotation) {
    let min = Math.min(width, height)
    return new Petal({
        x: width * 0.5,
        y: height * 0.5,
        controlRangeX: [min * 0.05, min * 0.15],
        endRangeY: [min * 0.4, min * 0.45],
        endRangeX: [min * -0.05, min * 0.05],
        controlVarX: min * PARAMS.cpVarX,
        controlVarY: min * PARAMS.cpVarY,
        rotation,
    })
}

function petalStart(record = false) {
    if (petalLoop) petalLoop.stop()
    ctx.clearRect(0, 0, width, height)
    start = 0
    count = 0
    rotationStep = (Math.PI * 2) / PARAMS.numPetals

    let positions: number[] = []
    for (let i = 0; i < PARAMS.numPetals; i++) {
        positions.push(i * rotationStep)
    }
    shuffle(positions)

    let len = positions.length
    let each = len / PARAMS.drawAtOnce

    for (let i = 0; i < PARAMS.drawAtOnce; i++) {
        let pos = positions.slice(i * each, (i + 1) * each)
        // if each isn't an integer, the last drawer(s) will have more petals
        let startAt = (PARAMS.numLines / PARAMS.drawAtOnce) * (PARAMS.drawAtOnce - i - 1)

        drawers.push(
            new PetalDrawer({
                numLines: PARAMS.numLines,
                positions: pos,
                startAt,
            })
        )
    }

    if (record) {
        recorder = canvasToVideo(canvas)
    } else {
        recorder = null
    }

    petalLoop = loop(draw)
}

petalStart()
