import p5 from 'p5'
import { Particle } from '~/helpers/particles/particle'

// drag force is very dependent on velocity, friction less so
// friction depends more on mass since N relates to gravity

const getFriction = (velocity: p5.Vector, µ = 0.01, N = 1) => {
    // µ mu = coefficient of friction (depends on material)
    // N = normal force (force perpendicular to surface... based on gravitational force)

    // friction = -1 * µ * N * v
    return velocity
        .copy()
        .mult(-1)
        .normalize()
        .mult(µ * N)
}

const getDrag = (velocity: p5.Vector, Cd = 0.1) => {
    // drag = -0.5 * ϱ * v^2 * A * Cd * v
    // rho ϱ = density of fluid  // we ignore this here
    // v^2 = speed of the object = magnitude of velocity vector
    // A = frontal area of object pushing through the liquid
    // for our purposes we consider the object is a sphere and ignore this
    // Cd = drag coefficient (like coefficient of friction)
    // v = velocity (normalized vector)
    let mag = velocity.copy().magSq() * Cd
    let drag = velocity.copy()
    drag.mult(-0.5).normalize().mult(mag)
    return drag
}

class DragBox {
    left: number
    right: number
    top: number
    bottom: number
    center: p5.Vector
    cd: number

    set width(w: number) {
        this.left = this.center.x - w / 2
        this.right = this.center.x + w / 2
    }

    set height(h: number) {
        this.bottom = this.center.y + h / 2
        this.top = this.center.y - h / 2
    }

    set size(s: number) {
        this.width = s
        this.height = s
    }

    constructor(x: number, y: number, w: number, h: number, cd = 0.1) {
        this.center = new p5.Vector(x, y)
        this.left = x - w / 2
        this.right = x + w / 2
        this.bottom = y + h / 2
        this.top = y - h / 2
        this.cd = cd // coefficient of drag
    }

    contains(particle: Particle) {
        return (
            particle.x > this.left &&
            particle.x < this.right &&
            particle.y > this.top &&
            particle.y < this.bottom
        )
    }

    draw(p: p5) {
        // p.rect(this.x, this.y, this.w, this.h)
        p.rect(this.left, this.top, this.right - this.left, this.bottom - this.top)
    }
}

export { getFriction, getDrag, DragBox }
