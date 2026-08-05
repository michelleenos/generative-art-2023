import { Rng } from '~/helpers/prng'
import { WavyBumpsConfig } from './config'
import { randomInt } from '~/helpers/utils'

export function randomSample1d(count: number, min: number, max: number, n: number, rng: Rng) {
    const results: number[] = []

    while (results.length < count) {
        // generate n random candidates between min and max

        let candidates: number[] = []
        for (let i = 0; i < n; i++) {
            candidates.push(rng(min, max))
        }
        // for each candidate, find the distance between it and existing results
        // take the closest distance
        // select the candidate with the largest closest distance and add to results
        candidates = candidates.sort((a, b) => {
            let closestA = Infinity
            let closestB = Infinity
            results.forEach((r) => {
                closestA = Math.min(closestA, Math.abs(r - a))
                closestB = Math.min(closestB, Math.abs(r - b))
            })
            return closestB - closestA
        })
        results.push(candidates[0])
    }

    return results
}

export function chaikinSmooth(pts: { x: number; y: number }[], times: number) {
    let prev: { x: number; y: number }[] = pts

    for (let t = 0; t < times; t++) {
        let next: { x: number; y: number }[] = []
        for (let i = 0; i < prev.length - 1; i++) {
            const a = prev[i]
            const b = prev[i + 1]

            next.push(
                {
                    x: a.x * 0.75 + b.x * 0.25,
                    y: a.y * 0.75 + b.y * 0.25,
                },
                {
                    x: a.x * 0.25 + b.x * 0.75,
                    y: a.y * 0.25 + b.y * 0.75,
                },
            )
        }
        prev = next
    }

    return prev
}

interface GetBumpsPointsParams {
    xStart: number
    xEnd: number
    peakXStart: number
    peakXEnd: number
    bumps: WavyBumpsConfig['bumps']
    rng: Rng
}
export function getBumpsPoints({
    xStart,
    xEnd,
    peakXStart,
    peakXEnd,
    bumps,
    rng,
}: GetBumpsPointsParams) {
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
