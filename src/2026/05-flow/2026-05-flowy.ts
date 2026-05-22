import '~/style.css'
import createCanvas from '~/helpers/create-canvas'
import loop from '~/helpers/loop'
import { clamp, random, shuffle } from '~/helpers/utils'

const width = 800
const height = 800
const { ctx } = createCanvas(width, height)

// 2, 10, 3, 5
let vals = [random(2, 5), random(5, 15) * random([-1, 1]), random(5), random(5, 15)]
// let vals = [2, 10, 3, 5]
vals = [1, -10, 3, 10]
function getForceFromVals(x: number, y: number, t: number) {
    const fx = Math.sin(x * vals[0] + Math.cos(y * vals[1]))
    const fy = -Math.cos(y * vals[2] - Math.sin(x * vals[3]))
    // const fx = Math.sin(x * 2 + Math.cos(y * 9.8))
    // const fy = -Math.cos(y * 3 - Math.sin(x * 5))
    let a = Math.atan2(fy, fx)
    return [Math.cos(a), Math.sin(a)]
}

let particles: { x: number; y: number }[] = []
for (let i = 0; i < 1000; i++) {
    particles.push({ x: random(-width / 2, width / 2), y: random(-height / 2, height / 2) })
}

ctx.fillStyle = '#111111'
ctx.fillRect(0, 0, width, height)
let scale = 1 / width
let offset = scale * 50
function draw(t: number) {
    ctx.save()
    ctx.translate(width / 2, height / 2)
    ctx.strokeStyle = '#fafafa'
    particles.forEach((p) => {
        let [fx, fy] = getForceFromVals(p.x * scale + offset, p.y * scale + offset, t)
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        p.x += fx * 1
        p.y += fy * 1
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
    })

    ctx.restore()
}

loop(draw)
