import p5 from 'p5'
import { QuadTree } from './quadtree'
import { Circle, Vec2, Rectangle } from './shapes'

export class Flock {
    boids: Boid[] = []
    defaultPerception?: number
    quadTree: QuadTree
    boidsMaxSpeed = 3
    boidsMaxForce = 0.15
    boidsMass = 1
    mults: {
        separate: number
        cohere: number
        align: number
        bounds: number
    } = {
        separate: 1,
        cohere: 1,
        align: 1,
        bounds: 1,
    }

    constructor(bounds: Rectangle, qtreeCapacity: number, perception?: number) {
        this.defaultPerception = perception
        this.quadTree = new QuadTree(bounds, qtreeCapacity)
    }

    setBoidsPerception(perception: number) {
        this.defaultPerception = perception
        this.boids.forEach((boid) => (boid.perception = perception))
    }

    add(boid?: Boid) {
        if (boid) {
            boid.flock = this
            this.boids.push(boid)
        } else {
            this.boids.push(
                new Boid(
                    Math.random() * this.quadTree.bounds.width,
                    Math.random() * this.quadTree.bounds.height,
                    this,
                    {
                        perception: this.defaultPerception,
                    }
                )
            )
        }
    }

    update() {
        this.quadTree.clear()
        this.boids.forEach((boid) => {
            this.quadTree.insert(boid)
        })
    }

    flock(p: p5) {
        this.boids.forEach((boid) => {
            let neighbors = this.quadTree.query(new Circle(boid.x, boid.y, boid.perception))

            boid.flockWith(neighbors, this.quadTree.bounds, this.mults)

            boid.update()
            boid.draw(p, true)
        })
    }
}

export class Boid extends Vec2 {
    velocity: p5.Vector
    acceleration: Vec2
    // maxSpeed = 3
    // maxForce = 0.15
    // mass = 1
    highlighted = false
    highlightedNeighbor = false
    circle: Circle
    flock: Flock
    _perception = 25

    constructor(x: number, y: number, flock: Flock, opts?: { perception?: number }) {
        super(x, y)
        this.flock = flock
        this.velocity = new p5.Vector()
        this.acceleration = new Vec2()

        if (opts?.perception) this._perception = opts.perception

        this.circle = new Circle(x, y, this._perception)
    }

    get perception() {
        return this.circle.radius
    }

    set perception(value: number) {
        this.circle.radius = value
    }

    setHighlight(value: boolean) {
        this.highlighted = value
    }

    update() {
        this.velocity.add(new p5.Vector(this.acceleration.x, this.acceleration.y))
        this.velocity.limit(this.flock.boidsMaxSpeed)
        this.x += this.velocity.x
        this.y += this.velocity.y
        this.acceleration.mult(0)
    }

    applyForce(force: p5.Vector) {
        let f = force.copy().div(this.flock.boidsMass)
        this.acceleration.add(f)
    }

    draw(p: p5, perception = false) {
        let angle = this.velocity.heading()
        p.push()
        p.translate(this.x, this.y)
        p.rotate(angle)
        p.strokeWeight(2)
        if (this.highlighted) {
            p.fill(255, 0, 0, 100)
            p.stroke(255, 0, 10)
        } else if (this.highlightedNeighbor) {
            p.fill(255, 255, 0, 50)
            p.stroke(255, 255, 0)
        } else {
            p.stroke(0)
            p.fill(50, 100)
        }

        p.beginShape()
        p.vertex(10, 0)
        p.vertex(-10, -5)
        p.vertex(-10, 5)
        p.endShape(p.CLOSE)

        if (perception) {
            p.noFill()
            if (this.highlighted) {
                p.stroke(255, 0, 10, 100)
            } else {
                p.stroke(0, 50)
            }
            p.circle(0, 0, this.perception * 2)
        }

        this.highlightedNeighbor = false
        p.pop()
    }

    checkEdges(width: number, height: number, offset = 5) {
        if (this.x > width - offset) {
            if (this.velocity.x > 0) this.velocity.mult(-1)
        } else if (this.x < offset) {
            if (this.velocity.x < 0) this.velocity.mult(-1)
        }
        if (this.y > height - offset) {
            if (this.velocity.y > 0) this.velocity.mult(-1)
        } else if (this.y < offset) {
            if (this.velocity.y < 0) this.velocity.mult(-1)
        }
    }

