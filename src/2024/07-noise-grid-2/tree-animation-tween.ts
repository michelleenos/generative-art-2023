import { createNoise3D } from 'simplex-noise'
import { Rectangle } from '~/helpers/trig-shapes'
import { random, randomBias } from '~/helpers/utils'
import { AnimNodeTween } from './anim-node-tween'
import { DivideRectRule } from './divide-rect'

export type TreeOptions = {
    bounds: Rectangle
    nodeDurationIn?: number
    nodeDurationOut?: number
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

export class Tree<D extends {}> {
    node: AnimNodeTween<D>
    bounds: Rectangle
    lastTime = 0
    leaves: AnimNodeTween<D>[] = []
    noise = createNoise3D()
    thresholdChange = 0.8
    divideRule = 'quarters-grid' as AnimNodeTween['divideRule']
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

        // if (options.nodeEaseEnter) this._nodeEaseEnter = options.nodeEaseEnter
        // if (options.nodeEaseLeave) this._nodeEaseLeave = options.nodeEaseLeave
        if (options.divideRule) this.divideRule = options.divideRule
        if (options.maxDepth) this.maxDepth = options.maxDepth
        if (options.minDepth) this.minDepth = options.minDepth
        if (options.thresholdChange) this.thresholdChange = options.thresholdChange
        if (options.minLifeSpan) this.minLifeSpan = options.minLifeSpan

        this.node = new AnimNodeTween<D>(bounds, {
            capacity: 1,
            durationIn: options.nodeDurationIn,
            durationOut: options.nodeDurationOut,
            // easeEnter: options.nodeEaseEnter,
            // easeLeave: options.nodeEaseLeave,
        })
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

    divide = (leaf: AnimNodeTween<D>) => {
        console.log('divide')
        let promise = leaf.setWillDivide(this.node.durationIn * 0.25)
        if (promise) {
            promise.then(() => {
                this.refreshLeaves()
            })
            return true
        }
        return false
    }

    collapse = (leaf: AnimNodeTween<D>) => {
        let parent = leaf.parent
        let promise = parent?.setWillCollapse(this.node.durationOut * 0.25)
        if (promise) {
            promise.then(() => {
                this.refreshLeaves()
            })

            return true
        }
        return false
    }

    tick(ms: number, ctx: CanvasRenderingContext2D) {
        this.lastTime = ms
        this.draw(ctx)

        this.noiseVals = {}

        this.leaves.forEach((leaf) => {
            if (leaf.isBusy() || leaf.parent?.isBusy() || leaf.age < this.minLifeSpan) {
                leaf.tick(ms)
                return
            }
            let noise = this.getNoise(leaf, this.noiseOptions)
            let threshold = this.thresholdChange
            if (noise > threshold && leaf.depth < this.maxDepth) {
                this.divide(leaf)
            } else if (noise < -threshold && leaf.depth > this.minDepth) {
                this.collapse(leaf)
            }
            leaf.tick(ms)
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

    getNoise(leaf: AnimNodeTween<D>, options = this.noiseOptions): number {
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
