import { NoiseOptions, Tree } from './tree-animation'

export class TreePerf<D extends {}> extends Tree<D> {
    lastPerfUpdate = 0
    tickCalculationsAvg = 0
    tickCalculationsCount = 0
    tickCalculationsCounts: number[] = []
    leavesCounts: number[] = []
    leavesCountsAvg = 0

    constructor(params: ConstructorParameters<typeof Tree>[0]) {
        super(params)
    }

    tick = (ms: number, ctx: CanvasRenderingContext2D) => {
        this.leavesCounts.push(this.leaves.length)
        this.tickCalculationsCount = 0
        super.tick(ms, ctx)

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

    calculateNoise(x: number, y: number, opts: NoiseOptions) {
        this.tickCalculationsCount++
        return super.calculateNoise(x, y, opts)
    }
}
