import '~/style.css'
import createCanvas from '~/helpers/create-canvas'
import loop from '~/helpers/loop'

const PHI = (1 + Math.sqrt(5)) / 2

const width = window.innerWidth
const height = window.innerHeight
const { ctx } = createCanvas(width, height)

// const PARAMS = {
//     count: 200,
//     maxRadius: 300,
//     minRadius: 100,
//     maxSize: 10,
//     minSize: 2,
// }

class SunflowerDraw {
    count: number = 100
    maxRadius: number = 300
    minRadius: number = 100
    pixelsPerSecond = 1000
    currentPixels = 0
    currentStep = 0
    currentStepProgress = 0
    timingMode: 'pixelsPerSecond' | 'stepsPerSecond' = 'pixelsPerSecond'
    stepsPerSecond = 8

    constructor() {}

    updatePxPerSecond(delta: number) {
        this.currentPixels += this.pixelsPerSecond * (delta / 1000)

        let diffR = this.maxRadius - this.minRadius
        let angle = 0
        let prevX = Math.cos(angle) * this.minRadius
        let prevY = Math.sin(angle) * this.minRadius
        let totalPixelsDrawn = 0

        ctx.beginPath()
        let step = 0
        while (totalPixelsDrawn < this.currentPixels && step < this.count) {
            let percent = step / this.count
            let radius = this.minRadius + diffR * percent
            angle += Math.PI * 2 * PHI

            let x = Math.cos(angle) * radius
            let y = Math.sin(angle) * radius

            let distance = Math.sqrt((x - prevX) ** 2 + (y - prevY) ** 2)

            if (distance + totalPixelsDrawn > this.currentPixels) {
                let percent = (this.currentPixels - totalPixelsDrawn) / distance
                x = prevX + (x - prevX) * percent
                y = prevY + (y - prevY) * percent
                totalPixelsDrawn = this.currentPixels
            } else {
                totalPixelsDrawn += distance
            }

            prevX = x
            prevY = y

            ctx.lineTo(x, y)
            step++
        }

        ctx.stroke()
    }

    updateSteps(delta: number) {
        this.currentStepProgress += this.stepsPerSecond * (delta / 1000)
        if (this.currentStepProgress >= 1) {
            this.currentStepProgress = 0
            this.currentStep++
            if (this.currentStep >= this.count) {
                this.currentStep = 0
            }
        }

        let diffR = this.maxRadius - this.minRadius
        let angle = 0
        let prevX = Math.cos(angle) * this.minRadius
        let prevY = Math.sin(angle) * this.minRadius
        let step = 0

        ctx.beginPath()
        while (step < this.currentStep && step < this.count) {
            let percent = step / this.count
            let radius = this.minRadius + diffR * percent
            angle += Math.PI * 2 * PHI

            let x = Math.cos(angle) * radius
            let y = Math.sin(angle) * radius

            ctx.lineTo(x, y)
            prevX = x
            prevY = y
            step++
        }

        let lastPercent = this.currentStepProgress
        let lastRadius = this.minRadius + diffR * (this.currentStep / this.count)
        angle += Math.PI * 2 * PHI

        let endX = Math.cos(angle) * lastRadius
        let endY = Math.sin(angle) * lastRadius
        let x = prevX + (endX - prevX) * lastPercent
        let y = prevY + (endY - prevY) * lastPercent

        // let x = Math.cos(angle) * radius
        // let y = Math.sin(angle) * lastRadius

        ctx.lineTo(x, y)
        ctx.stroke()
    }

    drawStatic() {
        ctx.beginPath()
        let step = 1
        let angle = 0

        angle += Math.PI * 2 * PHI

        let points: number[][] = []
        while (step < this.count) {
            let percent = step / this.count
            let radius = this.minRadius + (this.maxRadius - this.minRadius) * percent
            angle += Math.PI * 2 * PHI

            let x = Math.cos(angle) * radius
            let y = Math.sin(angle) * radius
            points.push([x, y])
            step++
        }

        points.forEach((p, i) => {
            drawPoint(p, i === 0 ? 'red' : 'teal', i.toString())
        })

        ctx.beginPath()
        for (let i = 1; i < points.length; i += 2) {
            let prev = points[i - 1]
            let point = points[i]
            ctx.quadraticCurveTo(prev[0], prev[1], point[0], point[1])
        }

        ctx.stroke()
    }

    update(delta: number) {
        if (this.timingMode === 'pixelsPerSecond') {
            this.updatePxPerSecond(delta)
        } else {
            this.updateSteps(delta)
        }
    }
}

let flower = new SunflowerDraw()
flower.timingMode = 'stepsPerSecond'

const drawPoint = (p: number[], color = '#fff', text?: string) => {
    ctx.save()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(p[0], p[1], 5, 0, Math.PI * 2)
    if (text) {
        ctx.fillText(text, p[0] + 10, p[1] + 10)
    }
    ctx.fill()
    ctx.restore()
}

let lastTime = 0
const draw = (t: number) => {
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.translate(width / 2, height / 2)

    ctx.strokeStyle = '#fff'
    ctx.fillStyle = '#fff'

    let delta = t - lastTime
    flower.update(delta)
    lastTime = t

    // ctx.beginPath()
    // ctx.moveTo(p1[0], p1[1])
    // ctx.quadraticCurveTo(cp1[0], cp1[1], p2[0], p2[1])
    // ctx.stroke()

    ctx.restore()
    ctx.fillStyle = '#fff'
    ctx.fillText(flower.currentPixels.toFixed(2), 20, 20)
    ctx.fillText(t.toFixed(2), 20, 40)
}

loop(draw)
