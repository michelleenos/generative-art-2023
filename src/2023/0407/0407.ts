import { Petal } from '~/2023/0404/petal'
import createCanvas from '~/helpers/create-canvas'
import loop from '~/helpers/loop'
import { map, random } from '~/helpers/utils'
import '../../style.css'
import { Pane } from 'tweakpane'
import { saveCanvasImage } from '~/helpers/canvas-save-image'

// let btn = document.createElement('button')
// btn.innerText = 'make zip'
// document.getElementById('btns')?.appendChild(btn)

let width = 800
let height = 800
let { ctx, canvas } = createCanvas(width, height, true)
let min = Math.min(width, height)

// // petalCp1: {x: -43.017437647830086, y: -29.451991656886598}
// petalCp2:  {x: 47.68586229675711, y: -176.1898287514942}
// petalEnd: {x: 83.0392455444028, y: -280}
// scaleXVar:  [1.4560232008785423, 0.813482051391106]
// skewYVar: (2) [0, 1]

//     "scaleXVar": [ 1.5381398542753786, 0.8730910518903707],
//     "skewYVar": [ -0.3, 0.3],
//     "petalEnd": {"x": 11.281799885406372, "y": -280},
//     "petalCp1": { "x": -32.9473887634348, "y": -101.734820534763},
//     "petalCp2": {"x": 38.96214006233926,"y": -181.6409503009088}

const PARAMS = {
    numPetals: 7,
    cpAmpX: 80,
    cpAmpY: 16,
    cpX: 9,
    endX: 80,
    rotation: 0,
    scaleSpeed: 10,
    skewSpeed: 13,
    scaleX: { min: 0.9, max: 2 },
    skewY: { min: 0.5, max: 3 },
    cp1Mult: { x: 2.2, y: 0.5 },
    cp2Mult: { x: 0.5, y: 0.7 },
    rotateStep: 0.0003,
    lineSpace: 0.5,
    drawsPerFrame: 2,
    linesToDraw: 3000,
    opacity: 0.1,
    save() {
        saveCanvasImage(canvas, 'flower', 'png')
    },
}

interface MorphPetalParams {
    numPetals?: number
    petalLen?: number
    scaleSpeed?: number
    skewSpeed?: number
    scaleX?: { min: number; max: number }
    skewY?: { min: number; max: number }
    rotateStep?: number
    opacity?: number
}

class MorphPetal {
    petal: Petal
    scaleSpeed: number
    skewSpeed: number
    numPetals: number
    ctx: CanvasRenderingContext2D = createCanvas(min, min, true, false).ctx
    opacity: number
    // scaleXVar: [number, number]
    // skewYVar: [number, number]
    scaleX: { min: number; max: number }
    skewY: { min: number; max: number }

    rotateStart: number = random(0, Math.PI)
    rotateEach: number
    rotateCurrent: number = this.rotateStart
    count: number = 0
    done = false

    constructor({
        numPetals = 5,
        petalLen = min * 0.4,
        scaleSpeed = 10,
        skewSpeed = 13,
        scaleX = { min: 0.8, max: 2 },
        skewY = { min: 0, max: 2 },
        rotateStep = 0.0003,
        opacity = 0.1,
    }: MorphPetalParams) {
        this.numPetals = numPetals
        this.petal = new Petal({
            x: min / 2,
            y: min / 2,
            endY: { min: petalLen, max: petalLen },
            endX: PARAMS.endX,
            cpX: { min: PARAMS.cpX, max: PARAMS.cpX },
            cpAmpX: PARAMS.cpAmpX,
            cpAmpY: PARAMS.cpAmpY,
            rotation: 0,
            cp1Mult: { ...PARAMS.cp1Mult },
            cp2Mult: { ...PARAMS.cp2Mult },
            lineSpace: PARAMS.lineSpace,
            throttleFps: false,
        })
        this.rotateEach = rotateStep
        this.opacity = opacity
        this.scaleSpeed = scaleSpeed
        this.skewSpeed = skewSpeed
        this.scaleX = scaleX
        this.skewY = skewY

        // this.scaleXVar = [random(0.8, 1), random(1.4, 2)]
        // if (random() < 0.5)
        //     [this.scaleXVar[0], this.scaleXVar[1]] = [this.scaleXVar[1], this.scaleXVar[0]]
        // this.skewYVar = [-0.3, 0.3]
    }

    updateParams = () => {
        this.petal.cpAmpX = PARAMS.cpAmpX
        this.petal.cpAmpY = PARAMS.cpAmpY
        this.petal.cp1Mult = { ...PARAMS.cp1Mult }
        this.petal.cp2Mult = { ...PARAMS.cp2Mult }
        this.petal.lineSpace = PARAMS.lineSpace
        this.scaleSpeed = PARAMS.scaleSpeed
        this.skewSpeed = PARAMS.skewSpeed
        this.skewY = { ...PARAMS.skewY }
        this.scaleX = { ...PARAMS.scaleX }
        this.rotateEach = PARAMS.rotateStep
        this.opacity = PARAMS.opacity
    }

    draw(time: number, delta: number) {
        if (this.done) return
        let t = time - delta
        let deltaStep = delta / PARAMS.drawsPerFrame
        let i = 0
        while (i < PARAMS.drawsPerFrame) {
            t += deltaStep
            this.drawOffscreen(t)
            i++
        }

        this.drawToScreen()
        if (this.done) return true
        return false
    }

