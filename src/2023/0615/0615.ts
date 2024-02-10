import '../style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import loop from '~/helpers/loop'

let W = 1920
let H = 1080
let { ctx, canvas } = createCanvas(W, H)
canvas.style.width = '100%'
canvas.style.height = '100%'
let c = canvas
let x = ctx
let C = Math.cos
let S = Math.sin

loop((t) => {
    t = t / 1000
    c.width = 1920

    for (let i = -9; i < 9; i++) {
        let p = i + C(t / 2)
        p *= 6
        let f = (j: number) => {
            x.beginPath()
            x.arc(
                i * 50 + 960,
                0.001 * p * p * p * C(j * 0.1 + t) * 2 + 500,
                S(j / 2) * 5 + 5,
                0,
                7
            )
            x.stroke()
        }
        for (let j = 0; j < 21; j++) {
            f(j)
        }
    }
})
