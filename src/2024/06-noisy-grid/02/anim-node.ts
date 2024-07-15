import { Timer } from '~/helpers/timer-promise'
import { Rectangle } from '~/helpers/trig-shapes'
import { Node, type NodeOptions } from './node'
import { type Easing } from '~/helpers/easings'

export type AnimNodeOptions = NodeOptions & {
    duration?: number
    parent?: AnimNode | null
    ageOffset?: number
    ageOffsetRange?: number
    easeEnter?: Easing
    easeLeave?: Easing
}

export class AnimNode extends Node {
    declare getLeaves: () => AnimNode[]
    declare getAll: () => AnimNode[]
    children: AnimNode[] = []
    parent: AnimNode | null
    points: [number, number][] = []
    state: 'entering' | 'willDivide' | 'willCollapse' | 'parentWillCollapse' | 'idle' = 'entering'
    birthday = Date.now()
    _duration: number
    // ageOffset: number = 0
    timer: Timer
    _easeLeave: Easing = 'inOutQuad'
    _easeEnter: Easing = 'inOutQuad'

    data?: {
        color1: number
        color2: number
        pattern: number
    }

    constructor(
        bounds: Rectangle,
        {
            capacity = 4,
            depth = 0,
            parent = null,
            duration = 500,
            divideRule = 'random',
            easeEnter = 'inOutQuad',
            easeLeave = 'inOutQuad',
        }: AnimNodeOptions = {}
    ) {
        super(bounds, { capacity, depth, divideRule })
        this.parent = parent
        this._duration = duration
        this._easeEnter = easeEnter
        this._easeLeave = easeLeave

        this.timer = new Timer({ duration: this._duration, easing: this._easeEnter })
    }

    get duration() {
        return this._duration
    }

    set duration(duration: number) {
        this._duration = duration
        this.timer.duration = duration
    }

    get progress() {
        if (this.state === 'idle') return 1
        if (this.state === 'entering') return this.timer.progress
        return 1 - this.timer.progress
    }

    get age() {
        return Date.now() - this.birthday
    }

    get easeLeave() {
        return this._easeLeave
    }

    get easeEnter() {
        return this._easeEnter
    }

    set easeLeave(ease: Easing) {
        this._easeLeave = ease
        if (
            this.state === 'willCollapse' ||
            this.state === 'parentWillCollapse' ||
            this.state === 'willDivide'
        ) {
            this.timer.easing = ease
        }
    }

    set easeEnter(ease: Easing) {
        this._easeEnter = ease
        if (this.state === 'entering') {
            this.timer.easing = ease
        }
    }

    beIdle() {
        this.state = 'idle'
        this.timer.complete()
    }

    tick(delta: number) {
        this.timer.tick(delta)

        if (this.state === 'entering' && this.timer.progress === 1) {
            this.state = 'idle'
        } else if (this.state === 'willDivide' && this.timer.progress === 1) {
            this.divide()
        } else if (this.state === 'willCollapse' && this.timer.progress === 1) {
            this.collapse()
        }
    }

    divide() {
        let rects = this.divideRect()
        if (!rects) return false
        this.children = rects.map((rect, i) => {
            return new AnimNode(rect, {
                capacity: this.capacity,
                depth: this.depth + 1,
                parent: this,
                duration: this._duration,
                divideRule: this.divideRule,
                // ageOffset: random(0, -this.ageOffsetRange),
                // ageOffsetRange: this.ageOffsetRange,
            })
        })
        this.beIdle()
        return true
    }

    collapse() {
        let collapsed = super.collapse()
        if (collapsed) {
            this.state = 'entering'
            this.timer.restart()
            this.birthday = Date.now()
        }
        return collapsed
    }

    isBusy() {
        return this.state !== 'idle'
    }

    setWillDivide() {
        if (this.isBusy() || this.children.length > 0) return false
        this.state = 'willDivide'
        this.timer.easing = this.easeLeave
        return this.timer.restart()
    }

    setWillCollapse() {
        if (this.isBusy()) {
            return false
        }

        if (this.children.length === 0) {
            this.timer = new Timer({ duration: this._duration })
            this.timer.easing = this.easeLeave
            this.state = 'parentWillCollapse'
            return this.timer.promise
        }

        let leaves = this.getLeaves()
        let canCollapse = !leaves.some((leaf) => leaf.state !== 'idle')
        if (!canCollapse) return false

        let promises: Promise<void>[] = []
        for (let i = 0; i < leaves.length; i++) {
            let leaf = leaves[i]
            let leafPromise = leaf.setWillCollapse()
            if (!leafPromise) return false
            promises.push(leafPromise)
        }

        this.state = 'willCollapse'
        return Promise.all(promises).then(() => {
            this.collapse()
        })
    }
}
