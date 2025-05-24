import '~/style.css'
import p5 from 'p5'

import { p5Particle as Particle } from '~/helpers/p5-particle'

import setPane from './pane'

export const PARAMS = {
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
        highlight: 5,
    },
    gravityConstant: 1.5,
    size: 400,
    canvasSize: 600,
    aConstrainMin: 5,
    aConstrainMax: 25,

    draw: {
        saturation: 50,
        lightness: 50,
        strokeWeight: 1,
        highlightStrokeWeight: 5,
        alpha: 0.2,
        highlightAlpha: 0.8,
        showAttractors: true,
        showParticles: true,
        hueMin: 200,
        hueMax: 300,
    },
}

new p5((p: p5) => {
    // let particles: Particle[] = []
    let particleItems: { particle: Particle; points: { x: number; y: number }[] }[] = []
    let img: p5.Graphics
    let attractors: Particle[] = []
    let STOPANDSAVEIMG = false
    let translate = new p5.Vector(0, 0)

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
        if (PARAMS.particles.type === 'grid') {
            makeParticlesGrid()
        } else {
            makeParticles()
        }
        makeAttractors()
        if (img) img.remove()
        img = p.createGraphics(p.width, p.height)
        img.strokeCap(p.SQUARE)
        img.colorMode(p.HSL)
        translate.set(p.width / 2 - PARAMS.size / 2, p.height / 2 - PARAMS.size / 2)
    }

    function makeParticles(n = PARAMS.particles.nRandom, reset = true) {
        if (reset) particleItems = []
        for (let i = 0; i < n; i++) {
            let mass = 1

            particleItems.push({
                particle: new Particle(p.random(PARAMS.size), p.random(PARAMS.size), {
                    radius: mass * 8,
                    mass,
                    velInit: new p5.Vector(
                        initVelFunctions[PARAMS.particles.initVelX](),
                        initVelFunctions[PARAMS.particles.initVelY]()
                    ),
                }),
                points: [],
            })
        }
    }

    function makeParticlesGrid() {
        particleItems = []
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

                let particle = new Particle(posX, posY, {
                    radius: mass * 8,
                    mass,
                    velInit: new p5.Vector(
                        initVelFunctions[PARAMS.particles.initVelX](x, nx),
                        initVelFunctions[PARAMS.particles.initVelY](y, ny)
                    ),
                })

                particleItems.push({ particle, points: [] })
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
        let canvas = p.createCanvas(PARAMS.canvasSize, PARAMS.canvasSize)
        p.angleMode(p.RADIANS)
        setStuff()

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
        if (PARAMS.draw.showAttractors) attractors.forEach((attractor) => attractor.draw(p))

        p.fill(200, 100)
        p.noStroke()

        const doParticles = (draw = true) => {
            particleItems.forEach(({ particle }, i) => {
                let prev = particle.copy()

                attractors.forEach((attractor) => {
                    let gravity = attractor.attract(particle, {
                        G: PARAMS.gravityConstant,
                        min: PARAMS.aConstrainMin,
                        max: PARAMS.aConstrainMax,
                    })
                    particle.applyForce(gravity.mult(particle.mass))
                })

                particle.update()

                let mag = particle.velocity.mag()

                let alpha = PARAMS.draw.alpha
                if (PARAMS.particles.highlight === i) {
                    img.strokeWeight(PARAMS.draw.highlightStrokeWeight)
                    alpha = PARAMS.draw.highlightAlpha
                    // console.log('highlighted', PARAMS.draw.highlightStrokeWeight)
                } else {
                    img.strokeWeight(PARAMS.draw.strokeWeight)
                }

                let hue = p.map(mag, 0, 4, PARAMS.draw.hueMin, PARAMS.draw.hueMax)

                img.stroke(hue, PARAMS.draw.saturation, PARAMS.draw.lightness, alpha)
                img.line(prev.x, prev.y, particle.x, particle.y)

                if (draw) particle.draw(p)
            })
        }

        doParticles(false)
        doParticles(false)
        doParticles(PARAMS.draw.showParticles)

        img.pop()
        p.pop()
        p.image(img, 0, 0)
    }
})
