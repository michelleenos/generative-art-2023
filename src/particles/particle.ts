import p5 from 'p5'

export interface Particle extends p5.Vector {
    radius: number
    acceleration: p5.Vector
    velocity: p5.Vector
    mass: number
    applyForce(force: p5.Vector): void
    update(): void
    distFromEdge(): {
        left: number
        right: number
        top: number
        bottom: number
    }
    checkEdges(): void
    draw(): void
}

export function init(p: p5) {
    class Particle extends p5.Vector {
        radius: number
        acceleration: p5.Vector = new p5.Vector()
        velocity: p5.Vector = new p5.Vector(1, 0)
        mass: number

        constructor(x, y, r, mass = 1) {
            super(x, y)
            this.radius = r
            this.mass = mass
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

    return Particle
}
