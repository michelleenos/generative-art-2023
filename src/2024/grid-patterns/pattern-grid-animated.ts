import { Easing } from '~/helpers/easings'
import { Timer } from '~/helpers/timer'
import { createPatternCell, orderCells, pointToIndex, type CellsOrder } from './grid-stuff'
import { BasePattern, type BasePatternOpts } from './pattern-grid-base'
import { random } from '~/helpers/utils'
import { type PatternCell } from './cells/pattern-cell'

type PatternOpts = BasePatternOpts & {
    addPerSecond?: number
    cellDuration?: number
    cellEase?: Easing
    addEase?: Easing
    inOutWait?: number
    order?: 'random' | 'linear-x' | 'linear-y' | 'circle' | 'diag-tr' | 'diag-tl'
    animation?: 'enter' | 'leave' | 'loop' | false
}

export class AnimatedPattern extends BasePattern {
    _animation: 'enter' | 'leave' | 'loop' | false = 'loop'
    _addPerSecond: number = 10
    _cellDuration: number = 800
    _cellDurationLines: number = 800
    _cellEase: Easing = 'outQuad'
    _addDuration: number = 0

    order: CellsOrder = 'random'
    inOutWait: number = 1000

    _steps: {
        lastAdd: number
        lastLeave: number
        shouldEnter: boolean
        shouldLeave: boolean
        shouldWait: boolean
    } = { lastAdd: -1, lastLeave: -1, shouldEnter: false, shouldLeave: false, shouldWait: false }

    delta: number = 0
    timer: Timer

    debug: boolean = false

    constructor(opts: PatternOpts) {
        super(opts)

        if (opts.addPerSecond) this.addPerSecond = opts.addPerSecond
        if (opts.cellDuration) this.cellDuration = opts.cellDuration
        if (opts.cellEase) this.cellEase = opts.cellEase
        if (opts.inOutWait) this.inOutWait = opts.inOutWait
        if (opts.animation) this._animation = opts.animation
        if (opts.order) this.order = opts.order

        this.timer = new Timer({ easing: opts.addEase })
        this.setShouldStep()
    }

    setShouldStep = () => {
        let steps = this._steps
        if (this._animation === 'enter') {
            steps.shouldEnter = true
            steps.shouldLeave = false
        } else if (this._animation === 'leave') {
            steps.shouldLeave = true
            steps.shouldEnter = false
        } else if (this._animation === 'loop') {
            steps.shouldEnter = true
            steps.shouldLeave = false
        }
    }

    get addDuration() {
        return this._addDuration
    }

    get animation() {
        return this._animation
    }

    get addPerSecond() {
        return this._addPerSecond
    }

    set addPerSecond(add: number) {
        this._addPerSecond = add
        this._addDuration = (this.cells.length / this._addPerSecond) * 1000
    }

    set cellDuration(d: number) {
        this._cellDuration = d
        this.cells.forEach((cell) => {
            if (!cell.style.toLowerCase().includes('lines')) {
                cell.duration = d
            }
        })
    }

    get cellDuration() {
        return this._cellDuration
    }

    get cellDurationLines() {
        return this._cellDurationLines
    }

    set cellDurationLines(d: number) {
        this._cellDurationLines = d
        this.cells.forEach((cell) => {
            if (cell.style.toLowerCase().includes('lines')) {
                cell.duration = d
            }
        })
    }

    set cellEase(e: Easing) {
        this._cellEase = e
        this.cells.forEach((cell) => (cell.timer.easing = e))
    }

    get cellEase() {
        return this._cellEase
    }

    get addEase() {
        return this.timer.easing
    }

    set addEase(ease: Easing) {
        this.timer.easing = ease
    }

    create() {
        super.create({ easing: this.cellEase, duration: this.cellDuration })

        this._addDuration = (this.cells.length / this._addPerSecond) * 1000
        this.timer.duration = this._addDuration

        let { map, cells } = orderCells(this.cells, this.order, this.sides)
        this.map = map
        this.cells = cells
    }

    enter() {
        this._animation = 'enter'
        this.reset()
    }

    leave() {
        this._animation = 'leave'
        this.reset(false)
    }

    reset(start = true) {
        if (start) {
            this.cells.forEach((cell) => cell.reset())
            this._steps.lastAdd = -1
            this.timer.reset()
            this.timer.duration = this.addDuration
        } else {
            this.cells.forEach((cell) => cell.complete())
            this.timer.reverse(1)
            this.timer.duration = this.addDuration
        }

        this._steps.lastLeave = -1
        this.delta = 0
        this.setShouldStep()
    }

