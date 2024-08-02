import { type Easing } from '~/helpers/easings'
import { Timer } from '~/helpers/timer'

export interface PatternCellProps {
    nx: number
    ny: number
    w: number
    h: number
    color: string
    duration?: number
    easing?: Easing
}

export type CellCalculatedSizes = {
    x: number
    y: number
    w: number
    h: number
    m: number
}

export abstract class PCell {
    nx: number
    ny: number
    w: number
    h: number
    prevUnitSize: number = 0
    prevSizes: CellCalculatedSizes = { x: 0, y: 0, w: 0, h: 0, m: 0 }
    color: string
    stage: 'enter' | 'show' | 'leave' | 'none' = 'none'
    timer: Timer
    hasShown: boolean = false
    switchedLastFrame: boolean = false
    abstract draw(ctx: CanvasRenderingContext2D, unitSize: number, progress?: number): void

    constructor({ nx, ny, w, h, color, duration = 1000, easing = 'outCubic' }: PatternCellProps) {
        this.nx = nx
        this.ny = ny
        this.w = w
        this.h = h
        this.color = color

        this.timer = new Timer({
            duration,
            easing,
        })
    }

    get animating() {
        return this.stage === 'enter' || this.stage === 'leave'
    }

    get duration() {
        return this.timer.duration
    }

    set duration(d: number) {
        this.timer.duration = d
    }

    reset() {
        this.stage = 'none'
        this.hasShown = false
        this.timer.reset()
    }

    tick(delta: number) {
        this.timer.tick(delta)
        this.switchedLastFrame = false

        if (this.stage !== 'enter' && this.stage !== 'leave') return
        if (this.timer.progress >= 1 && this.stage === 'enter') {
            this.stage = 'show'
            this.hasShown = true
            this.switchedLastFrame = true
            return
        }
        if (this.stage === 'leave' && this.timer.progress <= 0) {
            this.stage = 'none'
            this.switchedLastFrame = true
            return
        }
    }

    getSizes(size: number) {
        if (size === this.prevUnitSize) return this.prevSizes
        this.prevUnitSize = size

        return (this.prevSizes = {
            x: this.nx * size,
            y: this.ny * size,
            w: this.w * size,
            h: this.h * size,
            m: Math.min(this.w, this.h) * size,
        })
    }

    start() {
        this.stage = 'enter'
        this.timer.restart()
    }

    reverse() {
        this.stage = 'leave'
        this.timer.reverse()
    }

    complete() {
        this.timer.complete()
        this.stage = 'show'
    }

    drawStatic = (ctx: CanvasRenderingContext2D, unitSize: number) => {
        this.draw(ctx, unitSize, 1)
    }
}
