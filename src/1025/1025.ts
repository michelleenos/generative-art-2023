import '../style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import loop from '~/helpers/loop'
import { random } from '~/helpers/utils'
import { hexToHsb, hsbToHex, type ColorHSB } from '~/helpers/color-utils'

let red = '#f24333' // 4
let orange = '#ff8019' // 3
let yellow = '#f6b02c' // 2
let blue = '#2ec2ea' // 0
let green = '#3bed73' // 1
let pink = '#fc6c9c' // 5

let width = window.innerWidth
let height = window.innerHeight

let { ctx, resizeCanvas } = createCanvas(width, height)

let offscreenCanvas = document.createElement('canvas')
generateNoise(offscreenCanvas)

function generateNoise(offscreenCanvas: HTMLCanvasElement) {
    const iData = ctx.createImageData(width, height)
    const buffer32 = new Uint32Array(iData.data.buffer)
    const len = buffer32.length
    offscreenCanvas.width = width
    offscreenCanvas.height = height
    let offscreenCtx = offscreenCanvas.getContext('2d')!

    let subArrayLength = Math.ceil(len / 8)

    for (let i = 0; i < subArrayLength; i++) {
        if (Math.random() < 0.5) {
            buffer32[i] = 0x09ffffff
        }
    }

    buffer32.set(buffer32.subarray(0, subArrayLength), subArrayLength)
    buffer32.set(buffer32.subarray(0, subArrayLength * 2), subArrayLength * 2)
    buffer32.set(buffer32.subarray(0, subArrayLength * 4), len - subArrayLength * 4)

    offscreenCtx.putImageData(iData, 0, 0)
}

function draw(time: number = 0) {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#121212'
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.translate(width / 2, height / 2)
    let m = Math.min(width, height) * 0.9

    let cells = 6
    let cellSize = m / cells
    ctx.translate((cellSize - m) * 0.5, (cellSize - m) * 0.5)

    let i = 0

    for (let cx = 0; cx < cells; cx++) {
        for (let cy = 0; cy < cells; cy++) {
            ctx.save()
            ctx.translate(cx * cellSize, cy * cellSize)
            let steps = random([3, 4, 4, 5, 5, 6])

            {
                ctx.save()
                ctx.globalCompositeOperation = random(['lighter', 'screen'])
                let color = random([blue, pink, yellow, orange])
                let double = random() < 0.5
                burstFlower(cellSize, color, random([4, 5]), double ? steps * 2 : steps)

                if (random() < 0.5) {
                    burstFlower(cellSize, color, random([4, 5]), steps)
                    let dotRadius = cellSize * random(0.02, 0.03)
                    let dotPos = cellSize * random(0.3, 0.4)
                    dots(cellSize, color, steps, dotRadius, dotPos, random() < 0.5)
                }

                ctx.restore()
            }

            {
                ctx.save()
                ctx.globalCompositeOperation = random(['lighten', 'screen'])
                ctx.globalAlpha = +random(0.65, 0.9).toFixed(2)
                let color = random([orange, blue, red, yellow])
                burstFlames(cellSize * random(1, 1.3), steps, color)
                if (random() < 0.5) {
                    ctx.rotate(Math.PI / steps)
                    burstFlames(cellSize * random(1, 1.3), steps, color)
                }
                ctx.globalCompositeOperation = random(['lighten', 'screen'])
                ctx.globalAlpha -= 0.2
                ctx.beginPath()
                if (random() < 0.5) {
                    ctx.arc(0, 0, cellSize * random(0.15, 0.3), 0, Math.PI * 2)
                    ctx.fillStyle = random([pink, yellow])
                    ctx.fill()
                } else {
                    ctx.arc(0, 0, cellSize * random(0.2, 0.4), 0, Math.PI * 2)
                    ctx.lineWidth = cellSize * random(0.03, 0.1)
                    ctx.strokeStyle = random([green, blue, pink, yellow])
                    ctx.stroke()
                }
                ctx.restore()
            }

            ctx.restore()

            i++
        }
    }

    ctx.restore()

    ctx.drawImage(offscreenCanvas, 0, 0, width, height)
}

