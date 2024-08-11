import { random } from '~/helpers/utils'
import { Timer } from '~/helpers/timer'
import { Rectangle } from '~/helpers/trig-shapes'
import { params } from './params'

let cellCount = 0

export class Cell {
    bounds: Rectangle
    parent?: Cell
    children: Cell[]
    vals: { progress: number }
    timer: Timer | null = null
    depth: number
    birthday: number
    stage: 'in' | 'out' | 'childrenOut' | 'hidden' | 'idle'
    randomVal: number
    cellId: number
    lastTime: number = 0
    delayEnter?: number
    onDivide?: (cell: Cell) => void
    onCollapse?: (cell: Cell) => void

    constructor(bounds: Rectangle, parent?: Cell, delayEnter = 0) {
        this.bounds = bounds
        this.parent = parent
        this.stage = 'in'
        this.children = []
        this.vals = { progress: 0 }
        this.timer = null
        this.depth = parent ? parent.depth + 1 : 0
        this.birthday = -1
        this.delayEnter = delayEnter
        this.randomVal = random(-params.randomness / 2, params.randomness / 2)
        this.cellId = ++cellCount
    }

    // get age() {
    //     return this.birthday === -1 ? -1 : performance.now() - this.birthday
    // }

    get progress() {
        if (this.timer) {
            return this.timer.progress
        }
        if (this.stage === 'idle') {
            return 1
        }
        return 0
    }

    newBirthday = () => {
        this.birthday = this.lastTime
    }

    update = (ms: number) => {
        this.lastTime = ms
    }

    getAge = (ms: number) => {
        return this.birthday === -1 ? -1 : ms - this.birthday
    }

    findCell = (x: number, y: number): Cell | false => {
        if (this.bounds.contains(x, y)) {
            for (let child of this.children) {
                let found = child.findCell(x, y)
                if (found) return found
            }
            return this
        }
        return false
    }

    getLeaves = () => {
        let cells: Cell[] = []
        if (this.children.length === 0) {
            cells.push(this)
        } else {
            for (let child of this.children) {
                cells.push(...child.getLeaves())
            }
        }
        return cells
    }

    flattenCells = () => {
        let cells: Cell[] = [this]
        for (let child of this.children) {
            cells.push(...child.flattenCells())
        }
        return cells
    }

    makeTweens = (delay = 0, onComplete?: () => void) => {
        let dur = this.stage === 'in' ? params.durationIn : params.durationOut

        this.timer = new Timer({
            duration: dur,
            // easing: this.stage === 'in' ? params.easeIn : params.easeOut,
            easing: 'linear',
        }).delay(delay)
        if (this.stage === 'out') {
            this.timer.reverse(1)
        }

        if (onComplete) this.timer.onComplete(onComplete)
    }

    enter = () => {
        this.stage = 'in'
        this.makeTweens(this.delayEnter, () => {
            this.stage = 'idle'
            this.newBirthday()
        })
    }

    canDivide = () => {
        return this.stage === 'idle' && this.children.length === 0
    }

    canCollapse = () => {
        return !this.children.some((child) => {
            return child.stage !== 'idle' || child.children.length > 0
        })
    }

    divide = () => {
        let { x, y, width, height } = this.bounds
        let hw = width / 2
        let hh = height / 2

        this.stage = 'idle'
        this.children.push(
            new Cell(new Rectangle(x, y, hw, hh), this, this.getDelay()),
            new Cell(new Rectangle(x + hw, y, hw, hh), this, this.getDelay()),
            new Cell(new Rectangle(x, y + hh, hw, hh), this, this.getDelay()),
            new Cell(new Rectangle(x + hw, y + hh, hw, hh), this, this.getDelay())
        )

        if (this.onDivide) this.onDivide(this)

        return true
    }

    collapse = () => {
        this.children = []
        this.birthday = -1
        this.stage = 'in'
        this.makeTweens(0, () => {
            this.stage = 'idle'
            this.newBirthday()
            this.removeTween()
        })

        if (this.onCollapse) this.onCollapse(this)
    }

    setWillDivide = () => {
        if (!this.canDivide()) return false

        this.stage = 'out'
        this.makeTweens(0, () => {
            this.stage = 'idle'
            this.removeTween()
            this.divide()
        })

        return true
    }

    setWillCollapse = (delay = 0) => {
        if (!this.canCollapse()) return false

        if (this.children.length === 0) {
            return new Promise<void>((resolve) => {
                this.stage = 'out'
                this.makeTweens(delay, () => {
                    this.stage = 'hidden'
                    this.removeTween()
                    resolve()
                })
            })
        } else {
            let promises: Promise<void>[] = []
            for (let i = 0; i < this.children.length; i++) {
                let child = this.children[i]
                let promiseOrFalse = child.setWillCollapse(this.getDelay())
                if (!promiseOrFalse) return false
                promises.push(promiseOrFalse)
            }

            this.stage = 'childrenOut'
            this.removeTween()
            this.vals.progress = 0

            return Promise.all(promises).then(() => {
                this.collapse()
            })
        }
    }

    removeTween = () => {
        this.timer = null
    }

    getDelay = () => {
        return random(params.durationIn * 0.2, params.durationIn * 0.8)
    }
}
