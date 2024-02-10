import '../../style.css'
import p5 from 'p5'

import { Particle } from '../../helpers/particles/particle'
import { DragBox, getDrag } from '../../helpers/friction-drag'

import setPane from './pane'

import makeImages from '~/helpers/canvas-images'
let RECORD = false

const PARAMS = {
    a1: {
        mass: 15,
        pos: { x: 0.5, y: 0.5 },
        enable: true,
    },
    a2: {
        mass: 10,
        pos: { x: 0.2, y: 0.3 },
        enable: false,
    },
    particles: {
        type: 'grid',
        nRandom: 10,
        nx: 8,
        ny: 5,
        gridXMin: 0.1,
        gridXMax: 0.6,
        gridYMin: 0.9,
        gridYMax: 1,
        initVelX: '-1',
        initVelY: '-1',
    },
    gravityConstant: 1.5,
    size: 400,
    nBoxes: 0,
    boxDrag: 0.05,
    boxSize: 0.25,
    aConstrainMin: 5,
    aConstrainMax: 25,
    weight: 1,
    alpha: 0.2,
    alphaH: 0.8,
    showAttractors: true,
}

new p5((p: p5) => {
    let particles: { particle: Particle; highlight: boolean }[] = []
    let img: p5.Graphics = p.createGraphics(600, 600)
    let boxes: DragBox[] = []
    let attractors: Particle[] = []
    let STOPANDSAVEIMG = false
    let translate = new p5.Vector(0, 0)
    let recorder

    let initVelFunctions: { [key: string]: (i?: any, n?: any) => number } = {
        '-1': () => -1,
        '1': () => 1,
        '0': () => 0,
        random: () => p.random(-1, 1),
        'map -1 to 1': (i, n) => p.map(i, 0, n - 1, -1, 1),
        'map -0.5 to 0.5': (i, n) => p.map(i, 0, n - 1, -0.5, 0.5),
        'map 0 to 1': (i, n) => p.map(i, 0, n - 1, 0, 1),
        'map -1 to 0': (i, n) => p.map(i, 0, n - 1, -1, 0),
        'map 1 to -1': (i, n) => p.map(i, 0, n - 1, 1, -1),
        'map 0.5 to -0.5': (i, n) => p.map(i, 0, n - 1, 0.5, -0.5),
    }

    let initVelOpts = {
        '-1': '-1',
        '1': '1',
        '0': '0',
        random: 'random',
        'map -1 to 1': 'map -1 to 1',
        'map -0.5 to 0.5': 'map -0.5 to 0.5',
        'map 0 to 1': 'map 0 to 1',
        'map -1 to 0': 'map -1 to 0',
        'map 1 to -1': 'map 1 to -1',
        'map 0.5 to -0.5': 'map 0.5 to -0.5',
    }

    let pane = setPane(PARAMS, p, initVelOpts, makeParticles, setStuff)

    function setStuff() {
        makeBoxes()
        if (PARAMS.particles.type === 'grid') {
            makeParticlesGrid()
        } else {
            makeParticles()
        }
        makeAttractors()
        if (img) img.remove()
        img = p.createGraphics(p.width, p.height)
        img.colorMode(p.HSL)
        translate.set(p.width / 2 - PARAMS.size / 2, p.height / 2 - PARAMS.size / 2)
    }

    function makeBoxes() {
        boxes = []
        for (let i = 0; i < PARAMS.nBoxes; i++) {
            let boxx = p.random(p.width)
            let boxy = p.random(p.height)
            boxes.push(new DragBox(boxx, boxy, p.width * 0.25, p.height * 0.25, PARAMS.boxDrag))
        }
    }

    function makeParticles(n = PARAMS.particles.nRandom, reset = true) {
        if (reset) particles = []
        for (let i = 0; i < n; i++) {
            let mass = 1

            particles.push({
                particle: new Particle(p.random(PARAMS.size), p.random(PARAMS.size), {
                    radius: mass * 8,
                    mass,
                    velInit: new p5.Vector(
                        initVelFunctions[PARAMS.particles.initVelX](),
                        initVelFunctions[PARAMS.particles.initVelY]()
                    ),
                }),
                highlight: false,
            })
        }
    }

    function isHighlighted(x, y) {
        let vals = [2, 2]
        return (x === vals[0] && y === vals[1]) || (x === vals[1] && y === vals[0])
    }

    function makeParticlesGrid() {
        particles = []
        let nx = PARAMS.particles.nx
        let ny = PARAMS.particles.ny
        for (let x = 0; x < nx; x++) {
            for (let y = 0; y < ny; y++) {
                let mass = 1
                let posX =
                    p.map(x, 0, nx - 1, PARAMS.particles.gridXMin, PARAMS.particles.gridXMax) *
                    PARAMS.size
                if (nx === 1)
                    posX =
                        p.map(0.5, 0, 1, PARAMS.particles.gridXMin, PARAMS.particles.gridXMax) *
                        PARAMS.size
                let posY =
                    p.map(y, 0, ny - 1, PARAMS.particles.gridYMin, PARAMS.particles.gridYMax) *
                    PARAMS.size
                if (ny === 1)
                    posY =
                        p.map(0.5, 0, 1, PARAMS.particles.gridYMin, PARAMS.particles.gridYMax) *
                        PARAMS.size

                let highlight = isHighlighted(x, y)

                let particle = new Particle(posX, posY, {
                    radius: mass * 8,
                    mass,
                    velInit: new p5.Vector(
                        initVelFunctions[PARAMS.particles.initVelX](x, nx),
                        initVelFunctions[PARAMS.particles.initVelY](y, ny)
                    ),
                })

                particles.push({ particle, highlight })
            }
        }
    }

    function makeAttractors() {
        attractors = []
        if (PARAMS.a1.enable) {
            attractors.push(makeAttractor(PARAMS.a1.pos.x, PARAMS.a1.pos.y, PARAMS.a1.mass))
        }

        if (PARAMS.a2.enable) {
            attractors.push(makeAttractor(PARAMS.a2.pos.x, PARAMS.a2.pos.y, PARAMS.a2.mass))
        }
    }

    function makeAttractor(ax: number, ay: number, mass: number = 10) {
        ax = ax * PARAMS.size
        ay = ay * PARAMS.size

        let attractor = new Particle(ax, ay, {
            mass: mass,
            radius: 40,
        })
        return attractor
    }

    p.setup = () => {
        let canvas = p.createCanvas(600, 600)
        p.angleMode(p.RADIANS)
        setStuff()

        recorder = makeImages(canvas.elt)

        if (RECORD) {
            p.noLoop()
            doLoop()
        }

        pane.addButton({ title: 'save canvas' }).on('click', () => p.saveCanvas(canvas))
        pane.addButton({ title: 'save image (only overlay)' }).on('click', () => {
            STOPANDSAVEIMG = true
        })
    }

    p.draw = () => {
        p.background(10)

        if (STOPANDSAVEIMG) {
            p.image(img, 0, 0)

            p.noLoop()
            img.noLoop()
            p.saveCanvas('image', 'jpg')
            STOPANDSAVEIMG = false
            return
        }

        p.push()
        img.push()
        p.translate(translate)
        img.translate(translate)

        p.stroke(100, 100)
        p.strokeWeight(2)
        p.fill(50, 100)
        if (PARAMS.showAttractors) attractors.forEach((attractor) => attractor.draw(p))

        p.fill(200, 100)
        p.noStroke()

        img.strokeWeight(0.5)

        boxes.forEach((box) => {
            p.fill(200, p.map(box.cd, 0.005, 0.08, 0, 100))
            box.draw(p)
        })

        const doParticles = (draw = true) => {
            particles.forEach((item) => {
                let particle = item.particle
                let prev = particle.copy()

                attractors.forEach((attractor) => {
                    let gravity = attractor.attract(particle, {
                        G: PARAMS.gravityConstant,
                        min: PARAMS.aConstrainMin,
                        max: PARAMS.aConstrainMax,
                    })
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
                    // item.highlight ? PARAMS.weightH : PARAMS.weight
                    PARAMS.weight
                )
                let hue = p.map(mag, 0, 4, 200, 300)

                img.stroke(hue, 50, 50, PARAMS.alpha)
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
