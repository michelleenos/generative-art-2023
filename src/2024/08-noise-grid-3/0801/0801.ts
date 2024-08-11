import createCanvas from '~/helpers/canvas/createCanvas'
import loop from '~/helpers/loop'
import { Sizes } from '~/helpers/sizes'
import '~/style.css'
import { Grid } from './grid'
import { makeGui, params } from './params'
import { map } from '~/helpers/utils'
import { Recorder } from '../../05-scribblepaint/recorder'

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

                let t = recordTime / 3000
                let int = Math.floor(t)
                let frac = t % 1
                if (int % 2 === 1) {
                    t = 1 - frac
                } else {
                    t = frac
                }
                params.threshold = map(t, 0, 1, 0.8, 1)

                grid.draw(recordTime, ctx)

                return false
            },
            draw: (ms) => {
                let t = ms / 3000
                let int = Math.floor(t)
                let frac = t % 1
                if (int % 2 === 1) {
                    t = 1 - frac
                } else {
                    t = frac
                }
                params.threshold = map(t, 0, 1, 0.8, 1)

                grid.draw(ms, ctx)
            },
        },
        useTime: true,
    })
}

const draw = (ms: number) => {
    let t = ms / 3000
    let int = Math.floor(t)
    let frac = t % 1
    if (int % 2 === 1) {
        t = 1 - frac
    } else {
        t = frac
    }
    params.threshold = map(t, 0, 1, 0.8, 1)

    grid.draw(ms, ctx)
}

loop(draw)

// window.addEventListener('click', (e: MouseEvent) => {
//     let x = e.clientX
//     let y = e.clientY
//     let cell = grid.root.findCell(x, y)
//     if (!cell) return
//     if (cell.depth < params.maxDepth) {
//         cell.setWillDivide()
//     } else if (cell.parent) {
//         cell.parent.setWillCollapse()
//     }
// })
