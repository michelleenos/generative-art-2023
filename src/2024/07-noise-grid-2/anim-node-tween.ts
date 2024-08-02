import { Timer } from '~/helpers/timer-promise'
import { Rectangle } from '~/helpers/trig-shapes'
import { Node, type NodeOptions } from './node'
import easing, { type Easing } from '~/helpers/easings'
import { map } from '~/helpers/utils'

type DefaultNodeData = undefined

export type AnimNodeOptions<D = DefaultNodeData> = NodeOptions & {
    duration?: number
    parent?: AnimNodeTween<D> | null
    easeEnter?: Easing
    easeLeave?: Easing
    delayAnimate?: number
    delayFn?: (index: number, count: number) => number
}

export class AnimNodeTween<D = DefaultNodeData> extends Node {
    declare getLeaves: () => AnimNodeTween<D>[]
    declare getAll: () => AnimNodeTween<D>[]
    children: AnimNodeTween<D>[] = []
    parent: AnimNodeTween<D> | null
    points: [number, number][] = []
    state: 'entering' | 'willDivide' | 'willCollapse' | 'parentWillCollapse' | 'idle' = 'entering'
    birthday = Date.now()
    _duration: number
    timer: Timer
    _easeLeave: Easing = 'inOutQuad'
    _easeEnter: Easing = 'inOutQuad'
    delayAnimate = 0
    delayFn?: (index: number, count: number) => number
    data?: D

    constructor(
        bounds: Rectangle,
        {
            capacity = 4,
            depth = 0,
            parent = null,
            duration = 500,
            divideRule,
            easeEnter = 'inOutQuad',
            easeLeave = 'inOutQuad',
            delayAnimate = 0,
            delayFn,
        }: AnimNodeOptions<D> = {}
    ) {
        super(bounds, { capacity, depth, divideRule })
        this.parent = parent
        this._duration = duration
        this._easeEnter = easeEnter
        this._easeLeave = easeLeave

        if (delayAnimate > 0) {
            let waitAmount = this._duration * delayAnimate
            let totalDur = this._duration + waitAmount
            this.delayAnimate = delayAnimate
            this.timer = new Timer({ duration: totalDur, easing: 'linear' })
        } else {
            this.timer = new Timer({ duration: this._duration, easing: 'linear' })
        }

        if (delayFn) this.delayFn = delayFn
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
        if (this.state === 'entering') return easing[this.easeEnter](this.timer.progress)
        if (this.state === 'parentWillCollapse') {
            if (this.delayAnimate > 0) {
                let progress = this.timer.progress
                if (progress < this.delayAnimate) {
                    return 1
                } else {
                    return easing[this._easeLeave](map(progress, this.delayAnimate, 1, 1, 0))
                }
            }
        }
        return easing[this.easeLeave](1 - this.timer.progress)
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
    }

    set easeEnter(ease: Easing) {
        this._easeEnter = ease
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
            return new AnimNodeTween(rect, {
                capacity: this.capacity,
                depth: this.depth + 1,
                parent: this,
                duration: this._duration,
                divideRule: this.divideRule,
                delayAnimate: this.delayFn ? this.delayFn(i, rects.length) : 0,
                delayFn: this.delayFn,
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
        return this.timer.restart()
    }

    setWillCollapse(delayAnimate?: number) {
        if (this.isBusy()) return false

        if (this.children.length === 0) {
            if (delayAnimate && delayAnimate > 0) {
                // let offset = index * (this.duration * 0.25) + 1
                let offset = delayAnimate * this._duration
                this.state = 'parentWillCollapse'
                this.timer = new Timer({ duration: offset + this._duration })
                this.delayAnimate = offset / (this._duration + offset)
                return this.timer.promise
            } else {
                this.timer = new Timer({ duration: this._duration })
                this.state = 'parentWillCollapse'
                this.delayAnimate = 0
                return this.timer.promise
            }
        }

        let leaves = this.getLeaves()
        let canCollapse = !leaves.some((leaf) => leaf.state !== 'idle')
        if (!canCollapse) return false

        let promises: Promise<void>[] = []
        for (let i = 0; i < leaves.length; i++) {
            let leaf = leaves[i]
            let leafPromise = leaf.setWillCollapse(
                this.delayFn ? this.delayFn(i, leaves.length) : 0
            )
            if (!leafPromise) return false
            promises.push(leafPromise)
        }

        this.state = 'willCollapse'
        return Promise.all(promises).then(() => {
            this.collapse()
        })
    }
}
