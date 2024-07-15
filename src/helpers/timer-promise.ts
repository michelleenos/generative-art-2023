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
    resolver!: () => void
    promise!: Promise<void>

    constructor({ duration, easing, dir }: TimerOpts = {}) {
        this.duration = duration || this.duration
        this.easing = easing || this.easing
        this.dir = dir || this.dir

        this.getPromise()
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

        if (this.linearProgress >= 1 || this.linearProgress <= 0) {
            this.resolve()
        }
    }

    resolve() {
        this.resolver()
    }

    round() {
        this.progress = round(this.progress, 5)
    }

    reverse(from?: number) {
        this.dir = -1
        if (from !== undefined) {
            this.linearProgress = from
        }
        return this.getPromise()
    }

    restart() {
        this.linearProgress = 0
        this.progress = 0
        this.dir = 1
        return this.getPromise()
    }

    reset() {
        return this.restart()
    }

    complete() {
        this.linearProgress = 1
        this.progress = 1
        this.resolve()
    }

    setProgress(p: number) {
        this.linearProgress = p
        this.progress = easing[this.easing](this.linearProgress)
    }

    getPromise() {
        let newResolve: () => void
        let promise = new Promise<void>((resolve) => {
            newResolve = resolve
        })

        this.promise = promise
        this.resolver = newResolve!

        return promise
    }
}
