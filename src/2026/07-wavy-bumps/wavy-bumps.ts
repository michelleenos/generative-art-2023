import createCanvas from '~/helpers/create-canvas'
import '~/style.css'
import { buildWavyBumpsGui } from './_wavy-bumps-gui'
import { wavyBumpsDrawing } from './_wavy-bumps-drawing'
import { C } from './config'
import { FixedFpsLoop } from '~/helpers/loop'
import { GuiExtra } from '~/helpers/gui/lilgui-extra'

const sizes = { width: 900, height: 900 }
const { ctx } = createCanvas(sizes.width, sizes.height)

C.animation.animated = false
const { regenerate, draw, animate } = wavyBumpsDrawing(C, ctx, sizes)
const debg = {
    restart: () => {
        regenerate()
        if (!C.animation.animated) draw()
    },
    newSeed: () => {
        regenerate(true)
        if (!C.animation.animated) draw()
    },
}

const gui = new GuiExtra()
buildWavyBumpsGui(gui, C)
gui.add(debg, 'restart')
gui.add(debg, 'newSeed')
gui.onChange(() => debg.restart())

const loop = new FixedFpsLoop(animate, { paused: true })
draw()

gui.add(C.animation, 'animated').onChange((animated: boolean) => {
    if (animated) {
        regenerate()
        loop.start()
    } else {
        loop.stop()
        regenerate()
        draw()
    }
})
