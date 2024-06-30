import { Rectangle, Vec2 } from './trig-shapes'

export type QuadTreePoint = Vec2 | [number, number]

export class QuadTree<T extends QuadTreePoint> {
    bounds: Rectangle
    capacity: number
    depth: number
    children: QuadTree<T>[] = []
    points: T[] = []
    parent: QuadTree<T> | null = null
    _maxDepth: number | null = null
    _count: number | null = null

    constructor(bounds: Rectangle, capacity = 4, depth = 0, parent: QuadTree<T> | null = null) {
        this.bounds = bounds
        this.depth = depth
        this.capacity = capacity
        this._maxDepth = depth
        this._count = 0
        if (parent) this.parent = parent
    }

    get count(): number {
        if (this._count === null) {
            this._count = this.children.reduce(
                (total, child) => total + child.count,
                this.points.length
            )
        }
        return this._count
    }

    get maxDepth(): number {
        if (this._maxDepth === null) {
            let depth = this.depth
            this.children.forEach((child) => {
                depth = Math.max(depth, child.maxDepth)
            })

            this._maxDepth = depth
        }
        return this._maxDepth
    }

    insert(point: T) {
        this._count = null

        if (!this.bounds.contains(point)) {
            return false
        }

        if (this.points.length < this.capacity) {
            this.points.push(point)
            return true
        }

        if (this.children.length === 0) {
            this.subdivide()
        }

        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].insert(point)) {
                return true
            }
        }

        return false
    }

    subdivide() {
        this._maxDepth = null
        let { x, y, width, height } = this.bounds
        let halfWidth = width / 2
        let halfHeight = height / 2

        let ne = new QuadTree(
            new Rectangle(x + halfWidth, y, halfWidth, halfHeight),
            this.capacity,
            this.depth + 1,
            this
        )
        let nw = new QuadTree(
            new Rectangle(x, y, halfWidth, halfHeight),
            this.capacity,
            this.depth + 1,
            this
        )
        let se = new QuadTree(
            new Rectangle(x + halfWidth, y + halfHeight, halfWidth, halfHeight),
            this.capacity,
            this.depth + 1,
            this
        )
        let sw = new QuadTree(
            new Rectangle(x, y + halfHeight, halfWidth, halfHeight),
            this.capacity,
            this.depth + 1,
            this
        )

        this.children = [ne, nw, se, sw]
    }

    getLeafNodes() {
        let children: QuadTree<T>[] = []

        this.children.forEach((child) => {
            let c = child.getLeafNodes()
            children.push(...c)
        })

        if (children.length === 0) {
            children.push(this)
        }

        return children
    }

    query(range: Rectangle) {
        if (!this.bounds.intersects(range)) {
            return []
        }

        let found: T[] = []
        for (let p of this.points) {
            if (range.contains(p)) found.push(p)
        }

        this.children.forEach((child) => {
            found.push(...child.query(range))
        })

        return found
    }

    // maxDepth() {
    // let depth = this.depth
    // this.children.forEach((child) => {
    //     depth = Math.max(depth, child.maxDepth())
    // })
    // return depth
    // }

    getAllPoints() {
        let points: T[] = [...this.points]
        this.children.forEach((child) => {
            points.push(...child.getAllPoints())
        })

        return points
    }

    rebuild() {
        let points = this.getAllPoints()
        this.clear()
        points.forEach((p) => this.insert(p))
        this._maxDepth = null
    }

    unSubdivide() {
        if (this.children.length === 0) return

        while (this.children.length) {
            let child = this.children.pop()!
            this.points.push(...child.getAllPoints())
        }
        this._count = null
        this._maxDepth = this.depth
    }

    clear() {
        this.points = []
        this.children = []
        this._count = null
        this._maxDepth = this.depth
    }
}
