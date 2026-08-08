import createCanvas from '~/helpers/create-canvas'
import { FixedFpsLoop } from '~/helpers/loop'
import '~/style.css'
import { C } from './config'
import { buildWavyBumpsGui } from './gui'
import { bumpsAnimated } from './bumps-drawing-animated'

const sizes = { width: 900, height: 900 }
const { ctx } = createCanvas(sizes.width, sizes.height)

const offCanvas = document.createElement('canvas')
offCanvas.width = sizes.width
offCanvas.height = sizes.height
const offCtx = offCanvas.getContext('2d')!

let seed = 395055755

const animation = bumpsAnimated({ config: C, sizes, ctx, offCtx, offCanvas, initialSeed: seed })
buildWavyBumpsGui(C, {
    animated: true,
    onRestart: () => {
        animation.restartDrawing(false)
    },
    onNewSeed: () => {
        animation.restartDrawing(true)
    },
})

new FixedFpsLoop(animation.draw)
