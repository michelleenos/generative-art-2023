import p5 from 'p5'
import { Boid } from './boid'
import { Circle, Rectangle } from './shapes'

export class Point {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}

export class QuadTree {
    bounds: Rectangle
    capacity: number
    boids: Boid[] = []
    ne: QuadTree | null = null
    nw: QuadTree | null = null
    se: QuadTree | null = null
    sw: QuadTree | null = null
    divided = false
    depth = 0

    constructor(bounds: Rectangle, capacity = 4, depth = 0) {
        this.bounds = bounds
        this.depth = depth
        this.capacity = capacity
    }

    insert(boid: Boid) {
        if (!this.bounds.contains(boid.x, boid.y)) {
            return false
        }

        if (this.boids.length < this.capacity) {
            this.boids.push(boid)
            return true
        } else if (!this.divided) {
            this.subdivide()
            this.divided = true
        }

        if (this.ne!.insert(boid)) return true
        if (this.nw!.insert(boid)) return true
        if (this.se!.insert(boid)) return true
        if (this.sw!.insert(boid)) return true

        return false
    }

    subdivide() {
        let { x, y, width, height } = this.bounds
        let halfWidth = width / 2
        let halfHeight = height / 2

        this.ne = new QuadTree(
            new Rectangle(x + halfWidth, y, halfWidth, halfHeight),
            this.capacity,
            this.depth + 1
        )
        this.nw = new QuadTree(
            new Rectangle(x, y, halfWidth, halfHeight),
            this.capacity,
            this.depth + 1
        )
        this.se = new QuadTree(
            new Rectangle(x + halfWidth, y + halfHeight, halfWidth, halfHeight),
            this.capacity,
            this.depth + 1
        )
        this.sw = new QuadTree(
            new Rectangle(x, y + halfHeight, halfWidth, halfHeight),
            this.capacity,
            this.depth + 1
        )
    }

    show(p: p5) {
        p.stroke(255)
        p.noFill()
        p.rect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height)

        if (this.ne) this.ne.show(p)
        if (this.nw) this.nw.show(p)
        if (this.se) this.se.show(p)
        if (this.sw) this.sw.show(p)
    }

    query(range: Rectangle | Circle, p?: p5) {
        if (!this.bounds.intersects(range)) {
            return []
        }

        if (p) {
            p.stroke(255, 255, 0)
            p.strokeWeight(3)
            p.rect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height)
        }
        let found: Boid[] = []
        this.boids.forEach((boid) => {
            if (range.contains(boid.x, boid.y)) {
                found.push(boid)
            }
        })

        if (this.ne) found = found.concat(this.ne.query(range, p))
        if (this.nw) found = found.concat(this.nw.query(range, p))
        if (this.se) found = found.concat(this.se.query(range, p))
        if (this.sw) found = found.concat(this.sw.query(range, p))

        return found
    }

    clear() {
        this.boids = []
        this.divided = false
        this.ne = null
        this.nw = null
        this.se = null
        this.sw = null
    }
}
