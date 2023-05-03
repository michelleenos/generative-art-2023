import p5 from 'p5'
import { constrain } from '../utils'

// export interface Particle extends p5.Vector {
//     radius: number
//     acceleration: p5.Vector
//     velocity: p5.Vector
//     mass: number
//     applyForce(force: p5.Vector): void
//     update(): void
//     distFromEdge(): {
//         left: number
//         right: number
//         top: number
//         bottom: number
//     }
//     checkEdges(): void
//     draw(): void
//     attract(particle: Particle): p5.Vector
//     constraint: { min: number; max: number }
// }

export type ParticleOpts = {
    radius?: number
    mass?: number
    velInit?: p5.Vector
}

export type ForceOpts = {
    G?: number
    min?: number
    max?: number
}
export class Particle extends p5.Vector {
    radius: number
    acceleration: p5.Vector = new p5.Vector()
    velocity: p5.Vector
    mass: number
    min: number = 5
    max: number = 25

    constructor(x, y, opts: ParticleOpts = {}) {
        super(x, y)
        this.radius = opts.radius ?? 5
        this.mass = opts.mass ?? 1
        this.velocity = opts.velInit ?? new p5.Vector(0, 0)
    }

    applyForce(force: p5.Vector) {
        let f = force.copy().div(this.mass)
        this.acceleration.add(f)
    }

    update() {
        this.velocity.add(this.acceleration)
        this.acceleration.mult(0)
        this.add(this.velocity)
    }

    distFromEdge(p: p5) {
        let dist = {
            left: this.x - this.radius,
            right: p.width - this.x - this.radius,
            top: this.y - this.radius,
            bottom: p.height - this.y - this.radius,
        }
        return dist
    }

    checkEdges(p: p5) {
        if (this.x + this.radius >= p.width) {
            this.x = p.width - this.radius
            this.velocity.x *= -1
        } else if (this.x - this.radius <= 0) {
            this.x = this.radius
            this.velocity.x *= -1
        }

        if (this.y + this.radius >= p.height) {
            this.velocity.y *= -1
            this.y = p.height - this.radius
        } else if (this.y - this.radius <= 0) {
            this.velocity.y *= -1
            this.y = this.radius
        }
    }

    draw(p: p5) {
        p.circle(this.x, this.y, this.radius * 2)
    }

    attract(
        particle: Particle,
        { G = 1, min = this.min, max = this.max }: ForceOpts = {}
    ) {
        // F = (G * m1 * m2) / r^2 * rn
        // G = gravitational constant
        // m1 and m2 = mass of objects
        // rn = normalized vector from m1 to m2
        // r = distance between the two objects

        let force = this.copy().sub(particle)
        let distance = force.mag()
        // distance = constrain(distance, this.attractMin, this.attractMax)
        distance = constrain(distance, min, max)
        force.normalize()
        let strength = (G * this.mass * particle.mass) / (distance * distance)
        force.mult(strength)
        return force
    }

    repel(
        particle: Particle,
        { min = this.min, max = this.max }: ForceOpts = {}
    ) {
        let between = this.copy().sub(particle)
        let distance = between.mag()
        // distance = constrain(distance, 1, 100)
        distance = constrain(distance, min, max)
        let direction = between.normalize()
        let strength = (this.mass * particle.mass) / (distance * distance)
        let force = direction.mult(strength * -1)
        return force
    }
}

// export type Particleee = InstanceType<typeof init>
