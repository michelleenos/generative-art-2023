import { clamp, lerp, map } from '~/helpers/utils'
import { WavyBumpsConfig } from './config'
import { NoiseFunction2D } from 'simplex-noise'
import { getRibbon } from './bumps-ribbon'
import { BumpsCtx, BumpsLayout, BumpsPalette, BumpsStroke } from './types'
import { getBumpsPoints } from './get-bumps'

export interface LineData {
    x: number
    y: number
    dirX: number
    dirY: number
}

export type LineLookupFn = (x: number) => LineData

export function getLineLookup(
    pts: { x: number; y: number }[],
    { xStart, xEnd }: { xStart: number; xEnd: number },
): LineLookupFn {
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

export function displacePoint(
    x: number,
    y: number,
    wavePct: number,
    fieldConfig: WavyBumpsConfig['field'],
    noise: NoiseFunction2D,
) {
    const { noiseScale, moveAmtTop, moveAmtBot } = fieldConfig
    let xVal = x
    let yVal = y
    let noiseAmtX = map(wavePct, 0, 1, moveAmtBot.x, moveAmtTop.x)
    let noiseAmtY = map(wavePct, 0, 1, moveAmtBot.y, moveAmtTop.y)
    let nx = noise(x * noiseScale.x, y * noiseScale.y)
    let ny = noise(x * noiseScale.x + 123, y * noiseScale.y + 123)
    let angle = Math.atan2(ny, nx)
    let nr = noise(x * noiseScale.x + 245, y * noiseScale.y + 245)
    xVal += Math.cos(angle) * noiseAmtX * nr
    yVal += Math.sin(angle) * noiseAmtY * nr
    return { x: xVal, y: yVal }
}

type StrokeRibbonArgs = BumpsCtx & {
    x: number
    y: number
    wavePct: number
    lineLookup: LineLookupFn
}

export function getStrokeRibbon({
    x,
    y,
    wavePct,
    lineLookup,
    config,
    noise,
    rng,
}: StrokeRibbonArgs) {
    const displaced = displacePoint(x, y, wavePct, config.field, noise)
    const strokePts = makeStroke({ ...displaced, lineLookup, config: config.strokePath })
    const ribbon = getRibbon(strokePts, {
        ...config.strokeRibbon,
        taperType: rng() < 0.5 ? 'start' : 'end',
    })
    return ribbon
}

export type GetStrokesArgs = BumpsCtx & {
    config: WavyBumpsConfig
    layout: BumpsLayout
    palette: BumpsPalette
}
export function getStrokes({ rng, noise, config, layout, palette }: GetStrokesArgs) {
    const { spacing, alpha } = config
    const { width } = layout.sizes
    const { bounds, fieldStepX, overlapY, fieldStepY, rowCount } = layout

    const strokes: BumpsStroke[] = []
    for (let yi = rowCount - 1; yi >= 0; yi--) {
        const rowY = yi * spacing
        const color = palette.rowColors[yi].alpha(alpha).css()
        const points = getBumpsPoints({ ...bounds, bumps: config.bumps, rng })
        const lineLookup = getLineLookup(points, { ...bounds })
        const bottom = -overlapY

        for (let x = -fieldStepX; x < width + fieldStepX * 2; x += fieldStepX) {
            const top = Math.abs(lineLookup(x).y)

            for (let y = top; y > bottom; y -= fieldStepY) {
                const wavePct = top === 0 ? 0 : Math.max(0, y) / top
                const ribbon = getStrokeRibbon({
                    x,
                    y: y + rowY,
                    wavePct,
                    lineLookup,
                    config,
                    rng,
                    noise,
                })
                strokes.push({ x, color, ribbon, rowY, y: y + rowY, rowIndex: yi })
            }
        }
    }

    return strokes
}

export function shuffleStrokes(
    strokes: BumpsStroke[],
    { rng, noise, config, layout }: GetStrokesArgs,
) {
    const { width } = layout.sizes
    const { fieldStepX, overlapY, rowCount } = layout
    const { clumpAmt, jitterRatio, clumpScale, direction, rowStagger } = config.animation

    const jitter = fieldStepX * jitterRatio
    const dir = direction === 'up' ? -1 : 1

    const rowKeySpread = width + config.bumps.highMax + overlapY
    const rowKeyStep = rowKeySpread * rowStagger

    const strokesOrdered = strokes
        .map((stroke) => {
            const drift = noise(stroke.x * clumpScale, stroke.y * clumpScale)
            const yInRow = stroke.y - stroke.rowY
            const key =
                stroke.x -
                yInRow +
                dir * (rowCount - stroke.rowIndex) * rowKeyStep +
                drift * clumpAmt +
                rng(-jitter, jitter)
            return { stroke, key }
        })
        .sort((a, b) => a.key - b.key)
        .map(({ stroke }) => stroke)

    return strokesOrdered
}
