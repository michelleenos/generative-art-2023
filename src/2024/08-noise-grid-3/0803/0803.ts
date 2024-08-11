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

                grid.draw(recordTime, ctx)

                return false
            },
            draw: (ms) => {
                grid.draw(ms, ctx)
            },
        },
        useTime: true,
    })
}

// ffmpeg -framerate 80 -i img-%d.jpg -vf "colorspace=format=yuv420p:iall=bt709:all=bt601-6-625:range=jpeg" -crf 23 avid-testfr80-filter.mp4
// ffmpeg -framerate 80 -i img-%d.jpg -vf "colorspace=all=bt709:iprimaries=bt709:itrc=srgb:ispace=bt709" -color_range 1 -colorspace 1 -color_primaries 1 out.mp4

const draw = (ms: number) => {
    grid.draw(ms, ctx)
}

loop(draw)
// makeRecorder()

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
