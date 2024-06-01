import { GUI } from 'lil-gui'
import p5 from 'p5'
import '~/style.css'
import { Boid } from './boid'
import { Flock } from './flock'
import { Rectangle, Vec2 } from '../../helpers/trig-shapes'

new p5((p: p5) => {
    let fr: number | string
    let lastUpdateFr: number = 0
    let gui = new GUI()
    let flock: Flock
    let img: p5.Graphics
    let lastAddedBoid = 0
    let attractor = new Vec2()

    let debg = {
        perception: 20,
        add10: () => {
            for (let i = 0; i < 10; i++) {
                flock.add()
            }
        },
        remove10: () => {
            for (let i = 0; i < 10; i++) {
                flock.boids.pop()
            }
        },
        blendMode: p.BLEND,
    }

    p.setup = function () {
        p.createCanvas(800, 800)
        let w = p.width * 0.8
        let h = p.height * 0.8
        flock = new Flock(new Rectangle(0, 0, w, h), 4, 50)

        flock.mults.separate = 1.5
        flock.edgeMode = 'teleport'
        flock.defaultPerception = debg.perception

        // debg.perception =flock.defaultPerception

        for (let i = 0; i < 150; i++) {
            flock.add()
        }

        attractor.x = w / 2
        attractor.y = h / 2

        setupGui(gui, flock)

        img = p.createGraphics(p.width * 0.8, p.height * 0.8)
    }

    const beforeUpdateBoid = (boid: Boid, i: number) => {
        let force = boid.seek(attractor)
        boid.applyForce(force)
        let angle = Math.atan2(boid.velocity.y, boid.velocity.x)
        // img.fill(boid.acceleration.x * 255, 100, boid.acceleration.y * 255, 30)
        img.blendMode(debg.blendMode)
        // img.fill(Math.abs(angle) * (255 / Math.PI), 100, 255, 30)
        img.fill(
            (boid.x / img.width) * 200 + 50,
            Math.abs(angle) * (255 / Math.PI),
            (boid.y / img.height) * 100 + 150,
            (boid.velocity.mag() / flock.boidsMaxSpeed) * 50
        )
        img.noStroke()
        img.circle(boid.x, boid.y, 30)
    }

    const afterUpdateBoid = (boid: Boid) => {
        let angle = Math.atan2(boid.velocity.y, boid.velocity.x)
        // img.fill(boid.acceleration.x * 255, 100, boid.acceleration.y * 255, 30)
        p.fill(
            (boid.x / img.width) * 200 + 50,
            Math.abs(angle) * (255 / Math.PI),
            (boid.y / img.height) * 100 + 150,
            (boid.velocity.mag() / flock.boidsMaxSpeed) * 100
        )
        p.noStroke()
        p.circle(boid.x, boid.y, 30)

        if (flock.showPerception) {
            p.stroke(Math.abs(angle) * (255 / Math.PI), 100, 255)
            p.strokeWeight(1)
            p.noFill()
            p.circle(boid.x, boid.y, boid.perception * 2)
        }
    }

    p.draw = function () {
        let w = p.width * 0.8
        let h = p.height * 0.8

        p.background(230)
        p.push()
        p.translate((p.width - w) / 2, (p.height - h) / 2)

        let t = p.millis() * 0.001
        let x = Math.cos(t * 0.5 + Math.sin(t * 0.5))
        let y = Math.sin(t - Math.cos(x * 0.5 * t))

        attractor.x = x * (w * 0.6) + w / 2
        attractor.y = y * (h * 0.6) + w / 2

        p.image(img, 0, 0)

        p.stroke(0)
        p.strokeWeight(2)
        p.noFill()
        p.rect(0, 0, w, h)

        let ctx = p.drawingContext as CanvasRenderingContext2D
        ctx.beginPath()
        ctx.rect(0, 0, w, h)
        ctx.clip()

        if (p.mouseIsPressed && p.millis() - lastAddedBoid > 100) {
            flock.add(new Boid(p.mouseX - (p.width - w) / 2, p.mouseY - (p.height - h) / 2, flock))
            lastAddedBoid = p.millis()
        }

        flock.update()
        flock.flock(beforeUpdateBoid, afterUpdateBoid)

        p.stroke(0)
        p.strokeWeight(3)
        p.noFill()
        p.circle(attractor.x, attractor.y, 20)

        if (flock.useMouse) {
            p.noFill()
                .stroke(0)
                .strokeWeight(3)
                .circle(flock.mouse.x, flock.mouse.y, flock.mouse.radius * 2)
        }
        p.pop()

        perf()
    }

    // p.windowResized = function () {
    //     p.resizeCanvas(window.innerWidth, window.innerHeight)
    //     flock.quadTree.bounds = new Rectangle(0, 0, p.width * 0.8, p.height * 0.8)
    //     img.resizeCanvas(p.width * 0.8, p.height * 0.8)
    // }

    p.keyPressed = function () {
        console.log(p.key, p.keyCode)
        if (p.keyCode === 32) {
            flock.useMouse = !flock.useMouse
        }
    }

    p.mouseMoved = function () {
        flock.mouse.x = p.mouseX - (p.width - img.width) / 2
        flock.mouse.y = p.mouseY - (p.height - img.height) / 2
    }

    p.mousePressed = function () {
        flock.add(new Boid(flock.mouse.x, flock.mouse.y, flock))
    }

    function setupGui(gui: GUI, flock: Flock) {
        gui.close()
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
        gui.add(flock, 'showPerception')
        gui.add(flock, 'showQuadTree')
        gui.add(flock, 'edgeMode', ['teleport', 'bounce'])
        gui.add(debg, 'add10')
        gui.add(debg, 'remove10')
        gui.add(debg, 'blendMode', [
            p.OVERLAY,
            p.MULTIPLY,
            p.DARKEST,
            p.LIGHTEST,
            p.DIFFERENCE,
            p.EXCLUSION,
            p.HARD_LIGHT,
            p.SOFT_LIGHT,
            p.OVERLAY,
            p.DODGE,
            p.BURN,
            p.ADD,
            p.BLEND,
        ])
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
