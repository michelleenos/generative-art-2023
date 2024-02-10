import '../style.css'
import p5 from 'p5'

new p5((p: p5) => {
    p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight)
    }

    p.draw = () => {}
}, document.getElementById('sketch') ?? undefined)
