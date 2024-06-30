import { Timer } from '~/helpers/timer'
import { Rectangle } from '~/helpers/trig-shapes'
import { random } from '~/helpers/utils'

export class AnimatedTree {
    bounds: Rectangle
    capacity: number
    depth: number
    children: AnimatedTree[] = []
    points: [number, number][] = []
    parent: AnimatedTree | null = null
    willDivide = false
    willCollapse = false
    entering = true
    timer: Timer | null = new Timer({ duration: 1200 })

    constructor(bounds: Rectangle, capacity = 4, depth = 0, parent: AnimatedTree | null = null) {
        this.bounds = bounds
        this.depth = depth
        this.capacity = capacity
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
            this.divideAt(point)
        }

        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].insert(point)) {
                return true
            }
        }

        return false
    }

    divideAt(point: [number, number]) {
        let { x, y, width, height } = this.bounds

        if (width > height) {
            // vertical
            let pointX = point[0]
            let distLeft = pointX - x
            let distRight = x + width - pointX

            let newWidth = random(0.25, 0.75) * (distLeft > distRight ? distLeft : distRight)
            let leftWidth = distLeft > distRight ? newWidth : width - newWidth
            let rightWidth = distLeft > distRight ? width - newWidth : newWidth
            this.children.push(
                new AnimatedTree(
                    new Rectangle(x, y, leftWidth, height),
                    this.capacity,
                    this.depth + 1,
                    this
                ),
                new AnimatedTree(
                    new Rectangle(x + leftWidth, y, rightWidth, height),
                    this.capacity,
                    this.depth + 1,
                    this
                )
            )
        } else {
            let pointY = point[1]
            let distTop = pointY - y
            let distBottom = y + height - pointY

            let newHeight = random(0.25, 0.75) * (distTop > distBottom ? distTop : distBottom)
            let topHeight = distTop > distBottom ? newHeight : height - newHeight
            let bottomHeight = distTop > distBottom ? height - newHeight : newHeight

            this.children.push(
                new AnimatedTree(
                    new Rectangle(x, y, width, topHeight),
                    this.capacity,
                    this.depth + 1,
                    this
                ),
                new AnimatedTree(
                    new Rectangle(x, y + topHeight, width, bottomHeight),
                    this.capacity,
                    this.depth + 1,
                    this
                )
            )
        }
    }

    subdivide(point?: [number, number]) {
        if (!point) {
            point = [
                random(this.bounds.x, this.bounds.x + this.bounds.width),
                random(this.bounds.y, this.bounds.y + this.bounds.height),
            ]
        }
        this.divideAt(point)
    }

    tick(delta: number) {
        if (this.timer) {
            this.timer.tick(delta)
            if (this.timer.progress === 1) {
                if (this.entering) {
                    this.timer = null
                    this.entering = false
                } else if (this.willDivide) {
                    this.subdivide()
                    this.willDivide = false
                    this.timer = null
                } else if (this.willCollapse) {
                    this.collapse()
                    this.willCollapse = false
                    this.timer = null
                }
            }
        }
        this.children.forEach((child) => child.tick(delta))
    }

    getAllPoints() {
        let points: [number, number][] = []
        points.push(...this.points)
        this.children.forEach((child) => {
            points.push(...child.getAllPoints())
        })

        return points
    }

    collapse() {
        if (this.children.length === 0) return

        while (this.children.length) {
            let child = this.children.pop()!
            this.points.push(...child.getAllPoints())
        }
    }

    getLeaves() {
        let children: AnimatedTree[] = []
        this.children.forEach((child) => {
            children.push(...child.getLeaves())
        })

        if (children.length === 0) {
            return [this]
        }

        return children
    }

    getAllNodes() {
        let children: AnimatedTree[] = [...this.children]
        this.children.forEach((child) => {
            children.push(...child.getAllNodes())
        })

        return children
    }

    clear() {
        this.points = []
        this.children = []
    }

    isBusy() {
        return this.timer !== null
    }

    setWillDivide() {
        if (this.isBusy()) return
        if (this.children.length > 0) return
        this.willDivide = true
        this.willCollapse = false
        this.timer = new Timer({ duration: 1200 })
    }

    setWillCollapse(isChild = false) {
        if (!isChild && this.children.length === 0) return
        this.willDivide = false
        this.willCollapse = true
        this.entering = false

        this.timer = new Timer({ duration: 1200 })

        this.children.forEach((child) => {
            child.setWillCollapse(true)
        })
    }
}
