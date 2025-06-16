import p5 from 'p5'
import '~/style.css'
import { getPaletteContexts } from 'mish-bainrow'

let pals = getPaletteContexts({
    isolateColors: true,
    minContrastBg: 0.2,
    minColors: 3,
    bgShade: { type: 'dark', limit: 20 },
})

new p5((p: p5) => {
    let pts: p5.Vector[] = []
    p.setup = () => {
        p.createCanvas(400, 400)

        for (let i = 0; i < 100; i++) {
            pts.push(p.createVector(p.random(p.width), p.random(p.height)))
        }
    }

    p.draw = () => {
        p.noLoop()
    }
}, document.getElementById('sketch') ?? undefined)
