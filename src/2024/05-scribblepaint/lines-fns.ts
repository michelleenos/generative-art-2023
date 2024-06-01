import { randomAngle, randomInCircle } from './utils'

type LinePointOpts = {
    x: number
    y: number
    angle: number
    wiggle?: number
    wiggleMax?: number
    maxTries?: number
    lenMax?: number
    lenMin?: number
    mult?: number
    checkPoint: (x: number, y: number) => { valid: boolean; stop: boolean }
}
export const getLinePoints = ({
    x,
    y,
    angle,
    wiggle = 0.1,
    wiggleMax,
    maxTries = 20,
    lenMax = 100,
    lenMin = 10,
    checkPoint,
    mult = 1,
}: LinePointOpts) => {
    let curX = x
    let curY = y
    let tries = 0
    let a = angle

    let points: [number, number][] = []

    while (points.length < lenMax && tries < maxTries) {
        let nextX = curX + Math.cos(a) * mult
        let nextY = curY + Math.sin(a) * mult

        let { valid, stop } = checkPoint(nextX, nextY)
        if (stop) break

        if (!valid) {
            tries++
            a += randomAngle(wiggle * 2)
            continue
        }

        points.push([nextX, nextY])
        curX = nextX
        curY = nextY
        tries = 0
        let diff = a - angle
        if (wiggleMax && Math.abs(diff) > wiggleMax) {
            a += randomAngle(wiggleMax, diff > 0 ? -1 : 1)
        } else {
            a += randomAngle(wiggle)
        }
    }

    if (points.length < lenMin) return false

    return points
}

type PixelNearOpts = {
    x: number
    y: number
    radius: number
    checkPoint: (x: number, y: number) => boolean
    maxTries?: number
}
export const maybeGetPixelNear = ({ x, y, radius, checkPoint, maxTries = 10 }: PixelNearOpts) => {
    let tries = 0
    while (tries < maxTries) {
        let [nx, ny] = randomInCircle(x, y, radius)
        if (checkPoint(nx, ny)) {
            return [nx, ny]
        }
        tries++
    }
    return false
}
