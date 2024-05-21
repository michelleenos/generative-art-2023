import p5 from 'p5'
import { Flock } from './flock'
import { Circle, Rectangle, Vec2 } from './shapes'
import { map } from '~/helpers/utils'

export class Boid extends Circle {
    velocity: Vec2
    acceleration: Vec2
    flock: Flock

    constructor(x: number, y: number, flock: Flock, opts: { perception?: number } = {}) {
        super(x, y, opts.perception ?? 25)
        this.x = x
        this.y = y
        this.flock = flock
        this.velocity = new Vec2()
        this.acceleration = new Vec2()
    }

    get perception() {
        return this._r
    }

    set perception(value: number) {
        this.radius = value
    }

    update() {
        let newVel = this.velocity.copy().add(this.acceleration)
        // this.velocity.add(this.acceleration)
        this.velocity.lerp(newVel, 0.5).limit(this.flock.boidsMaxSpeed)
        this.add(this.velocity)
        this.acceleration.mult(0)
    }

    applyForce(force: Vec2) {
        let f = force.copy().div(this.flock.boidsMass)
        this.acceleration.add(f)
    }

    draw(p: p5, drawPerception = false, color: [number, number, number] = [0, 0, 0]) {
        // if (!color) {
        //     color = [
        //         this.velocity.x * 255,
        //         (1 - this.velocity.y) * 100 + 100,
        //         this.velocity.y * 250,
        //     ]
        // }
        // let angle = this.velocity.heading()
        let angle = Math.atan2(this.velocity.y, this.velocity.x)
        p.push()
        p.translate(this.x, this.y)
        p.rotate(angle)
        p.strokeWeight(2)
        p.fill(...color, 100)
        p.stroke(...color)

        p.beginShape()
        p.vertex(10, 0)
        p.vertex(-10, -5)
        p.vertex(-10, 5)
        p.endShape(p.CLOSE)

        if (drawPerception) {
            p.noFill()
            p.stroke(...color, 50)
            p.circle(0, 0, this.perception * 2)
        }

        p.pop()
    }

    edgesBounce(bounds: Rectangle, offset = this.perception / 2) {
        let desiredVel: null | Vec2 = null

        if (this.x < offset) {
            desiredVel = new Vec2(this.flock.boidsMaxSpeed, this.velocity.y)
        } else if (this.x > bounds.width - offset) {
            desiredVel = new Vec2(-this.flock.boidsMaxSpeed, this.velocity.y)
        }

        if (this.y < offset) {
            desiredVel = new Vec2(this.velocity.x, this.flock.boidsMaxSpeed)
        } else if (this.y > bounds.height - offset) {
            desiredVel = new Vec2(this.velocity.x, -this.flock.boidsMaxSpeed)
        }

        if (desiredVel) {
            desiredVel.setMag(this.flock.boidsMaxSpeed)
            let steer = desiredVel.sub(this.velocity)
            steer.limit(this.flock.boidsMaxForce)
            return steer
        } else {
            return new Vec2()
        }
    }

    edgesTeleport(bounds: Rectangle, offset = this.perception) {
        if (this.x < -offset) {
            this.x = bounds.width + offset
        } else if (this.x > bounds.width + offset) {
            this.x = -offset
        }

        if (this.y < -offset) {
            this.y = bounds.height + offset
        } else if (this.y > bounds.height + offset) {
            this.y = -offset
        }
    }

    separation(boids: Boid[]) {
        let steer = new Vec2(0)
        let count = 0

        for (let boid of boids) {
            if (boid === this) continue
            let diff = new Vec2(this.x - boid.x, this.y - boid.y)
            let dSq = diff.copy().magSq()
            if (dSq > this.rSquared) continue

            diff.normalize().div(Math.sqrt(dSq))

            // let d = Math.sqrt(dSq)
            // diff.setMag(1 / d)
            steer.add(diff)
            count++
        }

        if (count === 0) return steer

        // reynold's steering formula: steering force = desired velocity - current velocity
        // vehicle desires to move towards the direction at maximum possible speed
        // https://natureofcode.com/autonomous-agents/#vehicles-and-steering
        steer.div(count)
        steer.setMag(this.flock.boidsMaxSpeed)
        steer.sub(this.velocity)
        steer.limit(this.flock.boidsMaxForce)
        return steer
    }

    alignment(boids: Boid[]) {
        let otherVels = new Vec2()
        let count = 0

        for (let boid of boids) {
            if (boid === this) continue
            let dSq = this.copy().sub(boid).magSq() // magSq == distance squared. use against rSq for performance (avoids square root)
            if (dSq > this.rSquared) continue

            otherVels.add(boid.velocity)
            count++
        }

        if (count === 0) return otherVels
        otherVels.div(count)
        otherVels.setMag(this.flock.boidsMaxSpeed)
        let steer = otherVels.copy().sub(this.velocity)
        steer.limit(this.flock.boidsMaxForce)
        return steer
    }

    cohesion(boids: Boid[]) {
        let center = new Vec2()
        let count = 0

        for (let boid of boids) {
            if (boid === this) continue
            let dSq = this.copy().sub(boid).magSq()
            if (dSq > this.rSquared) continue
            center.add(boid)
            count++
        }

        if (count === 0) return center
        center.div(count)
        return this.seek(center)
    }

    seek(circle: Circle, strength?: number): Vec2
    seek(target: Vec2, strength?: number): Vec2
    seek(target: Vec2 | Circle, strength = 1) {
        let desiredVel = target.copy().sub(this)
        let dist = desiredVel.mag()
        if (target instanceof Circle) {
            dist -= target.radius
        }
        if (dist < 100) {
            let m = map(dist, 0, 100, 0, this.flock.boidsMaxSpeed)
            desiredVel.setMag(m)
        } else {
            desiredVel.setMag(this.flock.boidsMaxSpeed)
        }
        let steer = desiredVel.sub(this.velocity).mult(strength).limit(this.flock.boidsMaxForce)
        return steer
    }

    flockWith(
        boids: Boid[],
        bounds: Rectangle,
        edgeMode: 'bounce' | 'teleport' = 'bounce',
        mults: { separate: number; cohere: number; align: number; bounds: number } = {
            separate: 1,
            cohere: 1,
            align: 1,
            bounds: 1,
        }
    ) {
        let separate = this.separation(boids).mult(mults.separate) // 1.4
        let cohere = this.cohesion(boids).mult(mults.cohere) // 0.8
        let align = this.alignment(boids).mult(mults.align)

        this.applyForce(separate)
        this.applyForce(cohere)
        this.applyForce(align)
        if (edgeMode === 'bounce') {
            let boundary = this.edgesBounce(bounds).mult(mults.bounds)
            this.applyForce(boundary)
        } else {
            this.edgesTeleport(bounds)
        }
    }
}
