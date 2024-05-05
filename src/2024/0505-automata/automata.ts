import { GUI } from 'lil-gui'
import p5 from 'p5'
import '~/style.css'
import { Flock } from './boid'
import { Rectangle } from './shapes'

new p5((p: p5) => {
    let fr: number | string
    let lastUpdateFr: number = 0
    let gui = new GUI()
    let flock: Flock

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        let w = p.width * 0.8
        let h = p.height * 0.8
        flock = new Flock(new Rectangle(0, 0, w, h), 4, 50)

        flock.mults.separate = 1.5

        for (let i = 0; i < 150; i++) {
            flock.add()
        }

        flock.boids[0].setHighlight(true)
        setupGui(gui, flock)
    }

    p.draw = function () {
        let w = p.width * 0.8
        let h = p.height * 0.8

        p.background(230)
        p.push()
        p.translate((p.width - w) / 2, (p.height - h) / 2)

        flock.update()
        flock.flock(p)

        p.stroke(0)
        p.strokeWeight(2)
        p.noFill()
        p.rect(0, 0, w, h)

        p.pop()

        perf()
    }

    p.windowResized = function () {
        p.resizeCanvas(window.innerWidth, window.innerHeight)
        flock.quadTree.bounds = new Rectangle(0, 0, p.width * 0.8, p.height * 0.8)
    }

    function setupGui(gui: GUI, flock: Flock) {
        let debg = {
            perception: flock.defaultPerception,
        }

        gui.add(flock.mults, 'separate', 0, 5, 0.1)
        gui.add(flock.mults, 'cohere', 0, 5, 0.1)
        gui.add(flock.mults, 'align', 0, 5, 0.1)
        gui.add(flock.mults, 'bounds', 0, 5, 0.1)
        gui.add(debg, 'perception', 0, 200, 1).onChange((v: number) => {
            flock.setBoidsPerception(v)
        })
        gui.add(flock, 'boidsMaxForce', 0, 1, 0.01)
        gui.add(flock, 'boidsMass', 0, 5, 0.1)
        gui.add(flock, 'boidsMaxSpeed', 0, 10, 0.1)
    }

    function perf() {
        p.fill(0)
        p.noStroke()
        p.text(fr, 10, 20)
        if (p.millis() - lastUpdateFr > 250) {
            fr = p.frameRate().toFixed(0)
            lastUpdateFr = p.millis()
        }
    }
}, document.getElementById('sketch') ?? undefined)
