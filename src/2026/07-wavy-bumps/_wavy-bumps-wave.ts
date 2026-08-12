import { Rng } from '~/helpers/prng'
import { WavyBumpsConfig } from './_wavy-bumps-types'
import { randomInt } from '~/helpers/utils'
import { chaikinSmooth } from '~/helpers/chaikin-smooth'
import { randomSample1d } from '~/helpers/random-sample'

type GetBumpsPointsArgs = {
    xStart: number
    xEnd: number
    peakXStart: number
    peakXEnd: number
    bumps: WavyBumpsConfig['waves']
    rng: Rng
}
export function getBumpsPoints({
    xStart,
    xEnd,
    peakXStart,
    peakXEnd,
    bumps,
    rng,
}: GetBumpsPointsArgs) {
    const { peakMin, peakMax, highMin, highMax, peakWidth, chaikinTimes, lowMin, lowMax } = bumps
    const peaksCount = randomInt(peakMin, peakMax, rng)
    const peaks = randomSample1d(peaksCount, peakXStart, peakXEnd, 10, rng)
        .sort((a, b) => a - b)
        .map((x) => ({ x, y: rng(highMin, highMax) }))

    let points: { x: number; y: number }[] = []
    points.push({ x: xStart, y: 0 })
    points.push({ x: xStart, y: 0 })

    let addLeft = true

    for (let i = 0; i < peaks.length; i++) {
        let cur = peaks[i]

        if (addLeft) {
            let leftX = cur.x - peakWidth
            if (i !== 0) {
                let prev = peaks[i - 1]
                let mid = (cur.x + prev.x) / 2
                leftX = Math.max(mid, cur.x - peakWidth)
            }
            leftX = Math.max(xStart, leftX)
            points.push({ x: leftX, y: rng(lowMin, lowMax) })
        }
        points.push({ ...cur })

        let rightX = cur.x + peakWidth
        if (i !== peaks.length - 1) {
            let next = peaks[i + 1]
            let mid = (cur.x + next.x) / 2
            if (mid < cur.x + peakWidth * 1.25) {
                rightX = mid
                addLeft = false // don't add a point to the left of the next one if they would be close/the same
            } else {
                rightX = cur.x + peakWidth
                addLeft = true
            }
        }
        rightX = Math.min(rightX, xEnd)
        points.push({ x: rightX, y: rng(lowMin, lowMax) })
    }

    points.push({ x: xEnd, y: 0 })
    points.push({ x: xEnd, y: 0 })

    if (chaikinTimes > 0) points = chaikinSmooth(points, chaikinTimes)

    return points
}
