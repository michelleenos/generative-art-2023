import '../style.css'

// https://www.bit-101.com/blog/2022/11/coding-curves-02-trig-curves/

function createCanvas(width, height) {
    const canvas = document.createElement('canvas')
    let resolution = window.devicePixelRatio
    canvas.width = width * resolution
    canvas.height = height * resolution
    canvas.style.position = 'absolute'
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    document.body.appendChild(canvas)

    let ctx = canvas.getContext('2d')!
    ctx.scale(resolution, resolution)
    return { canvas, ctx }
}

let width = 800
let height = 800

let { canvas, ctx } = createCanvas(width, height)

function sineWave(x0, y0, x1, y1, wavelen, amp) {
    let dx = x1 - x0
    let dy = y1 - y0
    let dist = Math.sqrt(dx * dx + dy * dy)
    let angle = Math.atan2(dy, dx)

    ctx.save()
    ctx.translate(x0, y0)
    ctx.rotate(angle)
    ctx.beginPath()
    for (let x = 0; x < dist; x++) {
        let y = Math.sin((x / wavelen) * Math.PI * 2) * amp
        ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.restore()
}

ctx.strokeStyle = '#fff'
sineWave(10, 400, width - 10, 400, 50, 50)

export {}
