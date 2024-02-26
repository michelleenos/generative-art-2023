import { Grid, type Cell } from './Grid'
import p5 from 'p5'

export class Line {
    grid: Grid
    points: Cell[] = []
    color: string
    maxPoints: number = 10
    lastAdd: number = 0
    lastTime: number = 0
    progress: number = 0
    speed: number = 3

    constructor(grid: Grid, color: string) {
        this.grid = grid
        this.color = color

        for (let i = 0; i < 2; i++) {
            this.addPoint()
        }
        this.addPoint()
    }

    addPoint = () => {
        let next =
            this.points.length < 1
                ? this.grid.getRandom()
                : this.grid.getNextWeighted(this.points[this.points.length - 1])

        this.points.push(next)
        this.grid.weighLess(next)
    }

    drawLine = (p: p5) => {
        p.beginShape()
        let len = this.points.length
        for (let i = 0; i < len; i++) {
            let point = this.points[i]
            if (i === 0 && len >= this.maxPoints) {
                let next = this.points[i + 1]
                let x = p.lerp(next.posx, point.posx, 1 - this.progress)
                let y = p.lerp(next.posy, point.posy, 1 - this.progress)
                p.vertex(x, y)
            } else if (i === len - 1) {
                let prev = this.points[i - 1]
                let x = p.lerp(prev.posx, point.posx, this.progress)
                let y = p.lerp(prev.posy, point.posy, this.progress)
                p.vertex(x, y)
            } else {
                p.vertex(point.posx, point.posy)
            }
        }
        p.endShape()
    }

    draw = (p: p5) => {
        p.push()
        p.stroke(this.color)
        p.noFill()
        this.drawLine(p)

        p.rotate(90)
        this.drawLine(p)

        p.rotate(90)
        this.drawLine(p)

        // p.scale(-1, 1)
        // this.drawLine(p)

        // p.scale(1, -1)
        // this.drawLine(p)

        // p.scale(-1, 1)
        // this.drawLine(p)
        p.pop()
    }

    update = (p: p5, time: number) => {
        let elapsed = time - this.lastTime
        this.lastTime = time
        let seconds = elapsed / 1000
        this.progress += seconds * this.speed

        if (this.progress >= 1) {
            this.addPoint()
            if (this.points.length > this.maxPoints) {
                this.grid.weighMore(this.points.shift()!)
            }
            this.progress = 0
        }

        this.draw(p)
    }
}
