import { Rectangle } from '~/helpers/trig-shapes'
import { DivideRectRule, divideRect } from './divide-rect'

let nodeIdCount = 0

export type NodeOptions = {
    depth?: number
    parent?: Node | null
    divideRule?: DivideRectRule
}

export class Node {
    bounds: Rectangle
    depth: number
    children: Node[] = []
    parent: Node | null = null
    nodeId = nodeIdCount++
    divideRule: DivideRectRule

    constructor(
        bounds: Rectangle,
        { depth = 0, parent = null, divideRule = 'two-random' }: NodeOptions
    ) {
        this.bounds = bounds
        this.depth = depth
        this.divideRule = divideRule
        if (parent) this.parent = parent
    }

    getMaxDepth = (): number => {
        let depths = this.children.map((child) => child.getMaxDepth())
        return Math.max(this.depth, ...depths)
    }

    divide() {
        let rects = this.divideRect()
        if (!rects) return false

        this.children = rects.map((rect) => {
            return new Node(rect, {
                depth: this.depth + 1,
                parent: this,
                divideRule: this.divideRule,
            })
        })
        return true
    }

    divideRect() {
        if (this.children.length > 0) return false
        return divideRect(this.bounds, this.divideRule)
    }

    collapse() {
        if (this.children.length === 0) return false
        this.children = []
        return true
    }

    findNode(x: number, y: number): Node | false {
        if (!this.bounds.contains(x, y)) return false
        if (this.children.length === 0) return this

        for (let i = 0; i < this.children.length; i++) {
            let child = this.children[i]
            let node = child.findNode(x, y)
            if (node) return node
        }

        return false
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
        this.children = []
    }
}
