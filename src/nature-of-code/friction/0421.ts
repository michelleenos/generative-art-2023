import '../../style.css'
import p5 from 'p5'

import { Particle } from '~/helpers/particles/particle'

new p5((p: p5) => {
    let particles: Particle[] = []
    let liquid: Liquid

    class Liquid {
        x: number
        y: number
        w: number
        h: number
        cd: number

        constructor(x: number, y: number, w: number, h: number, cd = 0.1) {
            this.x = x
            this.y = y
            this.w = w
            this.h = h
            this.cd = cd // coefficient of drag
        }

        contains(particle: Particle) {
            let l = particle.x - particle.radius
            let r = particle.x + particle.radius
            let t = particle.y - particle.radius
            let b = particle.y + particle.radius

            return l > this.x && r < this.x + this.w && t > this.y && b < this.y + this.h
        }

        draw() {
            p.push()
            p.noStroke()
            p.fill(100, 100)
            p.rect(this.x, this.y, this.w, this.h)
            p.pop()
        }
    }

    // const getFriction = (velocity: p5.Vector) => {
    //     const µ = 0.01 // mu = coefficient of friction (depends on material)
    //     const N = 1 // N = normal force (force perpendicular to surface... based on gravitational force)

    //     // friction = -1 * µ * N * v
    //     return velocity
    //         .copy()
    //         .mult(-1)
    //         .normalize()
    //         .mult(µ * N)
    // }

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

    p.setup = () => {
        p.createCanvas(400, 400)

        for (let i = 0; i < 7; i++) {
            let mass = p.random(0.5, 3)
            let radius = p.map(mass, 0.5, 3, 4, 20)
            let particle = new Particle(p.random(p.width * 0.1, p.width * 0.9), p.random(0), {
                radius,
                mass,
            })
            particles.push(particle)
        }

        liquid = new Liquid(0, p.height / 2, p.width, p.height / 2, 0.1)
    }

    p.draw = () => {
        p.background(10)
        p.noStroke()
        p.fill(200)

        liquid.draw()

        let wind = new p5.Vector(0.001, 0)
        let gravity = new p5.Vector(0, 0.1)
        particles.forEach((particle) => {
            let mass = particle.mass
            particle.applyForce(gravity.copy().mult(mass))

            // let friction = getFriction(particle.velocity)
            // particle.applyForce(friction)

            if (liquid.contains(particle)) {
                let drag = getDrag(particle.velocity, liquid.cd)
                particle.applyForce(drag)
            }

            particle.applyForce(wind)
            particle.update()
            particle.draw(p)
        })
    }
})
