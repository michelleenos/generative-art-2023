export default function loop(cb: FrameRequestCallback) {
    let id: number
    let isStopped: boolean = false
    let isLooping: boolean = true
    function animation(t: DOMHighResTimeStamp) {
        id = requestAnimationFrame(animation)
        cb(t)
    }
    id = requestAnimationFrame(animation)

    return {
        stop: () => {
            cancelAnimationFrame(id)
            isStopped = true
            isLooping = false
        },
        isLooping: () => isLooping,
        isStopped: () => isStopped,
    }
}

export class FixedFpsLoop {
    _id: number | null = null
    _fps: number
    _interval: number
    _then: number = performance.now()
    cb: FrameRequestCallback

    constructor(
        cb: FrameRequestCallback,
        { paused = false, fps = 60, listenVisibility = true } = {},
    ) {
        // super(cb, { paused })
        this.cb = cb
        this._fps = fps
        this._interval = 1000 / this._fps

        if (listenVisibility)
            document.addEventListener('visibilitychange', this._onVisibilityChange.bind(this))

        if (!paused) this.start()
    }

    get looping() {
        return this._id !== null
    }

    get fps() {
        return this._fps
    }

    set fps(val: number) {
        this._fps = val
        this._interval = 1000 / val
    }

    start() {
        if (this.looping) return
        this._then = performance.now()
        this._id = requestAnimationFrame(this._animation.bind(this))
    }

    stop() {
        if (!this._id) return
        cancelAnimationFrame(this._id)
        this._id = null
    }

    _animation() {
        this._id = requestAnimationFrame(this._animation.bind(this))
        let now = performance.now()
        let delta = now - this._then
        while (delta >= this._interval) {
            delta -= this._interval
            this._then += this._interval
            this.cb(this._then)
        }
    }

    _onVisibilityChange() {
        if (document.visibilityState === 'visible' && this.looping) {
            this._then = performance.now()
        }
    }
}
