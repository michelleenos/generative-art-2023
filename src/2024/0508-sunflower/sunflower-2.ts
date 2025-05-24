import '~/style.css'
import createCanvas from '~/helpers/create-canvas'
import { GUI } from 'lil-gui'
import loop from '~/helpers/loop'

const PHI = (1 + Math.sqrt(5)) / 2

const width = window.innerWidth
const height = window.innerHeight
const { ctx } = createCanvas(width, height)

// let goldenAngleDegrees = 360 * (2 - PHI)
let goldenAngleRadians = Math.PI * 2 * (2 - PHI)

interface SunflowerDrawOptions {
    count?: number
    maxRadius?: number
    minRadius?: number
    stepAngle?: number
    timingMode?: 'pixelsPerSecond' | 'stepsPerSecond'
    stepsPerSecond?: number
    pixelsPerSecond?: number
}

class SunflowerDraw {
    count: number = 100
    maxRadius: number = 300
    minRadius: number = 100
    minSize: number = 1
    maxSize: number = 10
    pixelsPerSecond = 1000
    stepAngle?: number
    timingMode: 'pixelsPerSecond' | 'stepsPerSecond' | 'static' = 'pixelsPerSecond'
    currentStepProgress = 0
    stepsPerSecond = 8
    currentPixels = 0
    currentStep = 0
    drawDots = false

    constructor(opts: SunflowerDrawOptions = {}) {
        Object.assign(this, opts)
    }

    getStep(step: number) {
        let percent = step / this.count
        let radius = this.minRadius + (this.maxRadius - this.minRadius) * percent
        let angle =
            step * (typeof this.stepAngle === 'number' ? this.stepAngle : goldenAngleRadians)

        let x = Math.cos(angle) * radius
        let y = Math.sin(angle) * radius

        return { x, y }
    }

    getPartialStep(step: number, percent: number) {
        let prev = this.getStep(step - 1)
        let next = this.getStep(step)
        let x = prev.x + (next.x - prev.x) * percent
        let y = prev.y + (next.y - prev.y) * percent
        return { x, y }
    }