    checkBounds(bounds: Rectangle, offset = this.perception / 2) {
        let desiredVel: null | p5.Vector = null

        if (this.x < offset) {
            desiredVel = new p5.Vector(this.flock.boidsMaxSpeed, this.velocity.y)
        } else if (this.x > bounds.width - offset) {
            desiredVel = new p5.Vector(-this.flock.boidsMaxSpeed, this.velocity.y)
        }

        if (this.y < offset) {
            desiredVel = new p5.Vector(this.velocity.x, this.flock.boidsMaxSpeed)
        } else if (this.y > bounds.height - offset) {
            desiredVel = new p5.Vector(this.velocity.x, -this.flock.boidsMaxSpeed)
        }

        if (desiredVel) {
            desiredVel.setMag(this.flock.boidsMaxSpeed)
            let steer = p5.Vector.sub(desiredVel, this.velocity)
            steer.limit(this.flock.boidsMaxForce)
            return steer
        } else {
            return new p5.Vector()
        }
    }

    separation(boids: Boid[]) {
        let sum = new p5.Vector(0)
        let count = 0

        for (let boid of boids) {
            if (boid === this) continue
            // let d = p5.Vector.dist(new p5.Vector(this.x, this.y), new p5.Vector(boid.x, boid.y))

            if (d > this.perception) continue

            // let diff = new p5.Vector(this.x, this.y).sub(new p5.Vector(boid.x, boid.y))
            let diff = new p5.Vector(this.x - boid.x, this.y - boid.y)
            diff.setMag(1 / d)
            sum.add(diff)
            count++
        }

        if (count === 0) return sum

        // reynold's steering formula: steering force = desired velocity - current velocity
        // vehicle desires to move towards the direction at maximum possible speed
        // https://natureofcode.com/autonomous-agents/#vehicles-and-steering
        sum.setMag(this.flock.boidsMaxSpeed)
        let steer = p5.Vector.sub(sum, this.velocity)
        steer.limit(this.flock.boidsMaxForce)
        return steer
    }

    alignment(boids: Boid[]) {
        let otherVels = new p5.Vector()
        let count = 0

        for (let boid of boids) {
            if (boid === this) continue
            let d = p5.Vector.dist(new p5.Vector(this.x, this.y), new p5.Vector(boid.x, boid.y))
            if (d > this.perception) continue

            let boidVel = boid.velocity.copy()
            boidVel.setMag(1 / d)
            otherVels.add(boidVel)
            count++
        }

        if (count === 0) return otherVels
        // otherVels.div(count)
        otherVels.setMag(this.flock.boidsMaxSpeed)
        let steer = p5.Vector.sub(otherVels, this.velocity)
        steer.limit(this.flock.boidsMaxForce)
        return steer
    }

    cohesion(boids: Boid[]) {
        let center = new p5.Vector()
        let count = 0

        for (let boid of boids) {
            if (boid === this) continue
            // let d = this.position.dist(boid.position)
            let d = p5.Vector.dist(new p5.Vector(this.x, this.y), new p5.Vector(boid.x, boid.y))
            if (d > this.perception) continue

            center.x += boid.x
            center.y += boid.y
            count++
        }

        if (count === 0) return center
        center.div(count)
        return this.seek(center)
    }

    seek(target: p5.Vector) {
        // let desired = p5.Vector.sub(target, this.position)
        let desired = p5.Vector.sub(target, new p5.Vector(this.x, this.y))
        desired.setMag(this.flock.boidsMaxSpeed)
        let steer = p5.Vector.sub(desired, this.velocity)
        steer.limit(this.flock.boidsMaxForce)
        return steer
    }

    flockWith(
        boids: Boid[],
        bounds: Rectangle,
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
        let boundary = this.checkBounds(bounds).mult(mults.bounds) // 1.3
        if (this.highlighted) boids.forEach((boid) => (boid.highlightedNeighbor = true))

        this.applyForce(separate)
        this.applyForce(cohere)
        this.applyForce(align)
        this.applyForce(boundary)
    }
}