    drawOffscreen(t: number) {
        this.count++

        // this.ctx.clearRect(0, 0, min, min)

        this.ctx.strokeStyle = `rgba(255,255,255,${this.opacity})`
        this.ctx.lineWidth = 0.5

        this.petal.draw(t, this.ctx)

        if (this.count >= PARAMS.linesToDraw) {
            this.done = true
        }
    }

    drawToScreen() {
        // if (this.done) return
        this.rotateCurrent += this.rotateEach
        ctx.clearRect(0, 0, width, height)
        ctx.fillStyle = '#0e0d0d'
        ctx.fillRect(0, 0, width, height)

        let scaleX = map(
            Math.sin(-this.rotateCurrent * this.scaleSpeed),
            -1,
            1,
            this.scaleX.min,
            this.scaleX.max,
        )
        let skewY = map(
            Math.cos(-this.rotateCurrent * this.skewSpeed),
            -1,
            1,
            this.skewY.min,
            this.skewY.max,
        )

        for (let i = 0; i < this.numPetals; i++) {
            let rotation = (i * (Math.PI * 2)) / this.numPetals

            ctx.save()
            ctx.translate(width / 2, height / 2)
            ctx.rotate(rotation + this.rotateCurrent)

            ctx.transform(scaleX, skewY, 0, 1, 0, 0)
            ctx.translate(-min / 2, -min / 2)
            ctx.drawImage(
                this.ctx.canvas,
                0,
                0,
                this.ctx.canvas.width,
                this.ctx.canvas.height,
                0,
                0,
                min,
                min,
            )
            ctx.restore()
        }
    }
}

let lastTime = 0
let timeStep = 1000 / 60
let morphPetal: MorphPetal | null = null
let petalLoop: ReturnType<typeof loop>

function newAnimation() {
    if (petalLoop) petalLoop.stop()
    morphPetal = new MorphPetal({
        numPetals: PARAMS.numPetals,
        petalLen: min * 0.4,
        scaleSpeed: PARAMS.scaleSpeed,
        skewSpeed: PARAMS.skewSpeed,
        scaleX: { ...PARAMS.scaleX },
        skewY: { ...PARAMS.skewY },
        rotateStep: PARAMS.rotateStep,
    })
    lastTime = performance.now()

    petalLoop = loop(draw)
}

function draw(time: number) {
    let timeLeft = time - lastTime
    while (timeLeft >= timeStep) {
        timeLeft -= timeStep
        lastTime += timeStep
        morphPetal?.draw(lastTime, timeStep)
    }
}

newAnimation()

const pane = new Pane()
const f = pane.addFolder({ title: 'params' })

const updates = [
    f.addBinding(PARAMS, 'cpAmpX', { min: -200, max: 200, step: 1 }),
    f.addBinding(PARAMS, 'cpAmpY', { min: 0, max: 200, step: 1 }),
    f.addBinding(PARAMS, 'cp1Mult', { min: -5, max: 5, step: 0.1 }),
    f.addBinding(PARAMS, 'cp2Mult', { min: -5, max: 5, step: 0.1 }),
    f.addBinding(PARAMS, 'lineSpace', { min: 0, max: 5, step: 0.01 }),
    f.addBinding(PARAMS, 'scaleSpeed', { min: -50, max: 50, step: 1 }),
    f.addBinding(PARAMS, 'skewSpeed', { min: -50, max: 50, step: 1 }),
    f.addBinding(PARAMS.skewY, 'min', { min: 0, max: 5, step: 0.1, label: 'skewY.min' }),
    f.addBinding(PARAMS.skewY, 'max', { min: 0, max: 5, step: 0.1, label: 'skewY.max' }),
    f.addBinding(PARAMS.scaleX, 'min', { min: 0, max: 4, step: 0.1, label: 'scaleX.min' }),
    f.addBinding(PARAMS.scaleX, 'max', { min: 0, max: 4, step: 0.1, label: 'scaleX.max' }),
    f.addBinding(PARAMS, 'rotateStep', { min: 0, max: 0.1, step: 0.0001 }),
    f.addBinding(PARAMS, 'opacity', { min: 0, max: 1, step: 0.01 }),
]
updates.forEach((b) => b.on('change', () => morphPetal?.updateParams()))
f.addBinding(PARAMS, 'drawsPerFrame', { min: 1, max: 20, step: 1 })

const f2 = pane.addFolder({ title: 'params (restart required)' })

// f.addBlade({ view: 'separator' })
// f.addBlade({
//     view: 'infodump',
//     content: 'the below items require restart to see changes',
//     markdown: false,
// })
f2.addBinding(PARAMS, 'endX', { min: 0, max: 150, step: 1 })
f2.addBinding(PARAMS, 'numPetals', { min: 1, max: 40, step: 1 })
f2.addBinding(PARAMS, 'cpX', { min: 0, max: 100, step: 1 })
f2.addBinding(PARAMS, 'linesToDraw', { min: 10, max: 10000, step: 1 })
pane.addButton({ title: 'restart' }).on('click', newAnimation)
pane.addButton({ title: 'save' }).on('click', PARAMS.save)
