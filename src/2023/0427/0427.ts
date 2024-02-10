import '../../style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import { random } from '../../helpers/utils'
import { mouseTracker } from '../../helpers/mouse'
import loop from '../../helpers/loop'
import { debugBubbles } from './debug'

// inspiration:
// https://openprocessing.org/sketch/1910232 // swarm nodes
// https://openprocessing.org/sketch/1906399 // jelly sim
// https://openprocessing.org/sketch/492096 // wobbly swarm

const DEBUG = false
const W = window.innerWidth
const H = window.innerHeight

let pcles: Particle[] = []

const PARAMS = {
    mmin: 1.5,
    mmax: 4,
    mouseRadius: 125,
    bubbleRadius: 190,
    bubblesMult: 0.15,
    mouseMass: 130,
    mouseDiffMult: 1.2,
    mouseMult: 1,
    viscosity: 0.999,
    finalMult: 0.0005,
}

let drawParams
let { ctx, canvas } = createCanvas(W, H)
if (DEBUG) {
    drawParams = debugBubbles(PARAMS, ctx)
}

class Vector {
    x: number
    y: number

    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

type ParticleOpts = {
    x?: number
    y?: number
    mass?: number
    next?: Particle
    prev?: Particle
}

class Particle extends Vector {
    next: Particle | null = null
    prev: Particle | null = null
    mass: number
    vel: Vector = new Vector(0, 0)
    accel: Vector = new Vector(0, 0)

    constructor({ x = 0, y = 0, mass, prev, next }: ParticleOpts) {
        super(x, y)
        if (prev) this.prev = prev
        if (next) this.next = next
        this.mass = mass || 1
    }

    remove() {
        if (this.prev) this.prev.next = this.next
        if (this.next) this.next.prev = this.prev
    }

    draw() {
        ctx.beginPath()
        circle(this.x, this.y, this.mass * 7.5)
        ctx.fill()
    }
}

function circle(x, y, r) {
    ctx.arc(x, y, r, 0, Math.PI * 2)
}

let mouse = mouseTracker(canvas, {
    overout: true,
    move: true,
    drag: addParticle,
})

function accelTo(particle: Particle, x, y) {
    if (!x || !y) return [0, 0]
    let distX = x - particle.x
    let distY = y - particle.y
    let distance = Math.max(Math.sqrt(distX * distX + distY * distY), PARAMS.mouseRadius * 0.5)

    let heading = Math.atan2(distY, distX)
    let headingV = Math.atan2(particle.vel.y, particle.vel.x)
    let sub = heading - headingV
    let difference = Math.max(Math.abs(sub), 1)
    if (difference > Math.PI) difference = Math.PI * 2 - difference
    difference /= Math.PI

    let force =
        ((distance - PARAMS.mouseRadius) * PARAMS.mouseMass * particle.mass) / (distance * distance)

    force += force * PARAMS.mouseDiffMult * difference
    ctx.fillStyle = `rgba(50, ${255 * difference}, ${100 + 155 * (1 - difference)}, 0.8)`
    force *= PARAMS.mouseMult

    return [force * distX, force * distY]
}

const createParticle = (x, y) => new Particle({ x, y, mass: random(PARAMS.mmin, PARAMS.mmax) })

for (let i = 0; i < 10; i++) {
    pcles.push(createParticle(random(W), random(H)))
}

function draw() {
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(0, 255, 191, 0.824)'

    if (!mouse.over) {
        mouse.x = W / 2
        mouse.y = H / 2
    }

    for (let i = 0; i < pcles.length; i++) {
        // let ax = 0,
        //     ay = 0

        for (let j = i + 1; j < pcles.length; j++) {
            if (i === j) continue

            let distX = pcles[j].x - pcles[i].x
            let distY = pcles[j].y - pcles[i].y
            let dist = Math.max(Math.sqrt(distX * distX + distY * distY), 1)

            let force = (dist - PARAMS.bubbleRadius) * pcles[j].mass * pcles[i].mass
            force /= dist * (dist * 1.5)
            force *= PARAMS.bubblesMult
            pcles[i].accel.x += force * distX
            pcles[i].accel.y += force * distY
            pcles[j].accel.x -= force * distX
            pcles[j].accel.y -= force * distY
        }

        let [mouseAX, mouseAY] = accelTo(pcles[i], mouse.x, mouse.y)
        pcles[i].accel.x += mouseAX
        pcles[i].accel.y += mouseAY

        pcles[i].vel.x = pcles[i].vel.x * PARAMS.viscosity + pcles[i].accel.x * PARAMS.finalMult
        pcles[i].vel.y = pcles[i].vel.y * PARAMS.viscosity + pcles[i].accel.y * PARAMS.finalMult

        pcles[i].x += pcles[i].vel.x
        pcles[i].y += pcles[i].vel.y
        pcles[i].accel.x = 0
        pcles[i].accel.y = 0
        pcles[i].draw()
    }

    if (DEBUG) {
        drawMouse()
        drawParams()
    }
}

function drawMouse() {
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.beginPath()
    circle(mouse.x, mouse.y, PARAMS.mouseRadius)
    ctx.stroke()
    ctx.restore()
}

canvas.addEventListener('click', addParticle)

function addParticle() {
    pcles.push(createParticle(mouse.x, mouse.y))
    if (pcles.length > 100) pcles.shift()
}

loop(draw)
