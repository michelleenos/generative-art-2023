import { type Easing, easing } from './easings'
import { round } from './utils'

export type TimerOpts = {
    duration?: number
    easing?: Easing
    dir?: 1 | -1
}

export class Timer {
    delta: number = 0
    easing: Easing = 'linear'
    progress: number = 0
    linearProgress: number = 0
    duration: number = 1000
    dir: 1 | -1 = 1
    timerDelay: Timer | null = null
    _onComplete?: () => void
    isComplete = false

    constructor({ duration, easing, dir }: TimerOpts = {}) {
        this.duration = duration || this.duration
        this.easing = easing || this.easing
        this.dir = dir || this.dir

        return this
    }

    tick(delta: number) {
        if (this.isComplete) return
        if (this.timerDelay) {
            this.timerDelay.tick(delta)
            return
        }
        this.delta = delta
        if (this.dir === 1) {
            this.linearProgress = Math.min(1, this.linearProgress + this.delta / this.duration)
            if (this.linearProgress === 1) {
                this.complete()
            }
        } else {
            this.linearProgress = Math.max(0, this.linearProgress - this.delta / this.duration)
            if (this.linearProgress === 0) {
                this.completeReverse()
            }
        }
        // this.progress = easing[this.easing](this.linearProgress)
        this.progress = this.easing ? easing[this.easing](this.linearProgress) : this.linearProgress
        this.round()
    }

    onComplete(cb: () => void) {
        this._onComplete = cb
        return this
    }

    delay(time: number) {
        if (time <= 0) return this
        this.timerDelay = new Timer({ duration: time }).onComplete(() => {
            this.timerDelay = null
        })

        return this
    }

    round() {
        this.progress = round(this.progress, 5)
    }

    reset() {
        this.linearProgress = 0
        this.progress = 0
        this.isComplete = false
        return this
    }

    reverse(from?: number) {
        this.dir = -1
        if (from !== undefined) {
            this.linearProgress = from
            this.progress = this.easing
                ? easing[this.easing](this.linearProgress)
                : this.linearProgress
        }
        return this
    }

    restart() {
        this.linearProgress = 0
        this.dir = 1
        this.isComplete = false
        return this
    }

    completeReverse() {
        this.linearProgress = 0
        this.progress = 0
        this.isComplete = true
        if (this._onComplete) this._onComplete()
        return this
    }

    complete() {
        this.linearProgress = 1
        this.progress = 1
        this.isComplete = true
        if (this._onComplete) this._onComplete()
        return this
    }

    setProgress(p: number) {
        this.linearProgress = p
        // this.progress = easing[this.easing](this.linearProgress)
        this.progress = this.easing ? easing[this.easing](this.linearProgress) : this.linearProgress
        this.round()
    }
}
