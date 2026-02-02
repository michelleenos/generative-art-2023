import '../../style.css'
import createCanvas from '~/helpers/create-canvas'
import { Pane, SliderBladeApi } from 'tweakpane'
import loop from '~/helpers/loop'
import { shuffle } from '~/helpers/utils'
import { Petal } from './petal'

let width = 800
let height = 800
let { ctx, canvas } = createCanvas(width, height)

const PARAMS = {
    numPetals: 10,
    numLines: 450,
    cpAmpX: 80,
    cpAmpY: 20,
    endXVar: 50,
    // endX: { min: -100, max: 100 },
    endY: { min: 320, max: 350 },
    cpX: { min: 40, max: 120 },
    cp1Mult: { x: 1.5, y: 0.8 },
    cp2Mult: { x: 2.5, y: 1 },
    drawAtOnce: 5,
    lineSpace: 1,
    drawPerFrame: 2,
    addRecordOption: false,
}

let pane = new Pane()
let f = pane.addFolder({ title: 'flower' })
f.addBinding(PARAMS, 'numPetals', { min: 1, max: 40, step: 2 })
f.addBinding(PARAMS, 'numLines', { min: 10, max: 1000, step: 1 })
f.addBinding(PARAMS, 'drawAtOnce', { min: 1, max: 10, step: 1 })
f.addBinding(PARAMS, 'cpAmpX', { min: 1, max: 300, step: 1 })
f.addBinding(PARAMS, 'cpAmpY', { min: 1, max: 300, step: 1 })
f.addBinding(PARAMS, 'endXVar', { min: 0, max: 200, step: 1 })
f.addBinding(PARAMS.endY, 'min', { min: 0, max: 500, step: 1, label: 'endY.min' })
f.addBinding(PARAMS.endY, 'max', { min: 0, max: 500, step: 1, label: 'endY.max' })
f.addBinding(PARAMS.cpX, 'min', { min: 0, max: 500, step: 1, label: 'cpX.min' })
f.addBinding(PARAMS.cpX, 'max', { min: 0, max: 500, step: 1, label: 'cpX.max' })
f.addBinding(PARAMS, 'cp1Mult', { min: -10, max: 10, step: 0.1 })
f.addBinding(PARAMS, 'cp2Mult', { min: -10, max: 10, step: 0.1 })
f.addBinding(PARAMS, 'lineSpace', { min: 0, max: 10, step: 0.01 })

f.addBinding(PARAMS, 'drawPerFrame', { min: 1, max: 25, step: 1 })
f.addButton({ title: 'restart' }).on('click', () => petalStart())

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
        this.petal = this.makePetal(width, height, this.positions[this.currentPetal])
    }

    draw = (t: number, elapsed: number) => {
        if (this.done) return

        if (elapsed < this.startAt) return
        if (this.currentLine < this.numLines) {
            this.currentLine++
            ctx.strokeStyle = this.color
            this.petal?.draw(t, ctx)
        } else {
            if (this.currentPetal >= this.positions.length - 1) {
                this.done = true
                return
            }
            this.currentLine = 0
            this.currentPetal++
            this.petal = this.makePetal(width, height, this.positions[this.currentPetal])
        }
    }

    makePetal(width: number, height: number, rotation: number) {
        return new Petal({
            x: width * 0.5,
            y: height * 0.5,
            cp1Mult: PARAMS.cp1Mult,
            cp2Mult: PARAMS.cp2Mult,
            endX: { min: -PARAMS.endXVar, max: PARAMS.endXVar },
            endY: PARAMS.endY,
            cpAmpX: PARAMS.cpAmpX,
            cpAmpY: PARAMS.cpAmpY,
            cpX: PARAMS.cpX,
            lineSpace: PARAMS.lineSpace,
            rotation,
            throttleFps: false,
        })
    }
}

let count = 0
let petalLoop: ReturnType<typeof loop>
let drawers: PetalDrawer[] = []
let timeStep = 1000 / 60
let lastTime = 0

function timedDraw(time: number) {
    let timeLeft = time - lastTime
    while (timeLeft >= timeStep) {
        timeLeft -= timeStep
        lastTime += timeStep
        draw(lastTime, timeStep)
    }
}

function draw(time: number, delta: number) {
    let t = time - delta
    let deltaStep = delta / PARAMS.drawPerFrame
    let i = 0
    while (i < PARAMS.drawPerFrame) {
        count++
        t += deltaStep
        if (drawers.every((drawer) => drawer.done)) {
            petalLoop.stop()
            return
        }

        drawers.forEach((drawer) => drawer.draw(t, count))
        i++
    }
}

function petalStart() {
    if (petalLoop) petalLoop.stop()
    lastTime = performance.now()
    drawers = []
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#0e0d0d'
    ctx.fillRect(0, 0, width, height)
    count = 0
    const rotationStep = (Math.PI * 2) / PARAMS.numPetals

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
            }),
        )
    }

    ctx.lineWidth = 0.5
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'

    petalLoop = loop(timedDraw)
}

petalStart()
