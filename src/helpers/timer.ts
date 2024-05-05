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

    constructor({ duration, easing, dir }: TimerOpts = {}) {
        this.duration = duration || this.duration
        this.easing = easing || this.easing
        this.dir = dir || this.dir
    }

    tick(delta: number) {
        this.delta = delta
        if (this.dir === 1) {
            this.linearProgress = Math.min(1, this.linearProgress + this.delta / this.duration)
        } else {
            this.linearProgress = Math.max(0, this.linearProgress - this.delta / this.duration)
        }
        this.progress = easing[this.easing](this.linearProgress)
        this.round()
    }

    round() {
        this.progress = round(this.progress, 5)
    }

    reset() {
        this.linearProgress = 0
        this.progress = 0
    }

    reverse(from?: number) {
        this.dir = -1
        if (from !== undefined) {
            this.linearProgress = from
        }
    }

    restart() {
        this.linearProgress = 0
        this.dir = 1
    }

    complete() {
        this.linearProgress = 1
        this.progress = 1
    }
}