    updatePxPerSecond(delta: number) {
        this.currentPixels += this.pixelsPerSecond * (delta / 1000)

        let prevX = 0
        let prevY = 0
        let totalPixelsDrawn = 0

        let points: { x: number; y: number }[] = []
        let step = 0
        while (totalPixelsDrawn < this.currentPixels && step < this.count) {
            let { x, y } = this.getStep(step)
            let distance = Math.sqrt((x - prevX) ** 2 + (y - prevY) ** 2)
            if (distance + totalPixelsDrawn >= this.currentPixels) {
                let percent = (this.currentPixels - totalPixelsDrawn) / distance
                points.push(this.getPartialStep(step, percent))
                totalPixelsDrawn = this.currentPixels
            } else {
                totalPixelsDrawn += distance
                points.push({ x, y })
            }

            prevX = x
            prevY = y
            step++
        }

        if (this.drawDots) {
            this.dots(points)
        } else {
            ctx.beginPath()
            points.forEach(({ x, y }, i) => {
                if (i === 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
            })
            ctx.stroke()
        }

        if (step === this.count) {
            this.currentPixels = 0
        }
    }

    dots = (dots: { x: number; y: number }[]) => {
        ctx.fillStyle = '#fff'
        dots.forEach(({ x, y }, i) => {
            ctx.beginPath()
            let size = this.minSize + (this.maxSize - this.minSize) * (i / this.count)
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.fill()
        })
    }

    updateSteps(delta: number) {
        let points: { x: number; y: number }[] = []
        this.currentStepProgress += this.stepsPerSecond * (delta / 1000)

        if (this.currentStepProgress >= 1) {
            this.currentStepProgress = 0
            this.currentStep++
            if (this.currentStep >= this.count) {
                this.currentStep = 0
            }
        }

        let step = 0

        while (step < this.currentStep && step < this.count) {
            let { x, y } = this.getStep(step)
            points.push({ x, y })
            step++
        }

        points.push(this.getPartialStep(this.currentStep, this.currentStepProgress))

        if (this.drawDots) {
            this.dots(points)
        } else {
            ctx.beginPath()
            points.forEach(({ x, y }, i) => {
                if (i === 0) {
                    ctx.moveTo(x, y)
                } else {
                    ctx.lineTo(x, y)
                }
            })
            ctx.stroke()
        }
    }

    drawStatic() {
        let step = 0
        if (this.drawDots) {
            ctx.fillStyle = '#fff'
            while (step < this.count) {
                let { x, y } = this.getStep(step)
                let size = this.minSize + (this.maxSize - this.minSize) * (step / this.count)
                ctx.beginPath()
                ctx.arc(x, y, size, 0, Math.PI * 2)
                ctx.fill()
                step++
            }
        } else {
            ctx.beginPath()
            while (step < this.count) {
                let { x, y } = this.getStep(step)
                ctx.lineTo(x, y)
                step++
            }
            ctx.stroke()
        }
    }

    update(delta: number) {
        if (this.timingMode === 'pixelsPerSecond') {
            this.updatePxPerSecond(delta)
        } else if (this.timingMode === 'stepsPerSecond') {
            this.updateSteps(delta)
        } else {
            this.drawStatic()
        }
    }
}

let flower = new SunflowerDraw()

const sunflowerGui = (flower: SunflowerDraw, gui: GUI) => {
    function onChangeTimingMode(val: string) {
        if (val === 'stepsPerSecond') {
            guiSteps.show()
            guiPx.hide()
        } else if (val === 'pixelsPerSecond') {
            guiSteps.hide()
            guiPx.show()
        } else {
            guiSteps.hide()
            guiPx.hide()
        }
    }

    function onChangeDots(drawDots: boolean) {
        if (drawDots) {
            guiMinSize.show()
            guiMaxSize.show()
        } else {
            guiMinSize.hide()
            guiMaxSize.hide()
        }
    }

    gui.add(flower, 'count', 1, 800, 1)
    gui.add(flower, 'maxRadius', 10, 1000, 1)
    gui.add(flower, 'minRadius', 0, 500, 1)
    let guiMinSize = gui.add(flower, 'minSize', 0, 20, 1)
    let guiMaxSize = gui.add(flower, 'maxSize', 1, 30, 1)
    gui.add(flower, 'drawDots').onChange(onChangeDots)
    let guiSteps = gui.add(flower, 'stepsPerSecond', 1, 100, 1)
    let guiPx = gui.add(flower, 'pixelsPerSecond', 1, 2000, 1)

    gui.add(flower, 'timingMode', ['pixelsPerSecond', 'stepsPerSecond', 'static']).onChange(
        onChangeTimingMode
    )
    onChangeTimingMode(flower.timingMode)
    onChangeDots(flower.drawDots)

    let debg = {
        usePhi: true,
        stepAngleDegrees: 360 / 7,
    }

    let guiPhi = gui.add(debg, 'usePhi')
    let guiAngle = gui
        .add(debg, 'stepAngleDegrees', 0, 360, 0.1)
        .hide()
        .onChange((angle: number) => {
            flower.stepAngle = (angle * Math.PI) / 180
        })

    guiPhi.onChange((usePhi: boolean) => {
        if (usePhi) {
            guiAngle.hide()
            flower.stepAngle = undefined
        } else {
            guiAngle.show()
            flower.stepAngle = (debg.stepAngleDegrees * Math.PI) / 180
        }
    })
}

sunflowerGui(flower, new GUI())

let lastTime = 0

loop((t: number) => {
    let delta = t - lastTime
    lastTime = t
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.strokeStyle = '#fff'

    ctx.fillStyle = '#fff'
    flower.update(delta)

    ctx.restore()
})
