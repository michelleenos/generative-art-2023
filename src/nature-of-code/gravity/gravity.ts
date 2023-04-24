import '../../style.css'
import p5 from 'p5'
import { Particle } from '../../helpers/particles/particle'

new p5((p: p5) => {
    let particles: Particle[] = []
    let attractor: Attractor

    class Attractor extends Particle {
        constructor(x, y, r, mass = 1) {
            super(x, y, { radius: r, mass })
        }

        attract(particle: Particle) {
            // F = (G * m1 * m2) / r^2 * rn
            // G = gravitational constant
            // m1 and m2 = mass of objects
            // rn = normalized vector from m1 to m2
            // r = distance between the two objects

            let force = this.copy().sub(particle)
            let distance = force.mag()
            distance = p.constrain(distance, 5, 25)
            force.normalize()
            let G = 1
            let strength =
                (G * this.mass * particle.mass) / (distance * distance)
            force.mult(strength)
            return force
        }

        draw(): void {
            p.push()
            p.noStroke()
            p.fill(255, 100)
            p.ellipse(this.x, this.y, this.radius * 2)
            p.pop()
        }
    }

    p.setup = () => {
        p.createCanvas(400, 400)
        for (let i = 0; i < 10; i++) {
            particles.push(
                new Particle(p.random(p.width), p.random(p.height), {
                    radius: 8,
                    mass: p.random(0.5, 1.5),
                })
            )
        }
        attractor = new Attractor(p.width / 2, p.height / 2, 40, 20)
    }

    p.draw = () => {
        p.background(10)
        p.noStroke()
        p.fill(200)

        attractor.draw()

        particles.forEach((particle) => {
            let force = attractor.attract(particle)
            particle.applyForce(force)

            particle.update()
            particle.draw(p)
        })
    }
})
