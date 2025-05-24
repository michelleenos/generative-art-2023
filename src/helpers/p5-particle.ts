import p5 from 'p5'
import { constrain } from './utils'

export type ParticleOpts = {
    radius?: number
    mass?: number
    velInit?: p5.Vector
    edges?: { left: number; right: number; top: number; bottom: number }
}

export type ForceOpts = {
    G?: number
    min?: number
    max?: number
}
export class p5Particle extends p5.Vector {
    radius: number
    acceleration: p5.Vector = new p5.Vector()
    velocity: p5.Vector
    mass: number
    min: number = 5
    max: number = 25
    edges?: { left: number; right: number; top: number; bottom: number }

    constructor(x: number, y: number, opts: ParticleOpts = {}) {
        super(x, y)
        this.radius = opts.radius ?? 5
        this.mass = opts.mass ?? 1
        this.velocity = opts.velInit ?? new p5.Vector(0, 0)
        if (opts.edges) this.edges = opts.edges
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

    distFromEdge(p?: p5) {
        if (p) {
            return {
                left: this.x - this.radius,
                right: p.width - this.x - this.radius,
                top: this.y - this.radius,
                bottom: p.height - this.y - this.radius,
            }
        } else if (this.edges) {
            return {
                left: this.x - this.radius - this.edges.left,
                right: this.edges.right - this.x - this.radius,
                top: this.y - this.radius - this.edges.top,
                bottom: this.edges.bottom - this.y - this.radius,
            }
        } else {
            throw new Error(`No edges defined for particle: ${this}`)
        }
    }

    checkEdges(multIfEdge = -1, p?: p5) {
        if (p) {
            let dist = this.distFromEdge(p)
            if (dist.left <= 0) {
                this.x = this.radius
                this.velocity.x *= multIfEdge
            } else if (dist.right <= 0) {
                this.x = p.width - this.radius
                this.velocity.x *= multIfEdge
            } else if (dist.top <= 0) {
                this.velocity.y *= multIfEdge
                this.y = this.radius
            } else if (dist.bottom <= 0) {
                this.velocity.y *= multIfEdge
                this.y = p.height - this.radius
            }
        } else if (this.edges) {
            let dist = this.distFromEdge()
            if (dist.left <= 0) {
                this.x = this.radius + this.edges.left
                this.velocity.x *= multIfEdge
            } else if (dist.right <= 0) {
                this.x = this.edges.right - this.radius
                this.velocity.x *= multIfEdge
            } else if (dist.top <= 0) {
                this.velocity.y *= multIfEdge
                this.y = this.radius + this.edges.top
            } else if (dist.bottom <= 0) {
                this.velocity.y *= multIfEdge
                this.y = this.edges.bottom - this.radius
            }
        } else {
            throw new Error(`No edges defined for particle: ${this}`)
        }
    }

    draw(p: p5) {
        p.circle(this.x, this.y, this.radius * 2)
    }

    attract(particle: p5Particle, { G = 1, min = this.min, max = this.max }: ForceOpts = {}) {
        // F = (G * m1 * m2) / r^2 * rn
        // G = gravitational constant
        // m1 and m2 = mass of objects
        // rn = normalized vector from m1 to m2
        // r = distance between the two objects

        let force = this.copy().sub(particle)
        let distance = force.mag()
        distance = constrain(distance, min, max)
        force.normalize()
        let strength = (G * this.mass * particle.mass) / (distance * distance)
        force.mult(strength)
        return force
    }

    repel(particle: p5Particle, { min = this.min, max = this.max }: ForceOpts = {}) {
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
