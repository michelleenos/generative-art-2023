import { createNoise2D } from 'simplex-noise'
import { makeRng } from '~/helpers/prng'
import { smoothDrawRibbon } from './bumps-ribbon'
import { getPalette, makeLayout } from './bumps-drawing-shared'
import { BumpsPalette, BumpsLayout, Sizes, BumpsStroke } from './types'
import { WavyBumpsConfig } from './config'
import { getStrokes, GetStrokesArgs, shuffleStrokes } from './strokes'

type AnimatedFrameArgs = {
    strokes: BumpsStroke[]
    startIndex: number
    count: number
    ctx: CanvasRenderingContext2D
    offCanvas: HTMLCanvasElement
    offCtx: CanvasRenderingContext2D
    bgColor: string
    sizes: Sizes
    direction: 'up' | 'down'
}
function drawAnimatedFrame({
    strokes,
    startIndex,
    count,
    ctx,
    offCanvas,
    bgColor,
    sizes,
    offCtx,
    direction,
}: AnimatedFrameArgs) {
    const { width, height } = sizes
    const end = Math.min(startIndex + count, strokes.length)

    offCtx.save()
    offCtx.translate(0, sizes.height / 2)
    offCtx.scale(1, -1)
    offCtx.translate(0, -sizes.height / 2)

    if (direction === 'up') offCtx.globalCompositeOperation = 'destination-over'
    for (let i = startIndex; i < end; i++) {
        const { ribbon, color } = strokes[i]
        offCtx.fillStyle = color
        offCtx.beginPath()
        smoothDrawRibbon(ribbon, offCtx)
        offCtx.fill()
    }

    offCtx.restore()

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(offCanvas, 0, 0)

    return end
}

type BumpsAnimatedParams = {
    config: WavyBumpsConfig
    sizes: Sizes
    ctx: CanvasRenderingContext2D
    offCtx: CanvasRenderingContext2D
    offCanvas: HTMLCanvasElement
    initialSeed?: number
}
export function bumpsAnimated({
    config,
    sizes,
    ctx,
    offCtx,
    offCanvas,
    initialSeed,
}: BumpsAnimatedParams) {
    let nextIndex = 0
    let strokes: BumpsStroke[]
    let layout: BumpsLayout
    let palette: BumpsPalette
    let seed = initialSeed || (Math.random() * 2 ** 32) >>> 0

    function restartDrawing(newSeed = false) {
        if (newSeed) seed = (Math.random() * 2 ** 32) >>> 0
        console.log('SEED: ', seed)
        const rng = makeRng(seed)
        const noise = createNoise2D(rng)
        nextIndex = 0
        offCtx.clearRect(0, 0, sizes.width, sizes.height)
        layout = makeLayout(sizes, config)
        palette = getPalette(makeRng((rng() * 2 ** 32) >>> 0), layout.rowCount)
        const getStrokesArgs = { config, layout, noise, palette, rng }
        strokes = shuffleStrokes(getStrokes(getStrokesArgs), getStrokesArgs)
    }

    restartDrawing()

    function draw() {
        const { strokesPerFrame, direction } = config.animation
        if (nextIndex >= strokes.length) return
        nextIndex = drawAnimatedFrame({
            bgColor: palette.bgColor.css(),
            count: strokesPerFrame,
            ctx,
            offCtx,
            offCanvas,
            direction,
            sizes,
            startIndex: nextIndex,
            strokes,
        })
    }

    return { restartDrawing, draw }
}
