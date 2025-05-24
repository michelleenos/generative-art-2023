import '../../style.css'
import createCanvas from '~/helpers/create-canvas'
import { createPetal, type Petal } from '~/2023/0404/petal'
import loop from '~/helpers/loop'
// import map from '~/helpers/map'
// import random from '~/helpers/random'
import { map, random } from '~/helpers/utils'
import makeImages from '~/helpers/canvas-images'

let btn = document.createElement('button')
btn.innerText = 'make zip'
document.getElementById('btns')?.appendChild(btn)

let width = 800
let height = 800
let { ctx, canvas } = createCanvas(width, height, true)
let min = Math.min(width, height)
let { getImage, downloadZip } = makeImages(canvas)

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
    controlVarX: 0.1,
    controlVarY: 0.02,
    controlRangeX: [0.01, 0.01],
    endRangeX: [-0.1, 0.1],
    pace: 0.0005,
    rotation: 0,
    cp1Mult: { x: 2.2, y: 0.5 },
    cp2Mult: { x: 0.5, y: 0.7 },
}

class MorphPetal {
    petal: Petal
    scaleX: number = 0
    skewY: number = 0
    numPetals: number
    ctx: CanvasRenderingContext2D = createCanvas(min, min, true, false).ctx
    scaleXVar: [number, number]
    skewYVar: [number, number]
    rotateStart: number = random(0, Math.PI)
    rotateEach: number = 0.0003
    rotateCurrent: number = this.rotateStart
    count: number = 0

    constructor(numPetals = 5, petalLen = min * 0.5) {
        this.numPetals = numPetals
        this.petal = createPetal(this.ctx, {
            x: min / 2,
            y: min / 2,
            endRangeX: [min * PARAMS.endRangeX[0], min * PARAMS.endRangeX[1]],
            endRangeY: [petalLen, petalLen],
            controlRangeX: [min * PARAMS.controlRangeX[0], min * PARAMS.controlRangeX[1]],
            controlVarX: min * PARAMS.controlVarX,
            controlVarY: min * PARAMS.controlVarY,
            rotation: 0,
            cp1Mult: PARAMS.cp1Mult,
            cp2Mult: PARAMS.cp2Mult,
        })

        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)'
        this.ctx.lineWidth = 0.5
        this.scaleXVar = [random(0.8, 1), random(1.4, 2)]
        if (random() < 0.5)
            [this.scaleXVar[0], this.scaleXVar[1]] = [this.scaleXVar[1], this.scaleXVar[0]]
        this.skewYVar = [-0.3, 0.3]

        console.log({
            scaleXVar: this.scaleXVar,
            skewYVar: this.skewYVar,
            petalEnd: this.petal.end,
            petalCp1: this.petal.cp1,
            petalCp2: this.petal.cp2,
        })
    }

    drawOffscreen(t: number) {
        // this.ctx.clearRect(0, 0, min, min)
        this.petal.draw(t)
    }

    draw(t: number) {
        t *= PARAMS.pace
        this.count++
        this.rotateCurrent += this.rotateEach
        this.drawOffscreen(t)

        let scaleX = map(
            Math.sin(-this.rotateCurrent * 10),
            -1,
            1,
            this.scaleXVar[0],
            this.scaleXVar[1]
        )
        let skewY = map(
            Math.cos(-this.rotateCurrent * 13),
            -1,
            1,
            this.skewYVar[0],
            this.skewYVar[1]
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
                min
            )
            ctx.restore()
        }
    }
}

// function angleDistFromRotation(angle, rotation) {
//     let dist = Math.abs(angle - rotation)
//     return dist > Math.PI ? Math.PI * 2 - dist : dist
// }

let t = 0
function draw() {
    t++
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#171717'
    ctx.fillRect(0, 0, width, height)

    petals.forEach((petal) => {
        petal.draw(t * 10)
    })
}

// const mouseAngle = (mouse) =>
//     Math.atan2(-mouse.y + height / 2, -mouse.x + width / 2) + Math.PI

let petals: MorphPetal[] = []
for (let i = 0; i < 1; i++) {
    petals.push(new MorphPetal(PARAMS.numPetals, min * 0.35))
}

function framesLoop() {
    let t = 0

    const animate = (t: number) => {
        // draw(t * 10)
        draw()
        getImage().then(() => {
            t++
            console.log(t)
            if (t === 1000) {
                downloadZip()
            } else {
                animate(t)
            }
        })
    }

    animate(t)
}

// framesLoop()
let drawLoop = loop(draw)

btn.addEventListener('click', () => {
    drawLoop.stop()

    petals.forEach((petal) => {
        petal.ctx.clearRect(0, 0, petal.ctx.canvas.width, petal.ctx.canvas.height)
        petal.rotateCurrent = petal.rotateStart
    })

    framesLoop()
})
