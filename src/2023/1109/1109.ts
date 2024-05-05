import '../../style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import { createNoise2D, createNoise3D } from 'simplex-noise'
import { map, lerp, random } from '~/helpers/utils'
import loop from '~/helpers/loop'

const PARAMS = {
    scale: 10,
}

let red = '#f24333' // 4
let orange = '#ff8019' // 3
let yellow = '#f6b02c' // 2
let blue = '#2ec2ea' // 0
let green = '#3bed73' // 1
let pink = '#fc6c9c' // 5

let width = Math.min(window.innerWidth, 500)
let height = Math.min(window.innerHeight, 500)

let { ctx, resizeCanvas } = createCanvas(width, height)

type Particle = { x: number; y: number; vel: number }
const noise3D = createNoise3D()
const noise2D = createNoise2D()

class FlowField {
    cols: number
    rows: number
    a: number
    b: number
    field: number[] = []

    constructor(cols: number, rows: number) {
        this.cols = cols
        this.rows = rows
        // this.a = random(1.5, 10)
        this.a = 10
        // this.b = random(1.5, 10)
        this.b = 6.5
    }

    update() {
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                let index = x + y * this.cols
                let xval = x / this.cols
                let yval = y / this.rows
                let vel =
                    Math.sin(xval * this.a) - Math.cos(xval * this.b) * Math.cos(yval * this.a)
                vel *= Math.PI

                this.field[index] = vel
            }
        }
    }

    drawField() {
        ctx.save()
        ctx.globalAlpha = 0.1
        for (let x = 0; x < this.cols; x++) {
            for (let y = 0; y < this.rows; y++) {
                let index = x + y * this.cols

                ctx.save()
                ctx.translate(x * PARAMS.scale, y * PARAMS.scale)
                ctx.rotate(this.field[index])
                ctx.strokeStyle = '#fff'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(0, 0)
                ctx.lineTo(10, 0)
                ctx.stroke()

                ctx.arc(0, 0, 3, 0, Math.PI * 2)
                ctx.fillStyle = '#f0f'
                ctx.fill()
                ctx.restore()
            }
        }
        ctx.restore()
    }

    clear() {
        this.field.fill(0)
    }
}

let particles: Particle[] = []
let flowField: FlowField
let particlesCount = 50

function setup() {
    flowField = new FlowField(width / PARAMS.scale, height / PARAMS.scale)
    flowField.update()

    for (let i = 0; i < particlesCount; i++) {
        let x = random(width)
        let y = random(height)
        // let vel = flowField.field[x + y * flowField.cols]

        particles.push({
            x,
            y,
            vel: 0,
        })
    }

    flowField.drawField()
}

function draw(t: number) {
    ctx.clearRect(0, 0, width, height)
    flowField.drawField()

    for (let i = 0; i < particles.length; i++) {
        let particle = particles[i]
        let x = Math.floor(particle.x / PARAMS.scale)
        let y = Math.floor(particle.y / PARAMS.scale)

        let vel = flowField.field[x + y * flowField.cols]
        particle.vel = lerp(particle.vel, vel, 0.1)

        particle.x += Math.cos(particle.vel) * 4
        particle.y += Math.sin(particle.vel) * 4

        // particle.vel *= 0.9

        if (particle.x < 0 || particle.x > width || particle.y < 0 || particle.y > height) {
            particle.x = Math.floor(Math.random() * width)
            particle.y = Math.floor(Math.random() * height)
            particle.vel = 0
        }

        ctx.fillStyle = '#fff'
        ctx.fillRect(particle.x, particle.y, 1, 1)
    }
}

window.addEventListener('resize', () => {
    width = Math.min(window.innerWidth, 500)
    height = Math.min(window.innerHeight, 500)
    resizeCanvas(width, height)
})

setup()

loop(draw)
