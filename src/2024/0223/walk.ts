import easings from '~/helpers/easings'
import { random } from '~/helpers/utils'

type WalkGridOpts = {
    maxPoints?: number
    color: string
    size: number
}

export class WalkGrid {
    points: [number, number][] = []
    maxPoints: number
    color: string
    size: number
    dead: boolean = false
    dying: boolean = false
    life = 1
    lengthAtDying: number = 1
    maxTries = 5

    constructor({ maxPoints = 10, color, size }: WalkGridOpts) {
        this.maxPoints = maxPoints
        this.color = color
        this.size = size

        this.points.push([Math.floor(size / 2), Math.floor(size / 2)])
    }

    getDir = () =>
        random([
            [0, 1],
            [0, -1],
            [-1, -1],
            [1, 1],
            [1, 0],
            [-1, 0],
        ])

    outOfBounds = (x: number, y: number) => x < 0 || y < 0 || x >= this.size || y >= this.size

    includes = (x: number, y: number) => this.points.some(([px, py]) => px === x && py === y)

    getNext = (): [number, number] | null => {
        let [x, y] = this.points[this.points.length - 1]
        let [dirX, dirY] = this.getDir()
        let x1 = x + dirX
        let y1 = y + dirY
        return !this.outOfBounds(x1, y1) && !this.includes(x1, y1) ? [x1, y1] : null
    }

    step = () => {
        if (this.dying) {
            this.life *= 0.9
            this.points.shift()
            if (this.points.length === 0) this.dead = true
            return
        }

        let tries = 0
        let next = this.getNext()
        while (!next && tries < this.maxTries) {
            next = this.getNext()
            tries++
        }
        if (next) {
            this.points.push(next)
            if (this.points.length > this.maxPoints) {
                this.points.shift()
            }
        } else {
            this.dying = true
            this.lengthAtDying = this.points.length
        }
    }
}
