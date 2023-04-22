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

export class Particle extends p5.Vector {
    radius: number
    acceleration: p5.Vector = new p5.Vector()
    velocity: p5.Vector
    mass: number
    min: number = 5
    max: number = 25

    constructor(
        x,
        y,
        radius = 5,
        mass = 1,
        velInit: p5.Vector = new p5.Vector(0, 0)
    ) {
        super(x, y)
        this.radius = radius
        this.mass = mass
        this.velocity = velInit
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

    attract(particle: Particle) {
        // F = (G * m1 * m2) / r^2 * rn
        // G = gravitational constant
        // m1 and m2 = mass of objects
        // rn = normalized vector from m1 to m2
        // r = distance between the two objects

        let force = this.copy().sub(particle)
        let distance = force.mag()
        distance = constrain(distance, this.min, this.max)
        force.normalize()
        let G = 1
        let strength = (G * this.mass * particle.mass) / (distance * distance)
        force.mult(strength)
        return force
    }

    get constraint() {
        return {
            min: this.min,
            max: this.max,
        }
    }

    set constraint({ min, max }: { min?: number; max?: number }) {
        if (min) this.min = min
        if (max) this.max = max
    }
}

// export type Particleee = InstanceType<typeof init>