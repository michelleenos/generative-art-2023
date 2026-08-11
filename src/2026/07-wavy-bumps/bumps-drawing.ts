import { makeRandomSeed } from '~/helpers/prng'
import { smoothDrawRibbon } from './_wavy-bumps-ribbon'
import { makeScene } from './_wavy-bumps-setup'
import { getStrokes } from './_wavy-bumps-strokes'
import { BumpsScene, BumpsStroke, Sizes } from './_wavy-bumps-types'
import { WavyBumpsConfig } from './config'

function flipY(ctx: CanvasRenderingContext2D, height: number) {
    ctx.translate(0, height / 2)
    ctx.scale(1, -1)
    ctx.translate(0, -height / 2)
}

function makeOffscreen(sizes: Sizes) {
    const canvas = document.createElement('canvas')
    canvas.width = sizes.width
    canvas.height = sizes.height
    const ctx = canvas.getContext('2d')!
    return { canvas, ctx }
}

function drawStrokes(
    ctx: CanvasRenderingContext2D,
    strokes: BumpsStroke[],
    start = 0,
    end = strokes.length,
) {
    for (let i = start; i < end; i++) {
        const { ribbon, color } = strokes[i]
        ctx.fillStyle = color
        ctx.beginPath()
        smoothDrawRibbon(ribbon, ctx)
        ctx.fill()
    }
}

export function wavyBumpsDrawing(
    config: WavyBumpsConfig,
    ctx: CanvasRenderingContext2D,
    sizes: Sizes,
    seed: number = makeRandomSeed(),
) {
    let scene: BumpsScene
    let strokes: BumpsStroke[]
    let off: { ctx: CanvasRenderingContext2D; canvas: HTMLCanvasElement } | null = null
    let nextIndex = 0

    function regenerate(newSeed = false) {
        if (newSeed) seed = makeRandomSeed()
        scene = makeScene(config, sizes, seed)
        strokes = getStrokes({ ...scene, shuffle: config.animation.animated })
        nextIndex = 0
        if (off) off.ctx.clearRect(0, 0, sizes.width, sizes.height)
    }

    function animate() {
        if (off === null) off = makeOffscreen(sizes)
        const { ctx: offCtx } = off
        const { strokesPerFrame, direction } = config.animation
        if (nextIndex >= strokes.length) return

        const end = Math.min(nextIndex + strokesPerFrame, strokes.length)
        offCtx.save()
        flipY(offCtx, sizes.height)
        if (direction === 'up') offCtx.globalCompositeOperation = 'destination-over'
        drawStrokes(offCtx, strokes, nextIndex, end)
        offCtx.restore()

        nextIndex = end

        ctx.fillStyle = scene.palette.bgColor.css()
        ctx.fillRect(0, 0, sizes.width, sizes.height)
        ctx.drawImage(off.canvas, 0, 0)
    }

    function draw() {
        ctx.fillStyle = scene.palette.bgColor.css()
        ctx.fillRect(0, 0, sizes.width, sizes.height)
        ctx.save()
        flipY(ctx, sizes.height)
        drawStrokes(ctx, strokes)
        ctx.restore()
    }

    regenerate()

    return { regenerate, draw, animate }
}
