import { Boid } from './boid'
import { QuadTree } from './quadtree'
import { Circle, Rectangle } from './shapes'
import p5 from 'p5'

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
