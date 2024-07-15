import { Rectangle } from '~/helpers/trig-shapes'
import { random } from '~/helpers/utils'

let nodeIdCount = 0

export type NodeOptions = {
    capacity?: number
    depth?: number
    parent?: Node | null
    divideRule?: Node['divideRule']
}

export class Node {
    bounds: Rectangle
    capacity: number
    depth: number
    children: Node[] = []
    parent: Node | null = null
    points: [number, number][] = []
    nodeId = nodeIdCount++
    divideRule:
        | 'random'
        | 'half'
        | 'two-thirds'
        | 'thirds-row'
        | 'quarters-grid'
        | 'quarters-random' = 'random'

    constructor(
        bounds: Rectangle,
        { capacity = 4, depth = 0, parent = null, divideRule = 'random' }: NodeOptions
    ) {
        this.bounds = bounds
        this.capacity = capacity
        this.depth = depth
        this.divideRule = divideRule
        if (parent) this.parent = parent
    }

    insert(point: [number, number]) {
        if (!this.bounds.contains(point)) {
            return false
        }

        if (this.points.length < this.capacity) {
            this.points.push(point)
            return true
        }

        if (this.children.length === 0) {
            this.divide(point)
        }

        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].insert(point)) {
                return true
            }
        }

        return false
    }

    getMaxDepth = (): number => {
        let depths = this.children.map((child) => child.getMaxDepth())
        return Math.max(this.depth, ...depths)
    }

    divide(point?: [number, number]) {
        let rects = this.divideRect(point)
        if (!rects) return false

        this.children = rects.map((rect) => {
            return new Node(rect, {
                capacity: this.capacity,
                depth: this.depth + 1,
                parent: this,
                divideRule: this.divideRule,
            })
        })
        return true
    }

    divideRect(point?: [number, number]) {
        if (this.children.length > 0) return false
        let { x, y, width, height } = this.bounds
        if (!point) point = [random(x, x + width), random(y, y + height)]

        let dir: 'x' | 'y'
        if (width * 0.75 > height) {
            dir = 'x'
        } else if (height * 0.75 > width) {
            dir = 'y'
        } else {
            dir = random(['x', 'y'])
        }

        if (this.divideRule === 'half') {
            if (dir === 'x') {
                return [
                    new Rectangle(x, y, width / 2, height),
                    new Rectangle(x + width / 2, y, width / 2, height),
                ]
            } else {
                return [
                    new Rectangle(x, y, width, height / 2),
                    new Rectangle(x, y + height / 2, width, height / 2),
                ]
            }
        } else if (this.divideRule === 'two-thirds') {
            if (dir === 'x') {
                let pointX = point[0]
                let distLeft = pointX - x
                let distRight = x + width - pointX
                let w1 = distLeft > distRight ? width * (1 / 3) : width * (2 / 3)
                let w2 = width - w1
                return [new Rectangle(x, y, w1, height), new Rectangle(x + w1, y, w2, height)]
            } else {
                let pointY = point[1]
                let distTop = pointY - y
                let distBottom = y + height - pointY

                let h1 = distTop > distBottom ? height * (1 / 3) : height * (2 / 3)
                let h2 = height - h1
                return [new Rectangle(x, y, width, h1), new Rectangle(x, y + h1, width, h2)]
            }
        } else if (this.divideRule === 'thirds-row') {
            if (dir === 'x') {
                let w = width / 3
                return [
                    new Rectangle(x, y, w, height),
                    new Rectangle(x + w, y, w, height),
                    new Rectangle(x + 2 * w, y, w, height),
                ]
            } else {
                let h = height / 3
                return [
                    new Rectangle(x, y, width, h),
                    new Rectangle(x, y + h, width, h),
                    new Rectangle(x, y + 2 * h, width, h),
                ]
            }
        } else if (this.divideRule === 'quarters-grid') {
            let w = width / 2
            let h = height / 2
            return [
                new Rectangle(x, y, w, h),
                new Rectangle(x + w, y, w, h),
                new Rectangle(x, y + h, w, h),
                new Rectangle(x + w, y + h, w, h),
            ]
        } else if (this.divideRule === 'quarters-random') {
            let distLeft = point[0] - x
            let distRight = x + width - point[0]
            let newWidth = random(0.25, 0.75) * (distLeft > distRight ? distLeft : distRight)

            let distTop = point[1] - y
            let distBottom = y + height - point[1]
            let newHeight = random(0.25, 0.75) * (distTop > distBottom ? distTop : distBottom)

            let w1 = distLeft > distRight ? newWidth : width - newWidth
            let w2 = distLeft > distRight ? width - newWidth : newWidth
            let h1 = distTop > distBottom ? newHeight : height - newHeight
            let h2 = distTop > distBottom ? height - newHeight : newHeight

            return [
                new Rectangle(x, y, w1, h1),
                new Rectangle(x + w1, y, w2, h1),
                new Rectangle(x, y + h1, w1, h2),
                new Rectangle(x + w1, y + h1, w2, h2),
            ]
        } else {
            if (dir === 'x') {
                let distLeft = point[0] - x
                let distRight = x + width - point[0]
                let newWidth = random(0.25, 0.75) * (distLeft > distRight ? distLeft : distRight)
                let w1 = distLeft > distRight ? newWidth : width - newWidth
                let w2 = distLeft > distRight ? width - newWidth : newWidth
                return [new Rectangle(x, y, w1, height), new Rectangle(x + w1, y, w2, height)]
            } else {
                let distTop = point[1] - y
                let distBottom = y + height - point[1]
                let newHeight = random(0.25, 0.75) * (distTop > distBottom ? distTop : distBottom)
                let h1 = distTop > distBottom ? newHeight : height - newHeight
                let h2 = distTop > distBottom ? height - newHeight : newHeight
                return [new Rectangle(x, y, width, h1), new Rectangle(x, y + h1, width, h2)]
            }
        }
    }

    collapse() {
        if (this.children.length === 0) return false

        while (this.children.length) {
            let child = this.children.pop()!
            this.points.push(...child.getAllPoints())
        }

        return true
    }

    getAllPoints() {
        let points: [number, number][] = []
        points.push(...this.points)
        this.children.forEach((child) => {
            points.push(...child.getAllPoints())
        })

        return points
    }

    getLeaves() {
        let leaves: Node[] = []
        if (this.children.length === 0) {
            leaves.push(this)
        } else {
            this.children.forEach((child) => {
                leaves.push(...child.getLeaves())
            })
        }

        return leaves
    }

    getAll() {
        let nodes: Node[] = []
        nodes.push(this)
        this.children.forEach((child) => {
            nodes.push(...child.getAll())
        })
        return nodes
    }

    clear() {
        this.points = []
        this.children = []
    }
}
