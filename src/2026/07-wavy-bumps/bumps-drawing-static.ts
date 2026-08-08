import { makeRng } from '~/helpers/prng'
import { WavyBumpsConfig } from './config'
import { createNoise2D } from 'simplex-noise'
import { smoothDrawRibbon } from './bumps-ribbon'
import { makeLayout, getPalette, getStrokes, Sizes } from './bumps-drawing-shared'

export function wavyBumpsStatic(
    config: WavyBumpsConfig,
    sizes: Sizes,
    ctx: CanvasRenderingContext2D,
    seed?: number,
) {
    if (!seed) seed = (Math.random() * 2 ** 32) >>> 0
    console.log('SEED', seed)

    const rng = makeRng(seed)
    const noise = createNoise2D(rng)

    const layout = makeLayout(sizes, config)
    const palette = getPalette(makeRng((rng() * 2 ** 32) >>> 0), layout.rowCount)
    const strokes = getStrokes({
        config,
        layout,
        noise,
        palette,
        rng,
    })

    const { width, height } = sizes
    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = palette.bgColor.css()
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.translate(0, height / 2)
    ctx.scale(1, -1)
    ctx.translate(0, -height / 2)

    for (const { ribbon, color } of strokes) {
        ctx.fillStyle = color
        ctx.beginPath()
        smoothDrawRibbon(ribbon, ctx)
        ctx.fill()
    }

    ctx.restore()
}
