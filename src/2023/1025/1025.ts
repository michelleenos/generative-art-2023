import '../../style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import { Pane } from 'tweakpane'
import { random } from '~/helpers/utils'
import { hexToHsb, hsbToHex, type ColorHSB } from '~/helpers/color-utils'
import { generateNoise } from '~/helpers/canvas-noise'

let red = '#f24333' // 4
let orange = '#ff8019' // 3
let yellow = '#f6b02c' // 2
let blue = '#2ec2ea' // 0
let green = '#3bed73' // 1
let pink = '#fc6c9c' // 5

const params = {
    countX: 3,
    countY: 4,
    dotRadiusMin: 0.02,
    dotRadiusMax: 0.03,
    dotPosMin: 0.3,
    dotPosMax: 0.4,
    flameSizeMin: 1,
    flameSizeMax: 1.3,
    circRadMin: 0.15,
    circRadMax: 0.3,
    circStrokeMin: 0.03,
    circStrokeMax: 0.1,
    florCenterMin: 0.1,
    florCenterMax: 0.2,
}

let width = window.innerWidth
let height = window.innerHeight
let { ctx, resizeCanvas, canvas } = createCanvas(width, height)
let offscreenCanvas = generateNoise(width, height)

function draw(_time: number = 0) {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#121212'
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.translate(width / 2, height / 2)
    let m = Math.min(width, height) * 0.9

    let cellSizeX = m / params.countX
    let cellSizeY = m / params.countY
    let cellSize = Math.min(cellSizeX, cellSizeY)
    ctx.translate((cellSizeX - m) * 0.5, (cellSizeY - m) * 0.5)

    let i = 0

    for (let cx = 0; cx < params.countX; cx++) {
        for (let cy = 0; cy < params.countY; cy++) {
            ctx.save()
            ctx.translate(cx * cellSizeX, cy * cellSizeY)
            let steps = random([3, 4, 4, 5, 5, 6])

            {
                ctx.save()
                ctx.globalCompositeOperation = random(['lighter', 'screen'])
                let color = random([blue, pink, yellow, orange])
                let double = random() < 0.5
                burstFlor({
                    size: cellSize,
                    color: color,
                    count: random([4, 5]),
                    steps: double ? steps * 2 : steps,
                    fromCenter: cellSize * random(params.florCenterMin, params.florCenterMax),
                })

                if (random() < 0.5) {
                    let dotRadius = cellSize * random(params.dotRadiusMin, params.dotRadiusMax)
                    let dotPos = cellSize * random(params.dotPosMin, params.dotPosMax)
                    dots(cellSize, color, steps, dotRadius, dotPos, random() < 0.5)
                }

                ctx.restore()
            }

            {
                ctx.save()
                ctx.globalCompositeOperation = random(['lighten', 'screen'])
                ctx.globalAlpha = +random(0.65, 0.9).toFixed(2)
                let color = random([orange, blue, red, yellow])
                burstFlames(
                    cellSize * random(params.flameSizeMax, params.flameSizeMax),
                    steps,
                    color
                )

                ctx.globalAlpha -= 0.2
                if (random() < 0.5) {
                    ctx.rotate(Math.PI / steps)
                    burstFlames(
                        cellSize * random(params.flameSizeMin, params.flameSizeMax),
                        steps,
                        color
                    )
                }
                ctx.globalCompositeOperation = random(['lighten', 'screen'])
                ctx.beginPath()
                let circRadius = cellSize * random(params.circRadMin, params.circRadMax)
                if (random() < 0.5) {
                    ctx.arc(0, 0, circRadius, 0, Math.PI * 2)
                    ctx.fillStyle = random([pink, yellow])
                    ctx.fill()
                } else {
                    ctx.globalAlpha += 0.2
                    ctx.arc(0, 0, circRadius, 0, Math.PI * 2)
                    ctx.lineWidth = cellSize * random(params.circStrokeMin, params.circStrokeMax)
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

type BurstFlorParams = {
    size: number
    color?: string
    count?: number
    steps?: number
    centerMin?: number
    centerMax?: number
    fromCenter?: number
}

function burstFlor({
    size,
    color = green,
    count = 5,
    steps = 12,
    fromCenter = size * 0.15,
}: BurstFlorParams) {
    let colHsb = hexToHsb(color)
    ctx.lineWidth = size * 0.01
    let distFromCenter = fromCenter

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

function setupPane() {
    const pane = new Pane()
    let folder = pane.addFolder({ title: 'controls' })
    folder.addInput(params, 'countX', { min: 1, max: 10, step: 1 })
    folder.addInput(params, 'countY', { min: 1, max: 10, step: 1 })
    folder.addInput(params, 'dotRadiusMin', { min: 0, max: 0.1 })
    folder.addInput(params, 'dotRadiusMax', { min: 0, max: 0.1 })
    folder.addInput(params, 'dotPosMin', { min: 0, max: 1 })
    folder.addInput(params, 'dotPosMax', { min: 0, max: 1 })
    folder.addInput(params, 'flameSizeMin', { min: 0, max: 2 })
    folder.addInput(params, 'flameSizeMax', { min: 0, max: 2 })
    folder.addInput(params, 'circRadMin', { min: 0, max: 0.5 })
    folder.addInput(params, 'circRadMax', { min: 0, max: 0.5 })
    folder.addInput(params, 'circStrokeMin', { min: 0, max: 0.5 })
    folder.addInput(params, 'circStrokeMax', { min: 0, max: 0.5 })
    folder.addInput(params, 'florCenterMin', { min: 0, max: 0.5 })
    folder.addInput(params, 'florCenterMax', { min: 0, max: 0.5 })

    pane.on('change', () => {
        draw()
    })
}

window.addEventListener('resize', () => {
    width = window.innerWidth
    height = window.innerHeight
    offscreenCanvas = generateNoise(width, height)
    resizeCanvas(width, height)
    draw()
})

canvas.addEventListener('click', () => draw())

setupPane()
draw()
