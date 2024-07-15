import chroma from 'chroma-js'
import { createNoise3D } from 'simplex-noise'
import { type Easing } from '~/helpers/easings'
import { Rectangle } from '~/helpers/trig-shapes'
import { random, randomBias } from '~/helpers/utils'
import { AnimNode } from './anim-node'
import { patterns } from './patterns'

export class Tree {
    node: AnimNode
    bounds: Rectangle
    gridSize: number
    lastTime = 0
    leaves: AnimNode[] = []
    noise = createNoise3D()
    currentMaxDepth = 0
    thresholdChange = 0.8
    outlines = false
    divideRule = 'quarters-grid' as AnimNode['divideRule']

    _nodeDuration = 800
    _nodeEaseEnter = 'inCubic' as Easing
    _nodeEaseLeave = 'outCubic' as Easing
    noiseVals: { [key: string]: [number, number] } = {}
    colors: { [key: string]: string } = {}

    noiseFreq1 = { x: 1.4, y: 1.4 }
    noiseFreq2 = { x: 0.64, y: 0.76 }
    noiseSpeed1 = 1.02
    noiseSpeed2 = 1.6

    noiseVarColor = 1 as 1 | 2
    noiseVarRot = 1 as 1 | 2
    noiseVarPattern = 1 as 1 | 2
    noiseVarChange = 2 as 1 | 2

    maxDepth = 5
    minDepth = 3

    palette: string[] = []
    chromaPalette: chroma.Color[] = []

    initTreeParams = {
        biasX: Math.random(),
        biasY: Math.random(),
        influence: 0.5,
        count: 150,
    }

    lastPerfUpdate = 0
    tickCalculationsAvg = 0
    tickCalculationsCount = 0
    tickCalculationsCounts: number[] = []
    leavesCounts: number[] = []
    leavesCountsAvg = 0

    minLifeSpan = 1800

    constructor({ bounds, palette }: { bounds: Rectangle; palette: string[] }) {
        this.palette = palette
        this.chromaPalette = this.palette.map((color) => chroma(color))
        this.bounds = bounds
        this.node = new AnimNode(bounds, {
            capacity: 1,
            duration: this._nodeDuration,
        })
        this.gridSize = Math.min(bounds.width, bounds.height)
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

        this.addTreePoints()
        this.refreshLeaves()

        this.leaves.forEach((leaf) => {
            leaf.data = this.getLeafData(leaf)
        })
    }

    getNewData = () => {
        this.leaves.forEach((leaf) => {
            leaf.data = this.getLeafData(leaf)
        })
    }

    addTreePoints = () => {
        for (let i = 0; i < this.initTreeParams.count; i++) {
            let x = randomBias(
                this.bounds.x,
                this.bounds.x + this.bounds.width,
                this.initTreeParams.biasX
            )
            let y = randomBias(
                this.bounds.y,
                this.bounds.y + this.bounds.height,
                this.initTreeParams.biasY
            )
            this.node.insert([x, y])
        }
        this.refreshLeaves()
    }

    getLeafData = (leaf: AnimNode) => {
        let noise = this.getNoise(leaf)
        let colorVal = noise[this.noiseVarColor - 1] * 0.5 + 0.5
        colorVal += random(0.8) + leaf.depth

        let c1 = Math.floor(colorVal) % this.palette.length
        let c2 = (c1 + 1) % this.palette.length

        let patternVal = noise[this.noiseVarPattern - 1] * 0.5 + 0.5
        let pattern = Math.floor(patterns.length * patternVal)

        return {
            color1: c1,
            color2: c2,
            pattern,
        }
    }

    divide = (leaf: AnimNode) => {
        let promise = leaf.setWillDivide()
        if (promise) {
            promise.then(() => {
                this.refreshLeaves()
            })
            return true
        }
        return false
    }

    collapse = (leaf: AnimNode) => {
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

    tick = (ms: number, ctx: CanvasRenderingContext2D) => {
        let delta = ms - this.lastTime
        this.lastTime = ms
        this.leavesCounts.push(this.leaves.length)
        this.tickCalculationsCount = 0

        this.draw(ctx)

        this.noiseVals = {}

        this.leaves.forEach((leaf) => {
            if (leaf.isBusy() || leaf.parent?.isBusy() || leaf.age < this.minLifeSpan) {
                leaf.tick(delta)
                return
            }
            let noise = this.getNoise(leaf)
            let noiseVal = noise[this.noiseVarChange - 1]

            let threshold = this.thresholdChange
            if (noiseVal > threshold && leaf.depth < this.maxDepth) {
                this.divide(leaf)
            } else if (noiseVal < -threshold && leaf.depth > this.minDepth) {
                this.collapse(leaf)
            }
            leaf.tick(delta)
        })

        this.updatePerfVals(ms)
    }

    updatePerfVals = (ms: number) => {
        this.tickCalculationsCounts.push(this.tickCalculationsCount)
        if (ms - this.lastPerfUpdate < 500) return

        this.tickCalculationsAvg =
            this.tickCalculationsCounts.reduce((acc, cur) => acc + cur, 0) /
            this.tickCalculationsCounts.length

        this.leavesCountsAvg =
            this.leavesCounts.reduce((acc, cur) => acc + cur, 0) / this.leavesCounts.length

        this.leavesCounts = []
        this.tickCalculationsCounts = []

        this.lastPerfUpdate = ms
    }

    draw = (ctx: CanvasRenderingContext2D) => {
        ctx.save()
        ctx.strokeStyle = '#121212'
        ctx.lineWidth = 3
        ctx.strokeRect(
            this.bounds.x - 1.5,
            this.bounds.y - 1.5,
            this.gridSize + 3,
            this.gridSize + 3
        )

        this.currentMaxDepth = 0
        this.leaves.forEach((leaf) => {
            this.currentMaxDepth = Math.max(this.currentMaxDepth, leaf.depth)

            let progress = leaf.progress

            if (!leaf.data) {
                leaf.data = this.getLeafData(leaf)
            }

            patterns[leaf.data.pattern](ctx, {
                bounds: leaf.bounds,
                c1: this.palette[leaf.data.color1],
                c2: this.palette[leaf.data.color2],
                progress,
            })

            if (this.outlines) {
                ctx.strokeStyle = '#fff'
                ctx.lineWidth = 2
                ctx.strokeRect(leaf.bounds.x, leaf.bounds.y, leaf.bounds.width, leaf.bounds.height)
            }
        })

        ctx.restore()
    }

    getNoise = (leaf: AnimNode): [number, number] => {
        let cx = Math.round(leaf.bounds.x + leaf.bounds.width / 2)
        let cy = Math.round(leaf.bounds.y + leaf.bounds.height / 2)

        let f1x = this.noiseFreq1.x / 1000
        let f1y = this.noiseFreq1.y / 1000
        let f2x = this.noiseFreq2.x / 1000
        let f2y = this.noiseFreq2.y / 1000
        let speed1 = this.noiseSpeed1 / 1000
        let speed2 = this.noiseSpeed2 / 1000

        let key = `${cx}-${cy}`
        if (!(key in this.noiseVals)) {
            this.tickCalculationsCount++
            this.noiseVals[key] = [
                this.noise(cx * f1x, cy * f1y, this.lastTime * speed1),
                this.noise(cx * f2x, cy * f2y, this.lastTime * speed2),
            ]
        }

        return this.noiseVals[key]
    }

    refreshLeaves = () => {
        this.leaves = this.node.getLeaves()
    }
}