    leaveStep() {
        let leaveIndex = Math.round(this.timer.progress * (this.cells.length - 1))
        let steps = this._steps

        if (leaveIndex > steps.lastLeave && leaveIndex < this.cells.length) {
            let leaving = steps.lastLeave + 1
            while (leaving <= leaveIndex) {
                let cell = this.cells[leaving]
                if (cell.stage !== 'show') {
                    break
                }

                cell.reverse()
                leaving++
            }

            this.setLastLeaveIndex(leaving - 1)
        }
    }

    enterStep() {
        let addIndex = Math.round(this.timer.progress * (this.cells.length - 1))

        let steps = this._steps
        if (addIndex > steps.lastAdd && addIndex < this.cells.length) {
            let adding = steps.lastAdd + 1
            while (adding <= addIndex) {
                let cell = this.cells[adding]
                if (cell.stage !== 'none') {
                    break
                }
                cell.start()
                adding++
            }
            this.setLastAddIndex(adding - 1)
        }
    }

    waitStep() {
        if (this.timer.progress >= 1) {
            if (this._steps.lastAdd >= this.cells.length - 1) {
                this._steps.shouldLeave = true
                this._steps.lastAdd = -1
            } else {
                this._steps.shouldEnter = true
                this._steps.lastLeave = -1
                this.create()
            }
            this.timer.duration = this.addDuration
            this.timer.reset()
            this._steps.shouldWait = false
        }
    }

    tick(delta: number) {
        this.delta = delta
        this.timer.tick(this.delta)

        if (!this._animation) return

        let steps = this._steps

        if (steps.shouldWait) this.waitStep()
        if (steps.shouldEnter) this.enterStep()
        if (steps.shouldLeave) this.leaveStep()
    }

    setLastAddIndex(index: number) {
        let steps = this._steps
        steps.lastAdd = index
        if (steps.lastAdd >= this.cells.length - 1) {
            if (this._animation === 'loop') {
                this.timer.reset()
                this.timer.duration = this.inOutWait
                steps.shouldEnter = false
                steps.shouldLeave = false
                steps.shouldWait = true
            } else {
                // this._animation = false
                steps.shouldEnter = false
            }
        }
    }

