import '~/style.css'
import createCanvas from '~/helpers/create-canvas'
import loop from '~/helpers/loop'
// import { GUI } from 'lil-gui'

const PHI = (1 + Math.sqrt(5)) / 2
let goldenAngle = Math.PI * 2 * (2 - PHI)

const width = window.innerWidth
const height = window.innerHeight
const { ctx } = createCanvas(width, height)

function draw(_t: number) {
    // lastTime = t
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.strokeStyle = '#fff'
    ctx.fillStyle = '#fff'

    let count = 2000
    // let multiplier = Math.sin(t * 0.001) * 0.5 + 0.5

    for (let i = 0; i < count; i++) {
        let angle = i * goldenAngle
        // let radius = Math.sqrt(i) * 7
        let radius = (i / count) * 320
        let x = Math.cos(angle) * radius
        let y = Math.sin(angle) * radius
        let size = 2.5 + Math.sin(-i * 2.2 + radius) * 2
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
    }

    ctx.restore()
}

loop(draw)
