import { Boid } from './boid'
import { QuadTree } from './quadtree'
import { Circle, Rectangle, Vec2 } from './shapes'
import p5 from 'p5'

type BoidCb = (boid: Boid, i: number) => void
export class Flock {
    boids: Boid[] = []
    defaultPerception?: number
    quadTree: QuadTree
    boidsMaxSpeed = 3
    boidsMaxForce = 0.15
    boidsMass = 1
    showPerception = false
    showQuadTree = false
    edgeMode: 'bounce' | 'teleport' = 'bounce'
    highlight = false
    mouse = new Circle(0, 0, 50)
    useMouse = false
    mouseStrength = 0.5
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

    draw(p: p5) {
        this.boids.forEach((boid) => boid.draw(p, this.showPerception))
    }

    flock(beforeUpdate?: BoidCb, afterUpdate?: BoidCb) {
        this.boids.forEach((boid, i) => {
            let neighbors = this.quadTree.query(boid)

            boid.flockWith(neighbors, this.quadTree.bounds, this.edgeMode, this.mults)
            if (this.useMouse) {
                let mouse = boid.seek(this.mouse, this.mouseStrength)
                boid.applyForce(mouse)
            }
            if (beforeUpdate) beforeUpdate(boid, i)
            boid.update()
            if (afterUpdate) afterUpdate(boid, i)

            // if (g) {
            //     g.fill(
            //         boid.velocity.x * 255,
            //         (1 - boid.velocity.y) * 100 + 100,
            //         boid.velocity.y * 250,
            //         100
            //     )
            //     g.noStroke()
            //     g.circle(boid.x, boid.y, 10)
            // }
        })
    }
}
