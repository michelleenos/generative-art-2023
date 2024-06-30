import chroma from 'chroma-js'
import p5 from 'p5'
import { createNoise2D } from 'simplex-noise'
import { map } from '~/helpers/utils'

const PHI = (1 + Math.sqrt(5)) / 2
let goldenAngle = Math.PI * 2 * (2 - PHI)

const noise2D = createNoise2D()

/**
 * Draws a petal shape. Aside from size, all other parameters are multipliers that determine the shape of the petal.
 *
 * @param p - The p5 instance.
 * @param size - radius of the petal
 * @param offset - multiplier which determines the distance between the two anchor points (the width of the base)
 * @param cx1 - multiplier for the x-coordinate of the first control point
 * @param cx2 - multiplier for the x-coordinate of the second control point
 * @param cy1 - multiplier for the y-coordinate of the first control point
 * @param cy2 - multiplier for the y-coordinate of the second control point
 */
export function petal(
    p: p5,
    size: number,
    offset = 0.25,
    cx1 = 0.3,
    cx2 = 0.3,
    cy1 = 0.3,
    cy2 = 0.8,
    tx = 0,
    ty = 0
) {
    let a1 = [offset * -0.25, 0]
    let a2 = [offset * 0.25, 0]
    let top = [0 + tx * size, size * 1.3 + ty * size]
    let cpl1 = [size * -cx1, size * cy1]
    let cpl2 = [size * -cx2, size * cy2]
    let cpr1 = [size * cx1, size * cy1]
    let cpr2 = [size * cx2, size * cy2]

    p.beginShape()
    p.vertex(a1[0], a1[1])
    p.bezierVertex(cpl1[0], cpl1[1], cpl2[0], cpl2[1], top[0], top[1])
    p.bezierVertex(cpr2[0], cpr2[1], cpr1[0], cpr1[1], a2[0], a2[1])
    p.endShape()
}

export class Petal {
    off: number
    cx1: number
    cx2: number
    cy1: number
    cy2: number
    tx: number
    ty: number
    seed: number
    angle: number
    progress = 0
    lastTime = 0

    constructor(seed: number, angle: number) {
        this.seed = seed
        this.angle = angle
        // this.off = random(0.1, 0.4)
        this.off = 0.25
        this.cx1 = map(noise2D(this.seed, 1), -1, 1, 0.1, 0.9)
        this.cx2 = map(noise2D(this.seed * 3, 1), -1, 1, 0.1, 0.9)
        this.cy1 = map(noise2D(this.seed, 2), -1, 1, 0, 0.8)
        this.cy2 = map(noise2D(this.seed * 2, 2), -1, 1, 0.2, 1)
        this.tx = map(noise2D(this.seed, 3), -1, 1, -0.2, 0.2)
        this.ty = map(noise2D(this.seed * 2, 3), -1, 1, -0.3, 0.3)
        // this.tx = random(-0.3, 0.3)
        // this.ty = random(-0.3, 0.3)
    }

    update(t: number) {
        let delta = t - this.lastTime
        this.lastTime = t
        // this.off = map(noise2D(t * 0.1, this.off), -1, 1, 0.1, 0.4)
        this.cx1 = map(noise2D(t * 0.1 + this.seed, this.cx1 * 0.2), -1, 1, 0.1, 0.9) * 0.9 + 0.1
        this.cx2 = map(noise2D(t * 0.1 + this.seed, this.cx2 * 0.2), -1, 1, 0.1, 0.9) * 0.9 + 0.1
        this.cy1 = map(noise2D(t * 0.1 + this.seed, this.cy1 * 0.1), -1, 1, 0.0, 0.7)
        this.cy2 = map(noise2D(t * 0.1 + this.seed, this.cy2 * 0.1), -1, 1, 0.2, 1)
        // this.tx = map(noise2D(t * 0.1, this.tx), -1, 1, -0.5, 0.5)
        // this.ty = map(noise2D(t * 0.1, this.ty), -1, 1, -0.3, 0.3)
        this.angle += delta * 0.05
        this.progress += delta * 0.1
    }

    draw(p: p5, size: number) {
        petal(
            p,
            size * this.progress,
            this.off,
            this.cx1,
            this.cx2,
            this.cy1,
            this.cy2,
            this.tx,
            this.ty
        )
    }
}

export class Flower {
    petals: Petal[] = []

    color1: string = '#262626'
    color2: string = '#aaaaaa'

    constructor(count: number, color1?: string, color2?: string) {
        if (color1) this.color1 = color1
        if (color2) this.color2 = color2
        for (let i = 0; i < count; i++) {
            let seed = Math.floor(i / 10)
            let petal = new Petal(seed, i * goldenAngle)
            petal.progress = i / count
            this.petals.push(petal)
        }
    }

    draw(p: p5, t: number) {
        for (let i = this.petals.length - 1; i >= 0; i--) {
            let petal = this.petals[i]
            let percent = i / this.petals.length
            p.push()
            petal.update(t)
            // let progress = petal.progress
            let alpha = 1
            let color = chroma.mix(this.color1, this.color2, percent).alpha(alpha).hex()
            p.fill(color)
            p.rotate(i * goldenAngle)
            petal.draw(p, 100)
            p.pop()
        }
    }
}
