import createCanvas from '~/helpers/canvas/createCanvas'
import loop from '~/helpers/loop'
import { Sizes } from '~/helpers/sizes'
import '~/style.css'
import { Grid } from './grid'
import { makeGui, params } from './params'
import { map } from '~/helpers/utils'
import { Recorder } from '../../05-scribblepaint/recorder'
import easing from '~/helpers/easings'

const sizes = new Sizes()
let { ctx, resizeCanvas } = createCanvas(900, 900)
sizes.on('resize', resizeCanvas)
const grid = new Grid(900, 900)
const gui = makeGui()

const makeRecorder = () => {
    let recordTime = 0

    const recorder = new Recorder({
        canvas: ctx.canvas,
        gui,
        fns: {
            drawRecord: (frame: number) => {
                recordTime = frame * 15

                grid.draw(recordTime, ctx)

                return false
            },
            draw: (ms) => {
                grid.draw(ms, ctx)
            },
        },
        useTime: true,
    })
    return recorder
}

const recorder = makeRecorder()
recorder.toggleLoop()

// const draw = (ms: number) => {
//     grid.draw(ms, ctx)
// }

// loop(draw)