function burstFlames(size: number, steps = 6, color = orange) {
    let baseColor = hexToHsb(color)
    let lengthMult = random(2, 3)

    for (let j = 0; j < 3; j++) {
        let nodeR = size * (0.005 + 0.014 * j * j)
        let distMult = nodeR * 0.4

        for (let i = 0; i < 3; i++) {
            // yellow: 39, 82, 96
            let col = { ...baseColor }
            col.h = col.h - i * i * 9
            col.s = col.h < 20 ? col.s - i : col.s + i * 5
            ctx.fillStyle = hsbToHex(col)

            let distFromCenter = nodeR + distMult * i
            burst({
                nodeR,
                length: nodeR * lengthMult,
                distFromCenter,
                steps,
                style: 'fill',
            })
        }
    }
}

function burstFlower(size: number, color: string = green, count = 5, steps = 12) {
    let colHsb = hexToHsb(color)
    ctx.lineWidth = size * 0.01
    let distFromCenter = size * 0.15

    for (let i = 0; i < count; i++) {
        let stroke: ColorHSB = { ...colHsb }
        let fill: ColorHSB = { ...colHsb }
        stroke.b -= 10

        if (colHsb.h < 100) {
            // yellow = 39, 82, 96
            stroke.h -= i * 20
            fill.h -= i * 15
        } else if (colHsb.h < 150) {
            // green 139, 75, 93
            fill.h -= i * 20
            fill.s -= i * 4
            fill.b = Math.min(fill.b + i * 5, 100)
        } else if (colHsb.h < 200) {
            // blue 193, 80, 92
            fill.h += i * 8
            fill.s += i
        } else {
            // pink 340, 57, 99
            stroke.h -= 20 + i * 10
            fill.h -= i * 20
            fill.s += i * 2
        }

        ctx.fillStyle = hsbToHex(fill)
        ctx.strokeStyle = hsbToHex(stroke)
        let nodeR = size * (0.04 + 0.04 * (i / count))
        distFromCenter += nodeR * 0.8
        burst({
            nodeR,
            length: nodeR,
            distFromCenter,
            steps,
            style: 'fill',
        })
        burst({
            nodeR: nodeR * 0.7,
            length: nodeR * 0.7,
            distFromCenter,
            steps,
            style: 'strokeTop',
        })
    }
}

function dots(
    size: number,
    color: string,
    steps: number,
    dotRadius = size * 0.02,
    dotPos = size * 0.35,
    fill = true
) {
    for (let i = 0; i < steps; i++) {
        let angle = (i / steps) * Math.PI * 2 + Math.PI / steps
        ctx.save()
        ctx.rotate(angle)
        ctx.beginPath()
        ctx.arc(0, dotPos, dotRadius, 0, Math.PI * 2)
        if (fill) {
            ctx.fillStyle = color
            ctx.fill()
        } else {
            ctx.strokeStyle = color
            ctx.stroke()
        }
        ctx.restore()
    }
}

type BurstParams = {
    nodeR: number
    length: number
    distFromCenter: number
    steps?: number
    style?: 'strokeAll' | 'strokeTop' | 'fill'
}

const burstDefaults = {
    steps: 20,
    style: 'fill',
}

function burst(params: BurstParams) {
    let { nodeR, length, distFromCenter, steps, style } = { ...burstDefaults, ...params }

    let rOuter = distFromCenter + length - nodeR

    for (let i = 0; i < steps; i++) {
        let angle = (i / steps) * Math.PI * 2

        ctx.save()
        ctx.rotate(angle)

        if (style === 'fill') {
            ctx.beginPath()
            ctx.moveTo(-nodeR, distFromCenter)
            ctx.lineTo(nodeR, distFromCenter)
            ctx.lineTo(nodeR, rOuter)
            ctx.arc(0, rOuter, nodeR, 0, Math.PI)
            ctx.closePath()
            ctx.fill()
        } else {
            ctx.beginPath()
            ctx.moveTo(nodeR, distFromCenter)
            ctx.lineTo(nodeR, rOuter)
            ctx.arc(0, rOuter, nodeR, 0, Math.PI)
            ctx.lineTo(-nodeR, distFromCenter)
            if (style === 'strokeAll') ctx.closePath()
            ctx.stroke()
        }

        ctx.restore()
    }
}

window.addEventListener('resize', () => {
    width = window.innerWidth
    height = window.innerHeight
    resizeCanvas(width, height)
    draw()
})

draw()
