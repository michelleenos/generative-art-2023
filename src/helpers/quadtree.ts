import { Rectangle, Vec2 } from './trig-shapes'

export class QuadTree<T extends Vec2 | [number, number]> {
    divided = false
    bounds: Rectangle
    capacity: number
    depth: number
    ne: QuadTree<T> | null = null
    nw: QuadTree<T> | null = null
    se: QuadTree<T> | null = null
    sw: QuadTree<T> | null = null
    points: T[] = []

    constructor(bounds: Rectangle, capacity = 4, depth = 0) {
        this.bounds = bounds
        this.depth = depth
        this.capacity = capacity
    }

    insert(point: T) {
        if (!this.bounds.contains(point)) {
            return false
        }

        if (this.points.length < this.capacity) {
            this.points.push(point)
            return true
        }

        if (!this.divided) {
            this.subdivide()
            this.divided = true
        }

        if (this.ne!.insert(point)) return true
        if (this.nw!.insert(point)) return true
        if (this.se!.insert(point)) return true
        if (this.sw!.insert(point)) return true

        return false
    }

    getAllRects() {
        let children: Rectangle[] = []
        if (this.depth > 0) children.push(this.bounds)
        if (this.divided) {
            children.push(...this.ne!.getAllRects())
            children.push(...this.nw!.getAllRects())
            children.push(...this.se!.getAllRects())
            children.push(...this.sw!.getAllRects())
        }
        return children
    }

    query(range: Rectangle) {
        if (!this.bounds.intersects(range)) {
            return []
        }

        let found: T[] = []
        for (let p of this.points) {
            if (range.contains(p)) {
                found.push(p)
            }
        }

        if (this.divided) {
            found.push(...this.ne!.query(range))
            found.push(...this.nw!.query(range))
            found.push(...this.se!.query(range))
            found.push(...this.sw!.query(range))
        }

        return found
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

    clear() {
        this.points = []
        this.divided = false
        this.ne = null
        this.nw = null
        this.se = null
        this.sw = null
    }
}
