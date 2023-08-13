import '../style.css'
import p5 from 'p5'
import { Pane } from 'tweakpane'

let palette = ['#f398c3', '#cf3895', '#a0d28d', '#06b4b0', '#fed000', '#FF8552']
let grads: CanvasGradient[] = []
let zs: number[] = []
let m: number

const PS = {
    precision: 49,
    step: 100,
    diff: 0.4,
    noiseScaleDenom: 0.8,
    noiseAmt: 0.54,
    radiusToStep: 0.42,
}

new p5((p: p5) => {
    let noiseSeed = 0

    function setVars() {
        m = p.min(p.width, p.height) * 0.9
        m = p.floor(m / PS.step) * PS.step
        let i = 0

        for (let x = 0; x < m; x += PS.step) {
            for (let y = 0; y < m; y += PS.step) {
                if (grads[i]) {
                    i++
                    continue
                }
                let gx = p.random(PS.step * -0.25, PS.step * 0.25)
                let gy = p.random(PS.step * -0.25, PS.step * 0.25)
                let grad = (
                    p.drawingContext as CanvasRenderingContext2D
                ).createRadialGradient(gx, gy, 0, gx, gy, PS.step)
                let ci1 = p.floor(p.random(palette.length))
                let ci2 = p.floor(p.random(palette.length))
                if (ci1 == ci2) ci2 = (ci1 + 1) % palette.length
                let c1 = palette[ci1]
                let c2 = palette[ci2]

                zs[i] = p.random(100, 500)
                grad.addColorStop(0, c1)
                grad.addColorStop(1, c2)
                grads.push(grad)
                i++
            }
        }
    }

    function randomize() {
        grads = []
        noiseSeed++
        p.noiseSeed(noiseSeed)
        setVars()
        p.redraw()
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        setVars()
        p.noLoop()

        let pane = new Pane()
        let folder = pane.addFolder({ title: 'settings' })
        folder.addInput(PS, 'precision', { min: 3, max: 180, step: 1 })
        folder.addInput(PS, 'step', { min: 10, max: 300, step: 1 })
        folder.addInput(PS, 'diff', { min: 0, max: 1, step: 0.1 })
        folder.addInput(PS, 'noiseScaleDenom', { min: 0, max: 10, step: 0.1 })
        folder.addInput(PS, 'noiseAmt', { min: 0, max: 2, step: 0.01 })
        folder.addInput(PS, 'radiusToStep', { min: 0.01, max: 0.5, step: 0.01 })

        folder
            .addButton({ title: 'noiseSeed++ (spacebar)' })
            .on('click', randomize)

        folder
            .addButton({ title: 'save' })
            .on('click', () => p.saveCanvas('noisy-circles'))

        pane.on('change', () => {
            setVars()
            p.redraw()
        })
    }

    p.draw = function () {
        p.background(10)
        let size = m
        let radius = PS.step * PS.radiusToStep
        p.push()
        p.translate(
            (p.width - size) / 2 + PS.step / 2,
            (p.height - size) / 2 + PS.step / 2
        )
        p.noStroke()
        let i = 0
        for (let x = 0; x < size; x += PS.step) {
            for (let y = 0; y < size; y += PS.step) {
                p.push()
                p.drawingContext.fillStyle = grads[i]
                let z = zs[i]
                circle(x, y, radius, z)
                p.noFill()
                p.stroke(255)
                p.strokeWeight(2)
                circle(x, y, radius, z + PS.diff)
                circle(x, y, radius, z + PS.diff * 2)

                p.pop()
                i++
            }
        }

        p.pop()
    }

    p.windowResized = function () {
        p.resizeCanvas(window.innerWidth, window.innerHeight)
        setVars()
        p.redraw()
    }

    p.keyPressed = function () {
        if (p.keyCode == 32) {
            randomize()
        }
    }

    function circle(x: number, y: number, r: number, noiseZ?: number) {
        let noiseScale = PS.noiseScaleDenom / r
        let noiseAmt = r * PS.noiseAmt
        p.push()
        p.translate(x, y)
        p.rotate(p.noise(y + PS.step, x - y) * p.TWO_PI)
        p.beginShape()
        let xx
        let yy
        if (!noiseZ) noiseZ = x - y
        let angleStep = p.TWO_PI / PS.precision
        for (let i = -1; i <= PS.precision + 1; i++) {
            let angle = angleStep * i
            xx = p.cos(angle) * r
            yy = p.sin(angle) * r
            xx += p.map(
                p.noise(noiseScale * xx, noiseScale * yy, noiseZ),
                0,
                1,
                -noiseAmt,
                noiseAmt
            )
            yy += p.map(
                p.noise(noiseScale * xx, noiseScale * yy, noiseZ),
                0,
                1,
                -noiseAmt,
                noiseAmt
            )
            p.curveVertex(xx, yy)
        }

        p.endShape()
        p.pop()
    }
}, document.getElementById('sketch') ?? undefined)