    setLastLeaveIndex(index: number) {
        let steps = this._steps
        steps.lastLeave = index
        if (steps.lastLeave >= this.cells.length - 1) {
            if (this._animation === 'loop') {
                this.timer.duration = this.inOutWait
                this.timer.reset()
                steps.shouldEnter = false
                steps.shouldLeave = false
                steps.shouldWait = true
            } else {
                steps.shouldLeave = false
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, delta?: number) {
        if (delta === undefined) {
            return super.draw(ctx)
        }
        this.tick(delta)

        ctx.fillStyle = this.bg
        ctx.fillRect(0, 0, this.size, this.size)

        let cellSize = this.size / this.sides
        for (let i = 0; i < this.cells.length; i++) {
            let cell = this.cells[i]

            if (cell.stage === 'show') {
                cell.drawStatic(ctx, cellSize)
            } else if (cell.stage === 'enter' || cell.stage === 'leave') {
                cell.tick(this.delta)
                cell.draw(ctx, cellSize)
            }

            if (this.debug) {
                ctx.font = '10px Arial'
                ctx.textAlign = 'center'
                ctx.fillStyle = 'black'
                ctx.fillText(
                    cell.stage,
                    cell.nx * cellSize + cell.w * 0.5 * cellSize,
                    cell.ny * cellSize + cell.h * 0.5 * cellSize
                )
            }
        }
    }

    newCellAtIndex(index: number) {
        let cell = this.cells[index]
        let shape: 'horiz' | 'vert' | 'square' =
            cell.w > cell.h ? 'horiz' : cell.h > cell.w ? 'vert' : 'square'

        let opts: Parameters<typeof createPatternCell>[2] = {
            squareOptions: this.squareOptions,
            rectOptions: this.rectOptions,
            easing: this.cellEase,
            duration: this.cellDuration,
            cornersPattern: this.cornerPattern,
            colors: this.fg,
            styleOpts: this.styleOpts,
        }

        let canRectX = false
        let canRectY = false
        let point = { x: cell.nx, y: cell.ny }
        let mapIndex = pointToIndex(point.x, point.y, this.sides)
        let mapIndexRight = pointToIndex(cell.nx + 1, cell.ny, this.sides)
        let cellRight = this.mapRef[mapIndexRight]

        if (
            cellRight &&
            shape === 'square' &&
            cellRight.h === cell.h &&
            cellRight.stage === 'none'
        ) {
            canRectX = true
            opts['shape'] = 'horiz'
            console.log('replacing at index', index)
            let newCell = createPatternCell(cell.nx, cell.ny, opts)
            this.cells[index] = newCell
            this.mapRef[mapIndex] = newCell
            this.mapRef[mapIndexRight] = newCell

            this.cells = this.cells.filter((cell) => {
                console.log('cell', cell)
                console.log('cellRight', cellRight)
                return cell !== cellRight
            })

            return newCell
        } else {
            opts.shape = shape
            let newCell = createPatternCell(cell.nx, cell.ny, opts)
            this.cells[index] = newCell
            this.mapRef[mapIndex] = newCell

            return newCell
        }
    }

    // newCellAtIndex(index: number) {
    //     let cell = this.cells[index]
    //     let shape: 'horiz' | 'vert' | 'square' =
    //         cell.w > cell.h ? 'horiz' : cell.h > cell.w ? 'vert' : 'square'

    //     let opts: Parameters<typeof createPatternCell>[2] = {
    //         squareOptions: this.squareOptions,
    //         rectOptions: this.rectOptions,
    //         easing: this.cellEase,
    //         duration: this.cellDuration,
    //         cornersPattern: this.cornerPattern,
    //         colors: this.fg,
    //         styleOpts: this.styleOpts,
    //         shape,
    //     }

    //     let newCell = createPatternCell(cell.nx, cell.ny, opts)
    //     this.cells[index] = newCell

    //     return newCell
    // }
}

export class AnimatedPatternRandom extends BasePattern {
    _addPerSecond: number = 10
    _cellDuration: number = 800
    _cellDurationLines: number = 800
    _cellEase: Easing = 'outQuad'
    _firstAddDuration: number = 0
    _switchInterval: number = 100
    _firstEnterDone: boolean = false
    onSwitchIn?: (cell?: PatternCell) => void
    onSwitchOut?: (cell?: PatternCell) => void
    maxOut: number = 5
    minOut: number = 2

    // needsEnter: PatternCell[] = []

    order: CellsOrder = 'random'

    delta: number = 0
    timers: {
        enter: Timer
        switchIn: Timer
        switchOut: Timer
    }

    debug: boolean = false

    constructor(opts: PatternOpts & { switchInterval?: number }) {
        super(opts)
        if (opts.switchInterval) this._switchInterval = opts.switchInterval
        if (opts.addPerSecond) this.addPerSecond = opts.addPerSecond
        if (opts.cellDuration) this.cellDuration = opts.cellDuration
        if (opts.cellEase) this.cellEase = opts.cellEase
        if (opts.order) this.order = opts.order

        this.timers = {
            enter: new Timer({ easing: this.cellEase, duration: this._firstAddDuration }),
            switchIn: new Timer({ easing: 'linear', duration: this._switchInterval * 0.5 }),
            switchOut: new Timer({ easing: 'linear', duration: this._switchInterval }),
        }
    }

    set switchInterval(interval: number) {
        this._switchInterval = interval
    }

    get switchInterval() {
        return this._switchInterval
    }

    get firstAddDuration() {
        return this._firstAddDuration
    }

    get addPerSecond() {
        return this._addPerSecond
    }

    set addPerSecond(add: number) {
        this._addPerSecond = add
        this._firstAddDuration = (this.cells.length / this._addPerSecond) * 1000
    }

    set cellDuration(d: number) {
        this._cellDuration = d
        this.cells.forEach((cell) => {
            if (!cell.style.toLowerCase().includes('lines')) {
                cell.duration = d
            }
        })
    }

    get cellDuration() {
        return this._cellDuration
    }

    get cellDurationLines() {
        return this._cellDurationLines
    }

    set cellDurationLines(d: number) {
        this._cellDurationLines = d
        this.cells.forEach((cell) => {
            if (cell.style.toLowerCase().includes('lines')) {
                cell.duration = d
            }
        })
    }

    set cellEase(e: Easing) {
        this._cellEase = e
        this.cells.forEach((cell) => (cell.timer.easing = e))
    }

    get cellEase() {
        return this._cellEase
    }

    get addEase() {
        return this.timers.enter.easing
    }

    set addEase(ease: Easing) {
        this.timers.enter.easing = ease
    }

    create() {
        super.create({ easing: this.cellEase, duration: this.cellDuration })

        this._firstAddDuration = (this.cells.length / this._addPerSecond) * 1000
        this.timers.enter.duration = this._firstAddDuration

        let { map, cells } = orderCells(this.cells, this.order, this.sides)
        this.map = map
        this.cells = cells
    }

    reset(start = true) {
        if (start) {
            this.cells.forEach((cell) => cell.reset())
            this.timers.enter.reset()
            this.timers.enter.duration = this._firstAddDuration
            this._firstEnterDone = false
        } else {
            this.cells.forEach((cell) => cell.complete())
            this.timers.enter.reverse(1)
            this.timers.enter.duration = this._firstAddDuration
        }

        this.delta = 0
    }

    tick(delta: number) {
        this.delta = delta
        // this.timer.tick(this.delta)

        if (!this._firstEnterDone) {
            let timer = this.timers.enter
            timer.tick(this.delta)
            let addIndex = Math.round(timer.progress * (this.cells.length - 1))
            for (let i = 0; i < this.cells.length; i++) {
                if (this.cells[i].stage === 'none' && i <= addIndex) {
                    this.cells[i].start()
                }
            }

            if (timer.progress >= 1) {
                this._firstEnterDone = true
            }
        } else {
            this.switchTimers(delta)
        }
    }

    switchTimers = (delta: number) => {
        let { switchIn, switchOut } = this.timers
        switchIn.tick(delta)
        switchOut.tick(delta)

        if (switchOut.progress >= 1) {
            switchOut.reset()
            switchOut.duration = random(this.switchInterval * 0.7, this.switchInterval * 2)
            let needsEnter = this.cells.filter((cell) => cell.stage === 'none')

            if (random() < 0.5 && needsEnter.length < this.maxOut) {
                let cell = random(this.cells)
                if (cell.stage === 'show') {
                    cell.reverse()
                    if (this.onSwitchOut) this.onSwitchOut(cell)
                }
            } else if (this.onSwitchOut) {
                this.onSwitchOut()
            }
        }

        if (switchIn.progress >= 0.7) {
            switchIn.reset()
            switchIn.duration = random(this.switchInterval * 0.7, this.switchInterval * 2)

            let needsEnter = this.cells.filter((cell) => cell.stage === 'none')
            if (random() < 0.5 && needsEnter.length > this.minOut) {
                let cellIndex = Math.floor(random(needsEnter.length))
                let cell = needsEnter.splice(cellIndex, 1)[0]

                cell.start()
                if (this.onSwitchIn) this.onSwitchIn(cell)
            } else if (this.onSwitchIn) {
                this.onSwitchIn()
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, delta?: number) {
        if (delta === undefined) {
            return super.draw(ctx)
        }
        this.tick(delta)

        ctx.fillStyle = this.bg
        ctx.fillRect(0, 0, this.size, this.size)

        let cellSize = this.size / this.sides

        for (let i = 0; i < this.cells.length; i++) {
            let cell = this.cells[i]

            if (cell.stage === 'show') {
                cell.drawStatic(ctx, cellSize)
            } else if (cell.stage === 'enter' || cell.stage === 'leave') {
                cell.tick(this.delta)
                cell.draw(ctx, cellSize)
            } else if (cell.stage === 'none' && cell.hasShown && cell.switchedLastFrame) {
                let newCell = this.newCellAtIndex(i)
                newCell.tick(delta)
            }

            if (this.debug) {
                ctx.font = '10px Arial'
                ctx.textAlign = 'center'
                ctx.fillStyle = 'black'
                ctx.fillText(
                    cell.stage,
                    cell.nx * cellSize + cell.w * 0.5 * cellSize,
                    cell.ny * cellSize + cell.h * 0.5 * cellSize
                )
            }
        }
    }

    newCellAtIndex(index: number) {
        let cell = this.cells[index]
        let shape: 'horiz' | 'vert' | 'square' =
            cell.w > cell.h ? 'horiz' : cell.h > cell.w ? 'vert' : 'square'

        let opts: Parameters<typeof createPatternCell>[2] = {
            squareOptions: this.squareOptions,
            rectOptions: this.rectOptions,
            easing: this.cellEase,
            duration: this.cellDuration,
            cornersPattern: this.cornerPattern,
            colors: this.fg,
            styleOpts: this.styleOpts,
        }

        let canRectX = false
        let canRectY = false
        let point = { x: cell.nx, y: cell.ny }
        let mapIndex = pointToIndex(point.x, point.y, this.sides)
        let mapIndexRight = pointToIndex(cell.nx + 1, cell.ny, this.sides)
        let cellRight = this.mapRef[mapIndexRight]

        if (
            cellRight &&
            shape === 'square' &&
            cellRight.h === cell.h &&
            cellRight.stage === 'none'
        ) {
            canRectX = true
            opts['shape'] = 'horiz'
            console.log('replacing', index)
            let oldCellRight = cellRight
            let newCell = createPatternCell(cell.nx, cell.ny, opts)
            this.cells[index] = newCell
            this.mapRef[mapIndex] = newCell
            this.mapRef[mapIndexRight] = newCell
            this.cells = this.cells.filter((cell) => cell !== oldCellRight)
            return newCell
        } else {
            opts.shape = shape
            let newCell = createPatternCell(cell.nx, cell.ny, opts)
            this.cells[index] = newCell

            return newCell
        }
    }
}
