import '../../style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import { Pane } from 'tweakpane'
import loop from '~/helpers/loop'
import canvasToVideo from '~/helpers/canvas-to-video'
import { shuffle } from '~/helpers/utils'
import { Petal, createPetal } from './petal'

let width = window.innerWidth
let height = window.innerHeight
let { ctx, canvas } = createCanvas(width, height)

const PARAMS = {
    numPetals: 10,
    numLines: 450,
    drawAtOnce: 5,
    cpVarX: 0.1,
    cpVarY: 0.02,
    speed: 0.0005,
    addRecordOption: false,
}

let pane = new Pane()
let flower = pane.addFolder({ title: 'flower' })
flower.addInput(PARAMS, 'numPetals', { min: 1, max: 40, step: 2 })
flower.addInput(PARAMS, 'numLines', { min: 10, max: 1000, step: 1 })
flower.addInput(PARAMS, 'drawAtOnce', { min: 1, max: 10, step: 1 })
flower.addInput(PARAMS, 'cpVarX', {
    label: 'cp x var (thickness)',
    min: 0,
    max: 1,
    step: 0.01,
})
flower.addInput(PARAMS, 'cpVarY', {
    min: 0,
    max: 0.5,
    step: 0.01,
    label: 'cp y var (wiggliness)',
})
flower.addInput(PARAMS, 'speed', { min: 0.0001, max: 0.01, step: 0.0001 })
if (PARAMS.addRecordOption) {
    flower.addButton({ title: 'restart & record' }).on('click', () => petalStart(true))
}

flower.addButton({ title: 'restart' }).on('click', () => petalStart())

type PetalDrawOpts = {
    numLines?: number
    positions: number[]
    startAt?: number
    color?: string
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

    constructor({
        numLines = 50,
        positions,
        startAt = 0,
        color = 'rgba(255,255,255,0.1)',
    }: PetalDrawOpts) {
        this.numLines = numLines
        this.positions = positions
        this.startAt = startAt
        this.color = color
        this.petal = makePetal(width, height, this.positions[this.currentPetal])
    }

    draw = (t: DOMHighResTimeStamp, elapsed: number) => {
        if (this.done) return
        if (elapsed < this.startAt) return
        if (this.currentLine < this.numLines) {
            this.currentLine++
            ctx.strokeStyle = this.color
            this.petal?.draw(t * PARAMS.speed)
        } else {
            if (this.currentPetal >= this.positions.length - 1) {
                this.done = true
                return
            }
            this.currentLine = 0
            this.currentPetal++
            this.petal = makePetal(width, height, this.positions[this.currentPetal])
        }
    }
}

let recorder: ReturnType<typeof canvasToVideo> | null
let count = 0
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

function makePetal(width: number, height: number, rotation: number) {
    let min = Math.min(width, height)
    return createPetal(ctx, {
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
