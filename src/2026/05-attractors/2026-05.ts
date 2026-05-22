import '~/style.css'
import createCanvas from '~/helpers/create-canvas'
import loop from '~/helpers/loop'
import { clamp, random } from '~/helpers/utils'

const width = 800
const height = 600
const { ctx } = createCanvas(width, height)

type Point = { x: number; y: number }
type Attractor = Point & { strength: number } // positive = attract, negative = repel

function getForce(x: number, y: number, attractors: Attractor[]) {
    let fx = 0
    let fy = 0
    let minDist = 100

    for (const a of attractors) {
        let dx = a.x - x
        let dy = a.y - y
        // let distSq = clamp(dx * dx + dy * dy, 1, 2000)
        let distSq = dx * dx + dy * dy
        let dist = Math.sqrt(distSq)
        console.log(distSq)

        // Force magnitude falls off with distance squared (like gravity)
        let force = a.strength / distSq

        fx += (dx / dist) * force
        fy += (dy / dist) * force
    }

    let angle = Math.atan2(fy, fx)

    return [Math.cos(angle), Math.sin(angle)]
}

function getAngleOrbiting(x: number, y: number, attractors: Attractor[]) {
    let fx = 0
    let fy = 0

    for (const a of attractors) {
        let dx = a.x - x
        let dy = a.y - y
        let distSq = dx * dx + dy * dy
        let dist = Math.sqrt(distSq)
        if (dist < 0.001) continue
        let force = a.strength / distSq
        fx += (dx / dist) * force
        fy += (dy / dist) * force
    }

    // Rotate 90°: (fx, fy) → (-fy, fx)
    let rotateAngle = Math.atan2(fx, -fy)
    let mag = Math.sqrt(fx * fx + fy * fy)
    fx = Math.cos(rotateAngle) * mag
    fy = Math.sin(rotateAngle) * mag
    return [fx, fy]
}

// One central sink — curves spiral inward
const centralSink: Attractor[] = [{ x: width / 2, y: height / 2, strength: 50000 }]

// Source + sink pair — curves arc from one side to the other (like a magnet's field lines)
const dipole: Attractor[] = [
    { x: width * 0.3, y: height / 2, strength: 60000 }, // source (repels if negative)
    { x: width * 0.7, y: height / 2, strength: -60000 }, // sink
    // { x: width * 0.4, y: height * 0.25, strength: 20000 },
]

// Three orbiting attractors — triangular symmetry
const triOrbit: Attractor[] = [
    { x: width / 2, y: height * 0.2, strength: 40000 },
    { x: width * 0.2, y: height * 0.8, strength: 50000 },
    { x: width * 0.45, y: height * 0.4, strength: 40000 },
    { x: width * 0.8, y: height * 0.92, strength: 60000 },
]

// Mix of orbital and convergent by blending both angles
function getAngleMixed(x: number, y: number, attractors: Attractor[]) {
    let fx = 0
    let fy = 0
    let orbitRatio = 0.8

    for (const a of attractors) {
        let dx = a.x - x
        let dy = a.y - y
        let distSq = dx * dx + dy * dy
        let dist = Math.sqrt(distSq)
        if (distSq < 0.001) continue
        let force = a.strength / (distSq + 100000)
        // if (dist < 100) force *= -1
        fx += (dx / dist) * force
        fy += (dy / dist) * force
    }

    // Blend straight-toward with 90°-rotated
    let towardAngle = Math.atan2(fy, fx)
    let orbitAngle = Math.atan2(fx, -fy)

    // Circular interpolation via component blend
    let bx = Math.cos(towardAngle) * (1 - orbitRatio) + Math.cos(orbitAngle) * orbitRatio
    let by = Math.sin(towardAngle) * (1 - orbitRatio) + Math.sin(orbitAngle) * orbitRatio
    return [bx, by]
}

let particles: { x: number; y: number }[] = []
for (let i = 0; i < 1; i++) {
    particles.push({ x: random(width), y: random(height) })
}

function draw(t: number) {
    ctx.strokeStyle = '#fafafa'
    particles.forEach((p) => {
        let [fx, fy] = getAngleMixed(p.x, p.y, triOrbit)
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        p.x += fx * 5
        p.y += fy * 5
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
    })
}

loop(draw)
