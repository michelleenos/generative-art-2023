import { createNoise3D } from 'simplex-noise'
import { type Easing } from '~/helpers/easings'
import { Rectangle } from '~/helpers/trig-shapes'
import { random, randomBias } from '~/helpers/utils'
import { AnimNode } from './anim-node'
import { DivideRectRule } from './divide-rect'

export type TreeOptions = {
    bounds: Rectangle
    nodeDuration?: number
    nodeEaseEnter?: Easing
    nodeEaseLeave?: Easing
    divideRule?: DivideRectRule
    maxDepth?: number
    minDepth?: number
    thresholdChange?: number
    minLifeSpan?: number
    delayFn?: (index: number, count: number) => number
    noiseOptions?: Partial<NoiseOptions>
}

export type NoiseOptions = {
    key: string
    freq: { x: number; y: number } | number
    speed: number
}

export class Tree<D = {}> {
    node: AnimNode<D>
    bounds: Rectangle
    lastTime = 0
    leaves: AnimNode<D>[] = []
    noise = createNoise3D()
    thresholdChange = 0.8
    divideRule = 'quarters-grid' as AnimNode<D>['divideRule']

    _nodeDuration = 800
    _nodeEaseEnter = 'inCubic' as Easing
    _nodeEaseLeave = 'outCubic' as Easing
    noiseVals: { [key: string]: number } = {}

    noiseOptions: NoiseOptions

    maxDepth = 5
    minDepth = 3

    minLifeSpan = 1800

    constructor({ bounds, ...options }: TreeOptions) {
        this.bounds = bounds

        this.noiseOptions = {
            key: 'default',
            freq: 0.64,
            speed: 1.2,
            ...(options.noiseOptions || {}),
        }

        if (options.nodeDuration) this._nodeDuration = options.nodeDuration
        if (options.nodeEaseEnter) this._nodeEaseEnter = options.nodeEaseEnter
        if (options.nodeEaseLeave) this._nodeEaseLeave = options.nodeEaseLeave
        if (options.divideRule) this.divideRule = options.divideRule
        if (options.maxDepth) this.maxDepth = options.maxDepth
        if (options.minDepth) this.minDepth = options.minDepth
        if (options.thresholdChange) this.thresholdChange = options.thresholdChange
        if (options.minLifeSpan) this.minLifeSpan = options.minLifeSpan

        this.node = new AnimNode(bounds, {
            capacity: 1,
            duration: this._nodeDuration,
            delayFn: options.delayFn,
        })
    }

    set nodeDuration(duration: number) {
        this._nodeDuration = duration
        this.node.getAll().forEach((node) => (node.duration = duration))
    }

    get nodeDuration() {
        return this._nodeDuration
    }

    get nodeEaseLeave() {
        return this._nodeEaseLeave
    }

    get nodeEaseEnter() {
        return this._nodeEaseEnter
    }

    set nodeEaseEnter(ease: Easing) {
        this._nodeEaseEnter = ease
        this.node.getAll().forEach((node) => (node.easeEnter = ease))
    }

    set nodeEaseLeave(ease: Easing) {
        this._nodeEaseLeave = ease
        this.node.getAll().forEach((node) => (node.easeLeave = ease))
    }

    initTree = () => {
        this.node.clear()
        this.node.divideRule = this.divideRule

        let bounds = this.bounds
        let biasX = random(bounds.x, bounds.x + bounds.width)
        let biasY = random(bounds.y, bounds.y + bounds.height)

        let leaves = this.node.getLeaves()
        let minDepth = Math.min(...leaves.map((leaf) => leaf.depth))

        while (minDepth < this.minDepth) {
            let leafX = randomBias(bounds.x, bounds.x + bounds.width, biasX)
            let leafY = randomBias(bounds.y, bounds.y + bounds.height, biasY)
            let leaf = this.node.findNode(leafX, leafY)
            if (leaf && leaf.depth < this.maxDepth) {
                leaf.divide()
            }

            leaves = this.node.getLeaves()
            minDepth = Math.min(...leaves.map((leaf) => leaf.depth))
        }

        this.refreshLeaves()
    }

    divide = (leaf: AnimNode<D>) => {
        let promise = leaf.setWillDivide()
        if (promise) {
            promise.then(() => {
                this.refreshLeaves()
            })
            return true
        }
        return false
    }

    collapse = (leaf: AnimNode<D>) => {
        let parent = leaf.parent
        let promise = parent?.setWillCollapse()
        if (promise) {
            promise.then(() => {
                this.refreshLeaves()
            })

            return true
        }
        return false
    }

    tick(ms: number, ctx: CanvasRenderingContext2D) {
        let delta = ms - this.lastTime
        this.lastTime = ms

        this.draw(ctx)

        this.noiseVals = {}

        this.leaves.forEach((leaf) => {
            if (leaf.isBusy() || leaf.parent?.isBusy() || leaf.age < this.minLifeSpan) {
                leaf.tick(delta)
                return
            }
            let noise = this.getNoise(leaf, this.noiseOptions)

            let threshold = this.thresholdChange
            if (noise > threshold && leaf.depth < this.maxDepth) {
                this.divide(leaf)
            } else if (noise < -threshold && leaf.depth > this.minDepth) {
                this.collapse(leaf)
            }
            leaf.tick(delta)
        })
    }

    draw = (ctx: CanvasRenderingContext2D) => {
        ctx.save()
        this.leaves.forEach((leaf) => {
            let progress = leaf.progress
            ctx.fillStyle = `rgba(0, 0, 0, ${progress})`
            ctx.fillRect(leaf.bounds.x, leaf.bounds.y, leaf.bounds.width, leaf.bounds.height)
        })
        ctx.restore()
    }

    getNoise(leaf: AnimNode<D>, options = this.noiseOptions): number {
        let cx = Math.round(leaf.bounds.x + leaf.bounds.width / 2)
        let cy = Math.round(leaf.bounds.y + leaf.bounds.height / 2)
        let key = `${options.key}-${cx}-${cy}`
        if (!(key in this.noiseVals)) {
            this.noiseVals[key] = this.calculateNoise(cx, cy, options)
        }

        return this.noiseVals[key]
    }

    calculateNoise(cx: number, cy: number, { freq, speed }: NoiseOptions): number {
        let fx = (typeof freq === 'number' ? freq : freq.x) * 0.001
        let fy = (typeof freq === 'number' ? freq : freq.y) * 0.001
        let speedVal = speed * 0.001

        return this.noise(cx * fx, cy * fy, this.lastTime * speedVal)
    }

    refreshLeaves = () => {
        this.leaves = this.node.getLeaves()
    }
}
