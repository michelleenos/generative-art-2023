import '../style.css'
import p5 from 'p5'

import { Particle } from '../helpers/particles/particle'

let sketch = new p5((p: p5) => {
    let particles: Particle[] = []
    let attractor: Particle

    p.setup = () => {
        p.createCanvas(400, 400)

        for (let i = 0; i < 10; i++) {
            particles.push(
                new Particle(
                    p.random(p.width),
                    p.random(p.height),
                    8,
                    p.random(0.5, 1.5)
                )
            )
        }
        attractor = new Particle(p.random(p.width), p.random(p.height), 40, 20)
    }

    p.draw = () => {
        p.background(10)

        p.stroke(200)
        p.strokeWeight(3)
        p.fill(100, 100)
        attractor.draw(p)

        p.fill(200)
        p.noStroke()

        particles.forEach((particle) => {
            let force = attractor.attract(particle)
            particle.applyForce(force)

            particle.update()
            particle.draw(p)
        })
    }
})
