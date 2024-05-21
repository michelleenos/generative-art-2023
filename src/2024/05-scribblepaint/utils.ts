import { random } from '~/helpers/utils'
import p5 from 'p5'

export const randomInSquare = (cx: number, cy: number, radius: number) => {
    let x = random(cx - radius, cx + radius)
    let y = random(cy - radius, cy + radius)
    return [Math.floor(x), Math.floor(y)]
}

export const randomInCircle = (cx: number, cy: number, radius: number) => {
    let angle = random(0, Math.PI * 2)
    let r = random(0, radius)
    let x = cx + r * Math.cos(angle)
    let y = cy + r * Math.sin(angle)
    return [Math.floor(x), Math.floor(y)]
}

export const pixelIndex = (x: number, y: number, w: number, pd: number) => {
    return (y * w * pd + x) * 4 * pd
}

export const isPixelBlank = (pixels: Uint8ClampedArray, index: number, alphaThreshold = 255) => {
    return pixels[index + 3] < alphaThreshold
}

export const randomAngle = (range: number, onlyPositive = false) => {
    if (onlyPositive) return random(0, range)
    return random(-range * 0.5, range * 0.5)
}

export const setShadow = (
    g: p5.Graphics,
    color: string,
    blur: number,
    offset: [number, number]
) => {
    g.drawingContext.shadowColor = color
    g.drawingContext.shadowBlur = blur
    g.drawingContext.shadowOffsetX = offset[0]
    g.drawingContext.shadowOffsetY = offset[1]
}

export class Rectangle {
    constructor(public x: number, public y: number, public w: number, public h: number) {}

    contains(x: number, y: number) {
        return x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h
    }

    intersects(range: Rectangle) {
        return !(
            range.x > this.x + this.w ||
            range.x + range.w < this.x ||
            range.y > this.y + this.h ||
            range.y + range.h < this.y
        )
    }

    getRandom(integer = true): [number, number] {
        let x = random(this.x, this.x + this.w)
        let y = random(this.y, this.y + this.h)
        return integer ? [Math.floor(x), Math.floor(y)] : [x, y]
    }
}
