import { Grid, type Cell } from './Grid'
import p5 from 'p5'
import { random } from '~/helpers/utils'

type LineProps = {
    maxPoints?: number
    thickness?: number
    speed?: number
    symmetry?: 'rotate' | 'reflect' | 'none'
    color: string
    useWeights?: boolean
}

export class Line {
    grid: Grid
    points: Cell[] = []
    color: string
    maxPoints: number
    lastAdd: number = 0
    lastTime: number = 0
    progress: number = 0
    thickness: number
    speed: number
    useWeights: boolean
    shrinking: boolean = false
    symmetry: 'rotate' | 'reflect' | 'none'
    alphaLen: number = 3

    constructor(
        grid: Grid,
        {
            color,
            maxPoints = 10,
            thickness = 10,
            speed = 3,
            symmetry = 'reflect',
            useWeights = true,
        }: LineProps
    ) {
        this.grid = grid
        this.color = color
        this.maxPoints = maxPoints
        this.speed = speed
        this.symmetry = symmetry
        this.thickness = thickness
        this.useWeights = useWeights

        for (let i = 0; i < random(2, this.maxPoints); i++) {
            this.addPoint()
        }
    }

    addPoint = () => {
        let next =
            this.points.length < 1
                ? this.grid.getRandom()
                : this.useWeights
                ? this.grid.getNextWeighted(this.points[this.points.length - 1])
                : this.grid.getNext(this.points[this.points.length - 1])

        if (this.points.length + 1 > this.maxPoints) {
            let removed = this.points.shift()
            if (this.useWeights) this.grid.weighMore(removed!)
        }

        if (!next) {
            this.shrinking = true
            return
        }

        this.points.push(next)
        if (this.useWeights) this.grid.weighLess(next)
    }

    drawLine = (p: p5) => {
        p.push()
        p.beginShape()
        let len = this.points.length
        for (let i = 0; i < len; i++) {
            let point = this.points[i]
            if (i === 0 && (len === this.maxPoints || (this.shrinking && len > 1))) {
                let next = this.points[i + 1]
                let x = p.lerp(point.posx, next.posx, this.progress)
                let y = p.lerp(point.posy, next.posy, this.progress)
                p.vertex(x, y)
            } else if (i > 0 && i === len - 1 && !this.shrinking) {
                let prev = this.points[i - 1]
                let x = p.lerp(prev.posx, point.posx, this.progress)
                let y = p.lerp(prev.posy, point.posy, this.progress)
                p.vertex(x, y)
            } else {
                p.vertex(point.posx, point.posy)
            }
        }
        p.endShape()
        p.pop()
    }

    draw = (p: p5) => {
        let stroke = p.color(this.color)
        if (this.shrinking && this.points.length <= this.alphaLen) {
            let alphaStep = 255 / (this.alphaLen - 1)
            let alpha = (this.points.length - 1) * alphaStep
            alpha -= this.progress * alphaStep
            stroke.setAlpha(alpha)
        }
        p.stroke(stroke)
        p.strokeWeight(this.thickness)
        p.noFill()
        p.push()

        this.drawLine(p)

        if (this.symmetry === 'rotate') {
            p.rotate(p.PI / 2)
            this.drawLine(p)

            p.rotate(p.PI / 2)
            this.drawLine(p)

            p.rotate(p.PI / 2)
            this.drawLine(p)
        } else if (this.symmetry === 'reflect') {
            p.scale(-1, 1)
            this.drawLine(p)

            p.scale(1, -1)
            this.drawLine(p)

            p.scale(-1, 1)
            this.drawLine(p)
        }

        p.pop()
    }

    update(time: number) {
        let elapsed = time - this.lastTime
        this.lastTime = time
        let seconds = elapsed / 1000
        this.progress += seconds * this.speed

        if (this.progress >= 1) {
            if (this.shrinking) {
                if (this.points.length > 1) {
                    let removed = this.points.shift()
                    if (this.useWeights) this.grid.weighMore(removed!)
                } else {
                    this.shrinking = false
                    while (this.points.length) {
                        let removed = this.points.pop()
                        if (this.useWeights) this.grid.weighMore(removed!)
                    }
                    this.addPoint()
                }
            } else {
                this.addPoint()
            }
            this.progress = 0
        }
    }
}
