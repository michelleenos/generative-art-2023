import { Easing, Group, Tween } from '@tweenjs/tween.js'
import { Rectangle } from '~/helpers/trig-shapes'
import { Node, type NodeOptions } from './node'

export type AnimNodeOptions<D> = NodeOptions & {
    durationIn?: number
    durationOut?: number
    parent?: AnimNodeTween<D> | null
    delayEnter?: number
}

export class AnimNodeTween<D = {}> extends Node {
    declare getLeaves: () => AnimNodeTween<D>[]
    declare getAll: () => AnimNodeTween<D>[]
    children: AnimNodeTween<D>[] = []
    parent: AnimNodeTween<D> | null
    state: 'entering' | 'willDivide' | 'willCollapse' | 'parentWillCollapse' | 'idle' = 'entering'
    birthday = Date.now()
    _progress = 0
    _durationIn: number
    _durationOut: number
    tweenEnter: Tween<AnimNodeTween<D>>
    tweenLeave: Tween<AnimNodeTween<D>>
    tweenGroup: Group
    data?: D

    constructor(
        bounds: Rectangle,
        {
            capacity = 4,
            depth = 0,
            parent = null,
            durationIn = 500,
            durationOut = 500,
            // easeEnter = 'inCubic',
            // easeLeave = 'outCubic',
            divideRule,
            delayEnter,
        }: AnimNodeOptions<D> = {}
    ) {
        super(bounds, { capacity, depth, divideRule })
        this.parent = parent
        this.tweenEnter = new Tween(this).to({ _progress: 1 }, durationIn)
        this.tweenEnter.easing(Easing.Cubic.Out)
        this.tweenEnter.onComplete(() => {
            this.state = 'idle'
            this.birthday = Date.now()
        })

        this._durationIn = durationIn
        this._durationOut = durationOut

        this.tweenLeave = new Tween(this).to({ _progress: 0 }, durationOut)
        this.tweenLeave.easing(Easing.Cubic.In)
        this.tweenGroup = new Group(this.tweenEnter, this.tweenLeave)
        if (delayEnter) this.tweenEnter.delay(delayEnter)
        this.tweenEnter.start()
    }

    get progress() {
        return this._progress
    }

    get age() {
        return Date.now() - this.birthday
    }

    set durationIn(val: number) {
        this._durationIn = val
        this.tweenEnter.duration(val)
        this.children.forEach((node) => (node.durationIn = val))
    }

    get durationIn() {
        return this._durationIn
    }

    get durationOut() {
        return this._durationOut
    }

    set durationOut(val: number) {
        this._durationOut = val
        this.tweenLeave.duration(val)
        this.getAll().forEach((node) => (node.durationOut = val))
    }

    tick(time: number) {
        this.tweenGroup.update(time)
    }

    divide(delayStep?: number) {
        let rects = this.divideRect()
        if (!rects) return false
        this.children = rects.map((rect, i) => {
            let newNode = new AnimNodeTween(rect, {
                capacity: this.capacity,
                depth: this.depth + 1,
                parent: this,
                durationIn: this.durationIn,
                durationOut: this.durationOut,
                divideRule: this.divideRule,
                delayEnter: delayStep && delayStep * i,
            })

            return newNode
        })
        this.tweenEnter.end()
        return true
    }

    collapse() {
        let collapsed = super.collapse()
        if (collapsed) {
            this.state = 'entering'
            this.tweenEnter.start()
        }
        return collapsed
    }

    isBusy() {
        return this.state !== 'idle'
    }

    setWillDivide(delayStep?: number) {
        if (this.isBusy() || this.children.length > 0) return false
        this.state = 'willDivide'
        this.tweenLeave.start()
        return new Promise<void>((resolve) => {
            this.tweenLeave.onComplete(() => {
                this.divide(delayStep)
                this.state = 'idle'
                resolve()
            })
        })
    }

    setWillCollapse(delay?: number) {
        if (this.isBusy()) return false

        if (this.children.length === 0) {
            this.state = 'parentWillCollapse'
            if (delay) this.tweenLeave.delay(delay)

            this.tweenLeave.start()
            return new Promise<void>((resolve) => {
                this.tweenLeave.onComplete(() => {
                    resolve()
                })
            })
        }

        let leaves = this.getLeaves()
        let canCollapse = !leaves.some((leaf) => leaf.state !== 'idle')
        if (!canCollapse) return false

        let promises: Promise<void>[] = []
        for (let i = 0; i < leaves.length; i++) {
            let leaf = leaves[i]
            let leafPromise = leaf.setWillCollapse(delay && delay * i)
            if (!leafPromise) return false
            promises.push(leafPromise)
        }

        this.state = 'willCollapse'
        return Promise.all(promises).then(() => {
            this._progress = 0
            this.collapse()
        })
    }
}
