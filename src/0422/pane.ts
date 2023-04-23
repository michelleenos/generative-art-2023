import { Pane } from 'tweakpane'
import p5 from 'p5'
import { Particle } from '../helpers/particles/particle'
import { DragBox } from '~/helpers/friction-drag'

function setPane(PARAMS, p, boxes: DragBox[], particles, setup: () => void) {
    let pane = new Pane()

    pane.addInput(PARAMS, 'boxSize', { min: 0, max: 1 }).on('change', () => {
        boxes.forEach((b) => (b.size = p.width * PARAMS.boxSize))
    })
    pane.addInput(PARAMS, 'boxDrag', { min: 0, max: 0.1 }).on('change', () => {
        boxes.forEach((b) => (b.cd = PARAMS.boxDrag))
    })

    pane.addButton({ title: 'add 5 particles' }).on('click', () => {
        for (let i = 0; i < 5; i++) {
            let mass = p.random(0.7, 1.3)
            let particle = new Particle(p.random(p.width), p.random(p.height), {
                radius: mass * 8,
                mass,
                velInit: new p5.Vector(p.random(-1, 1), p.random(-1, 1)),
            })
            particles.push({ particle, highlight: false })
        }
    })
    pane.addButton({ title: 'restart' }).on('click', () => {
        setup()
        p.loop()
    })
    pane.addButton({ title: 'save canvas' }).on('click', p.saveCanvas)

    return pane
}

export default setPane
