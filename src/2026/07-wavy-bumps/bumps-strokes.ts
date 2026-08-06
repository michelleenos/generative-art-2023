import { clamp, lerp, map } from '~/helpers/utils'
import { WavyBumpsConfig } from './config'

export interface LineData {
    y: number
    x: number
    dirX: number
    dirY: number
}

export function getLineLookup(
    pts: { x: number; y: number }[],
    { xStart, xEnd }: { xStart: number; xEnd: number },
) {
    const len = pts.length

    const data: LineData[] = pts.map((pt, i) => {
        const a = pts[Math.max(0, i - 1)]
        const b = pts[Math.min(len - 1, i + 1)]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const mag = Math.sqrt(dx ** 2 + dy ** 2)
        return { y: pt.y, x: pt.x, dirX: mag === 0 ? 1 : dx / mag, dirY: mag === 0 ? 0 : dy / mag }
    })

    const lookupLen = xEnd - xStart + 1
    const lookupY = new Float32Array(lookupLen)
    const lookupDirY = new Float32Array(lookupLen)
    const lookupDirX = new Float32Array(lookupLen)

    let curIndex = 0
    for (let i = 0; i < lookupLen; i++) {
        const wx = xStart + i
        let prev = data[curIndex]
        let next = data[curIndex + 1]
        while (curIndex < data.length - 1 && wx > next.x) {
            curIndex++
            prev = data[curIndex]
            next = data[curIndex + 1]
        }
        if (!next) {
            lookupY[i] = prev.y
            lookupDirX[i] = prev.dirX
            lookupDirY[i] = prev.dirY
        } else {
            const dx = next.x - prev.x
            const amt = dx === 0 ? 0 : clamp((wx - prev.x) / dx, 0, 1)
            const y = prev.y + (next.y - prev.y) * amt
            lookupY[i] = y
            lookupDirX[i] = lerp(prev.dirX, next.dirX, amt)
            lookupDirY[i] = lerp(prev.dirY, next.dirY, amt)
        }
    }

    return function (x: number) {
        const i = clamp((x - xStart) | 0, 0, lookupLen - 2)
        const p = clamp(x - xStart - i, 0, 1)
        const y = lerp(lookupY[i], lookupY[i + 1], p)
        const dirX = lerp(lookupDirX[i], lookupDirX[i + 1], p)
        const dirY = lerp(lookupDirY[i], lookupDirY[i + 1], p)
        return { x, y, dirX, dirY }
    }
}

interface MakeStrokeParams {
    lineLookup: ReturnType<typeof getLineLookup>
    x: number
    y: number
    config: WavyBumpsConfig['strokePath']
}

export function makeStroke({ lineLookup, x, y, config }: MakeStrokeParams) {
    const mainData = lineLookup(x)
    const mainHeading = Math.atan2(mainData.dirY, mainData.dirX)
    const { flattenAngle, blendAngleAmt, steps, stepLen } = config

    const start = { x, y }
    const pts: { x: number; y: number }[] = []
    pts[steps] = { x, y }
    let prev = start
    let prevDirX = mainData.dirX
    let prevDirY = mainData.dirY
    const dist = y / mainData.y

    const headingVal = (dist: number, heading: number) => {
        return flattenAngle === 0
            ? heading
            : map(clamp(dist, 0, 1), 0, 1, heading * (1 - flattenAngle), heading)
    }
    let curHeading = headingVal(dist, mainHeading)

    const getPoint = (i: number, dir = 1) => {
        const next = {
            x: prev.x + Math.cos(curHeading) * (stepLen * dir),
            y: prev.y + Math.sin(curHeading) * (stepLen * dir),
        }
        const nextData = lineLookup(next.x)
        prevDirX = lerp(prevDirX, nextData.dirX, blendAngleAmt)
        prevDirY = lerp(prevDirY, nextData.dirY, blendAngleAmt)
        const nextHeading = Math.atan2(prevDirY, prevDirX)
        curHeading = headingVal(dist, nextHeading)
        pts[i] = next
        prev = next
    }

    for (let i = steps - 1; i >= 0; i--) getPoint(i, -1)

    prev = start
    prevDirX = mainData.dirX
    prevDirY = mainData.dirY
    curHeading = headingVal(dist, mainHeading)
    for (let i = steps + 1; i < steps * 2; i++) getPoint(i, 1)

    return pts
}
