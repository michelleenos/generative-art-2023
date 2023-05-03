import '../style.css'
import p5 from 'p5'
import { Pane } from 'tweakpane'

const EDGEOPTS = {
    randomEachStep: 'random', // new random forces each frame applied to all particles
    allRandom: 'randomEach', // random forces each step, for each particle
    sameRandomEach: 'sameEach', // each particle has its own randomly generated forces, always applied
    sameAlways: 'same', // one randomly generated set of forces applied throughout
}

const PARAMS = {
    edges: 'same',
    forceHigh: 0.1,
    forceLow: 0.06,
}

type EdgeForces = {
    left: number
    right: number
    top: number
    bottom: number
}

new p5((p: p5) => {
    let particles: Particle[] = []
    let edgeForcesSame: EdgeForces
    let img

    let pane = new Pane()
    pane.addInput(PARAMS, 'edges', { options: EDGEOPTS })
    pane.addInput(PARAMS, 'forceHigh', { min: 0, max: 0.3 })
    pane.addInput(PARAMS, 'forceLow', { min: 0, max: 0.3 })
    pane.on('change', setup)

    class Particle extends p5.Vector {
        radius: number
        acceleration: p5.Vector = new p5.Vector()
        velocity: p5.Vector = new p5.Vector()
        mass: number
        edgeForce: EdgeForces

        constructor(x, y, r, mass = 1) {
            super(x, y)
            this.radius = r
            this.mass = mass
            this.edgeForce = generateEdgeForce()
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

        distFromEdge() {
            let dist = {
                left: this.x - this.radius,
                right: p.width - this.x - this.radius,
                top: this.y - this.radius,
                bottom: p.height - this.y - this.radius,
            }
            return dist
        }

        checkEdges() {
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

        draw() {
            p.circle(this.x, this.y, this.radius * 2)
        }
    }

    function generateEdgeForce(): EdgeForces {
        return {
            left: p.random(PARAMS.forceLow, PARAMS.forceHigh),
            right: p.random(PARAMS.forceLow, PARAMS.forceHigh),
            top: p.random(PARAMS.forceLow, PARAMS.forceHigh),
            bottom: p.random(PARAMS.forceLow, PARAMS.forceHigh),
        }
    }

    function setup() {
        if (img) img.clear()
        particles = []
        for (let i = 0; i < 7; i++) {
            particles.push(
                new Particle(p.random(p.width), p.random(p.height), 10, 0.5)
            )
        }
        edgeForcesSame = generateEdgeForce()
    }

    p.setup = () => {
        p.createCanvas(400, 400)

        setup()

        img = p.createGraphics(400, 400)
        img.strokeWeight(0.5)
        img.stroke(255, 150)

        edgeForcesSame = generateEdgeForce()
    }

    p.draw = () => {
        p.background(10)
        p.noStroke()
        p.fill(200)

        let edgeForcesRandom: EdgeForces = generateEdgeForce()

        // https://natureofcode.com/book/chapter-2-forces/
        // Instead of objects bouncing off the edge of the wall,
        // create an example in which an invisible force pushes
        // back on the objects to keep them in the window.
        // Can you weight the force according to how far
        // the object is from an edge—i.e., the closer it is,
        // the stronger the force?

        particles.forEach((particle) => {
            let oldX = particle.x
            let oldY = particle.y
            let dist = particle.distFromEdge()

            let edgeForces: EdgeForces =
                PARAMS.edges === 'same'
                    ? edgeForcesSame
                    : PARAMS.edges === 'sameEach'
                    ? particle.edgeForce
                    : PARAMS.edges === 'random'
                    ? edgeForcesRandom
                    : generateEdgeForce()

            let left = (1 - dist.left / p.width) * edgeForces.left
            let right = (1 - dist.right / p.width) * edgeForces.right
            let top = (1 - dist.top / p.height) * edgeForces.top
            let bottom = (1 - dist.bottom / p.height) * edgeForces.bottom

            let force = new p5.Vector(left - right, top - bottom)
            particle.applyForce(force)
            particle.update()
            particle.draw()
            img.line(oldX, oldY, particle.x, particle.y)
        })

        p.image(img, 0, 0)
    }
}, document.getElementById('sketch') ?? undefined)
