import '../style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import loop from '~/helpers/loop'
import easings from '~/helpers/easings'

type Easing = keyof typeof easings

let width = window.innerWidth
let height = window.innerHeight

let { ctx } = createCanvas(width, height)

function draw(t: number) {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = 'rgb(230,230,230)'
    ctx.fillRect(0, 0, width, height)

    let progress = (t * 0.0001) % 1
    let progressAngle = Math.sin(progress * Math.PI * 2)

    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.fillText(progressAngle.toFixed(2), 10, 10)

    ctx.save()
    ctx.translate(width / 2, height / 2)

    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1

    for (let j = 0; j < 2; j++) {
        let n = 38
        let y = j * 30
        let r_start = width * 0.4
        let r_end = r_start * 0.2
        let arc_start = Math.PI * -0.5 + Math.PI * j
        ctx.strokeStyle = `rgba(0,0,0,${1 - j * 0.5})`

        halfDrop({ n, y, r_start, r_end, arc_start, ease_r: 'outSine' })
    }

    ctx.restore()
}

function halfDrop({
    n = 35,
    y = 0,
    r_start,
    r_end,
    arc_start = 0,
    arc_dist = Math.PI,
    ease_r = 'outSine',
    ease_arc = 'inSine',
}: {
    n?: number
    y?: number
    r_start: number
    r_end: number
    arc_start?: number
    arc_dist?: number
    ease_r?: Easing
    ease_arc?: Easing
}) {
    let r_diff = r_start - r_end

    for (let i = 0; i < n; i++) {
        let r = r_start - r_diff * easings[ease_r](i / n)
        let arc = arc_dist * easings[ease_arc](i / n)

        ctx.beginPath()
        ctx.arc(0, y, r, arc_start, arc_start + arc)
        ctx.stroke()
    }
}

loop(draw)
