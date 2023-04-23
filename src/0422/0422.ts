import '../style.css'
import p5 from 'p5'

import { Particle, type ParticleOpts } from '../helpers/particles/particle'
import { DragBox, getFriction, getDrag } from '../helpers/friction-drag'

import setPane from './pane'

import makeImages from '~/helpers/canvas-images'

const PARAMS = {
    size: 400,
    attractorLocRandom: true,
    nBoxes: 0,
    nParticles: 10,
    xPartMin: 0.5,
    xPartMax: 0.7,
    yPartMin: 0,
    yPartMax: 1,
    nxParticles: 15,
    nyParticles: 2,
    boxDrag: 0.05,
    boxSize: 0.25,
    attractorsN: 1,
    attractorPos: [
        [0.5, 0.5],
        [0.85, 0.55],
    ],
    attractorMass: [5, 10],
    aConstrainMin: 5,
    aConstrainMax: 25,
    particlesGrid: true,
    weightH: 1,
    weight: 1,
    alpha: 0.2,
    alphaH: 0.6,
    gravityConstant: 1.5,
}

let sketch = new p5((p: p5) => {
    let particles: { particle: Particle; highlight: boolean }[] = []
    let img: p5.Graphics = p.createGraphics(600, 600)
    let boxes: DragBox[] = []
    let attractors: Particle[] = []
    let STOPANDSAVEIMG = false
    let SAVESHOWATTRACTORS = false
    let translate = new p5.Vector(0, 0)
    let recorder

    let pane = setPane(PARAMS, p, boxes, particles, setStuff)
    pane.addButton({ title: 'save image' }).on('click', () => {
        STOPANDSAVEIMG = true
    })
    pane.addButton({ title: 'save image with attractors' }).on('click', () => {
        STOPANDSAVEIMG = true
        SAVESHOWATTRACTORS = true
    })

    function setStuff() {
        makeBoxes()
        makeParticles(PARAMS.particlesGrid)
        makeAttractors(PARAMS.attractorsN)
        img = p.createGraphics(p.width, p.height)
        img.colorMode(p.HSL)
        translate.set(
            p.width / 2 - PARAMS.size / 2,
            p.height / 2 - PARAMS.size / 2
        )
    }

    function makeBoxes() {
        boxes = []
        for (let i = 0; i < PARAMS.nBoxes; i++) {
            let boxx = p.random(p.width)
            let boxy = p.random(p.height)
            boxes.push(
                new DragBox(
                    boxx,
                    boxy,
                    p.width * 0.25,
                    p.height * 0.25,
                    PARAMS.boxDrag
                )
            )
        }
    }

    function makeParticles(grid = false) {
        particles = []
        if (grid) return makeParticlesGrid()
        let n = PARAMS.nParticles
        for (let i = 0; i < PARAMS.nParticles; i++) {
            // let mass = p.random(0.7, 1.3)
            let mass = 1

            // let a = p.atan2(posY - attractor.y, posX - attractor.x)
            // velInit.setHeading(a).mult(-1) // point particle directly at attractor
            particles.push({
                particle: new Particle(p.random(p.width), p.random(p.height), {
                    radius: mass * 8,
                    mass,
                    velInit: new p5.Vector(p.random(-1, 1), p.random(-1, 1)),
                }),
                highlight: false,
            })
        }
    }

    function isHighlighted(x, y) {
        let vals = [1, -1]
        return (
            (x === vals[0] && y === vals[1]) || (x === vals[1] && y === vals[0])
        )
    }

    function makeParticlesGrid() {
        let nx = PARAMS.nxParticles
        let ny = PARAMS.nyParticles
        for (let x = 0; x < nx; x++) {
            for (let y = 0; y < ny; y++) {
                // if (x === y) continue
                // let mass = p.random(0.7, 1.3)
                let mass = 1
                let posX = p.map(
                    x,
                    0,
                    nx - 1,
                    PARAMS.size * PARAMS.xPartMin,
                    PARAMS.size * PARAMS.xPartMax
                )
                let posY = p.map(
                    y,
                    0,
                    ny - 1,
                    PARAMS.size * PARAMS.yPartMin,
                    PARAMS.size * PARAMS.yPartMax
                )
                // posX = 0
                // posY = 0
                let highlight = isHighlighted(x, y)

                let particle = new Particle(posX, posY, {
                    radius: mass * 8,
                    mass,
                    velInit: new p5.Vector(
                        p.map(x, 0, nx - 1, -1, 0),
                        p.map(y, 0, ny - 1, -0.5, 0.5)
                    ),
                })

                particles.push({ particle, highlight })
            }
        }
    }

    function makeAttractors(n) {
        for (let i = 0; i < n; i++) {
            let attractor = makeAttractor(
                PARAMS.attractorPos[i][0],
                PARAMS.attractorPos[i][1],
                PARAMS.attractorMass[i]
            )
            attractors.push(attractor)
        }
    }

    function makeAttractor(ax?: number, ay?: number, mass: number = 10) {
        ax = ax ? ax * PARAMS.size : p.random(PARAMS.size)
        ay = ay ? ay * PARAMS.size : p.random(PARAMS.size)
        // let ax = PARAMS.size * PARAMS.ax
        // let ay = PARAMS.size * PARAMS.ay

        let attractor = new Particle(ax, ay, {
            mass: mass,
            radius: 40,
        })
        attractor.constraint = {
            min: PARAMS.aConstrainMin,
            max: PARAMS.aConstrainMax,
        }
        return attractor
    }

    p.setup = () => {
        let canvas = p.createCanvas(600, 600)
        p.angleMode(p.RADIANS)
        setStuff()

        recorder = makeImages(canvas.elt, 0)
        p.noLoop()

        // doLoop()
    }

    p.draw = () => {
        p.background(10)

        if (STOPANDSAVEIMG) {
            if (SAVESHOWATTRACTORS) {
                img.stroke(200)
                img.strokeWeight(3)
                img.fill(100, 0.36)
                img.translate(translate)
                attractors.forEach((attractor) => attractor.draw(img))
            }
            p.image(img, 0, 0)

            p.noLoop()
            img.noLoop()
            p.saveCanvas('image', 'jpg')
            return
        }

        p.push()
        img.push()
        p.translate(translate)
        img.translate(translate)

        p.stroke(100, 100)
        p.strokeWeight(2)
        p.fill(50, 100)
        attractors.forEach((attractor) => attractor.draw(p))

        p.fill(200, 100)
        p.noStroke()

        img.strokeWeight(0.5)

        boxes.forEach((box) => {
            p.fill(200, p.map(box.cd, 0.005, 0.08, 0, 100))
            box.draw(p)
        })

        const doParticles = (draw = true) => {
            particles.forEach((item, i) => {
                let particle = item.particle
                let prev = particle.copy()

                attractors.forEach((attractor) => {
                    let gravity = attractor.attract(
                        particle,
                        PARAMS.gravityConstant
                    )
                    particle.applyForce(gravity.mult(particle.mass))
                })

                boxes.forEach((box) => {
                    if (box.contains(particle)) {
                        let drag = getDrag(particle.velocity, box.cd)
                        particle.applyForce(drag)
                    }
                })

                particle.update()

                if (draw) particle.draw(p)

                let mag = particle.velocity.mag()
                img.strokeWeight(
                    item.highlight ? PARAMS.weightH : PARAMS.weight
                )
                let hue = p.map(mag, 0, 4, 200, 300)

                img.stroke(
                    hue,
                    50,
                    50,
                    item.highlight ? PARAMS.alphaH : PARAMS.alpha
                )
                img.line(prev.x, prev.y, particle.x, particle.y)
            })
        }

        doParticles(false)
        doParticles(false)
        doParticles()

        img.pop()
        p.pop()
        p.image(img, 0, 0)
    }

    function doLoop() {
        if (recorder) {
            p.redraw()
            recorder.getImage().then(() => {
                console.log(p.frameCount)
                if (p.frameCount > 1700) {
                    recorder.downloadZip()
                    return
                }
                doLoop()
            })
        }
    }
})
