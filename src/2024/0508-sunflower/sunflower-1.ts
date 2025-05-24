import '~/style.css'
import createCanvas from '~/helpers/create-canvas'
import { GUI } from 'lil-gui'

const PHI = (1 + Math.sqrt(5)) / 2

const width = window.innerWidth
const height = window.innerHeight
const { ctx } = createCanvas(width, height)

let goldenAngleDegrees = 360 * (2 - PHI)

let goldenAngleRadians = Math.PI * 2 * (2 - PHI)

const PARAMS = {
    count: 100,
    maxRadius: 300,
    minRadius: 100,
    maxSize: 10,
    minSize: 2,
    usePhi: true,
    stepAngle: Math.PI * 2 * PHI,
    stepAngleDegrees: goldenAngleDegrees,
}

interface SunflowerOptions {
    count?: number
    maxRadius?: number
    minRadius?: number
    maxSize?: number
    minSize?: number
    stepAngle?: number
}

/**
 * A fibonacci style sunflower. 🌻
 * By default, the angle will step by the golden angle.
 * Add the `stepAngle` option to use a custom angle.
 */
function sunflower({
    count = 200,
    maxRadius = 300,
    minRadius = 50,
    maxSize = 10,
    minSize = 1,
    stepAngle,
}: SunflowerOptions) {
    let angle = 0
    for (let i = 0; i < count; i++) {
        let percent = i / count
        let size = minSize + (maxSize - minSize) * percent
        let radius = minRadius + (maxRadius - minRadius) * percent

        if (typeof stepAngle === 'number') {
            angle += stepAngle
        } else {
            angle += goldenAngleRadians
        }
        let x = Math.cos(angle) * radius
        let y = Math.sin(angle) * radius

        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
    }
}

const gui = new GUI()

gui.add(PARAMS, 'count', 1, 800, 1)
gui.add(PARAMS, 'maxRadius', 10, 500, 1)
gui.add(PARAMS, 'minRadius', 0, 500, 1)
gui.add(PARAMS, 'maxSize', 0, 50, 0.1)
gui.add(PARAMS, 'minSize', 0, 50, 0.1)
let guiPhi = gui.add(PARAMS, 'usePhi')
let guiAngle = gui
    .add(PARAMS, 'stepAngleDegrees', 0, 360, 0.1)
    .hide()
    .onChange((angle: number) => {
        PARAMS.stepAngle = (angle * Math.PI) / 180
    })

guiPhi.onChange((usePhi: boolean) => {
    if (usePhi) {
        guiAngle.hide()
    } else {
        guiAngle.show()
    }
})

const draw = () => {
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.translate(width / 2, height / 2)

    ctx.fillStyle = '#fff'
    sunflower(PARAMS)

    ctx.restore()
}

draw()
gui.onChange(() => draw())
