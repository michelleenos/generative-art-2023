import { random } from '~/helpers/utils'

type PetalOpts = {
    x: number
    y: number
    endRangeY?: [number, number]
    endRangeX?: [number, number]
    controlRangeX?: [number, number]
    controlVarX?: number
    controlVarY?: number
    rotation?: number
    cp1Mult?: { x: number; y: number }
    cp2Mult?: { x: number; y: number }
}

export function createPetal(ctx: CanvasRenderingContext2D, opts: PetalOpts) {
    let Petal = class {
        x: number
        y: number
        start: { x: number; y: number } = { x: 0, y: 0 }
        end: { x: number; y: number }
        cp1: { x: number; y: number }
        cp2: { x: number; y: number }
        controlVarX: number
        controlVarY: number
        rotation: number
        tAdd: number
        cp1Mult: { x: number; y: number }
        cp2Mult: { x: number; y: number }

        constructor({
            x,
            y,
            endRangeX = [-100, 100],
            endRangeY = [300, 500],
            controlRangeX = [50, 100],
            controlVarX = 50,
            controlVarY = 100,
            rotation = 0,
            cp1Mult = { x: 1.5, y: 0.8 },
            cp2Mult = { x: 2.5, y: 1 },
        }: PetalOpts) {
            this.x = x
            this.y = y
            this.controlVarX = controlVarX
            this.controlVarY = controlVarY
            this.rotation = rotation
            this.tAdd = random(0, Math.PI)
            this.end = {
                x: random(endRangeX[0], endRangeX[1]),
                y: random(-endRangeY[0], -endRangeY[1]),
            }

            let cpxl = random(-controlRangeX[0], -controlRangeX[1])
            let cpyb = random(this.end.y * 0.1, this.end.y * 0.4)
            let cpyt = random(this.end.y * 0.6, this.end.y * 0.9)
            let cpxr = random(controlRangeX[0], controlRangeX[1])

            this.cp1Mult = cp1Mult
            this.cp2Mult = cp2Mult

            if (Math.random() < 0.5) {
                this.cp1 = {
                    x: cpxl,
                    y: cpyb,
                }
                this.cp2 = {
                    x: cpxr,
                    y: cpyt,
                }
            } else {
                this.cp1 = {
                    x: cpxr,
                    y: cpyb,
                }
                this.cp2 = {
                    x: cpxl,
                    y: cpyt,
                }
            }
        }

        draw = (t) => {
            let cp1 = {
                x:
                    this.cp1.x +
                    this.controlVarX * Math.sin(t * this.cp1Mult.x + Math.PI),
                y: this.cp1.y + Math.sin(t * this.cp1Mult.y) * this.controlVarY,
            }
            let cp2 = {
                x: this.cp2.x + this.controlVarX * Math.sin(t * this.cp2Mult.x),
                y: this.cp2.y + Math.sin(t * this.cp2Mult.y) * this.controlVarY,
            }

            ctx.save()
            ctx.translate(this.x, this.y)
            ctx.rotate(this.rotation)

            ctx.beginPath()
            ctx.moveTo(this.start.x, this.start.y)
            ctx.bezierCurveTo(
                cp1.x,
                cp1.y,
                cp2.x,
                cp2.y,
                this.end.x,
                this.end.y
            )
            ctx.stroke()
            ctx.restore()
        }
    }

    return new Petal(opts)
}

export type Petal = ReturnType<typeof createPetal>
