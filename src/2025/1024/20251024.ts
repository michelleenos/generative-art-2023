import p5 from 'p5'
import '~/style.css'
import { getPaletteContexts } from 'mish-bainrow'
import { createNoise2D, NoiseFunction2D } from 'simplex-noise'
import Alea from 'alea'

let pals = getPaletteContexts({
    isolateColors: true,
    minContrastBg: 0.2,
    minColors: 3,
    bgShade: { type: 'dark', limit: 20 },
})

new p5((p: p5) => {
    let noise: NoiseFunction2D
    p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight)

        const alea = Alea()
        const seed = alea()

        console.log(seed)
        // noise = createNoise2D(() => 0.36136409151367843)
        // noise = createNoise2D(() => 0.7329279000405222)
        noise = createNoise2D()
    }

    p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight)
    }

    p.draw = () => {
        let w: number
        let h: number
        let aspect = 0.6
        w = p.width * 0.8
        if (w * aspect > p.height) {
            h = p.height * 0.9
            w = h * (1 / aspect)
        } else {
            w = p.width * 0.8
            h = w * aspect
        }

        w = p.floor(w)
        h = p.floor(h)

        // const m = p.min(p.width * 0.8, p.height)

        // p.push()

        p.translate((p.width - w) / 2, (p.height - h) / 2)

        p.stroke(255, 255, 255)
        p.noFill()
        p.strokeWeight(2)
        p.background(10, 10, 10)

        let noisePoint = p.createVector(w * 0.5, h * 0.5)

        let maxDist = noisePoint.dist(p.createVector(0, 0))

        let ns: number[] = []
        let dists: number[] = []
        console.log(noisePoint.y)

        for (let x = 10; x < w; x += 20) {
            let points: [number, number][] = []
            p.beginShape()

            for (let y = 0; y < h; y += 3) {
                // let dist = 1 - noisePoint.dist(p.createVector(x, y)) / maxDist
                let xDist = p.abs(noisePoint.x - x) / noisePoint.x
                let yDist = (noisePoint.y - y) / (noisePoint.y * 0.5)

                let distanceToCenter = Math.abs(y - h / 2)
                let distancePercent = 1 - distanceToCenter / (h / 2)

                let variance = 5 * distancePercent

                // let dist = 1 - noisePoint.dist(p.createVector(x, y)) / maxDist
                // dist *= dist
                // dists.push(dist)
                // let n = noise(x * 0.0001, y * 0.004)
                // let n = p.noise(x * 0.001, y * 0.004)
                let n = p.random()
                // n = p.map(n, -1, 1, 0, 1)

                // n *= xDist
                n *= variance
                // n *= w * 0.3
                ns.push(n)

                // if (x === 310 && y > 205 && y < 240) {
                //     console.log(y, dist, n1, n)
                // }

                p.vertex(x + n, y)
            }

            p.endShape()
        }

        //     points.forEach(([x, y]) => p.vertex(x, y))

        //     // p.beginShape()

        //     for (let y = noisePoint.y + 10; y < h; y += 10) {
        //         let xDist = p.abs(noisePoint.x - x) / noisePoint.x
        //         let yDist = p.abs(noisePoint.y - y) * 0.01
        //         // dists.push(dist)
        //         let n1 = noise(x * 0.0001, y * 0.005)

        //         // n *= xDist
        //         let n = n1
        //         n *= yDist
        //         n *= w * 0.1
        //         ns.push(n)

        //         if (x === 310 && y > 205 && y < 240) {
        //             console.log(y, yDist, n1, n)
        //         }

        //         p.vertex(x + n, y)
        //         points.push([x, y])
        //     }

        //     // let n1 = noise(noisePoint.x * 0.0001, noisePoint.y * 0.005)

        //     p.endShape()
        // }

        console.log({
            max: p.max(ns),
            min: p.min(ns),
            maxDist: p.max(dists),
            minDists: p.min(dists),
        })

        p.noLoop()
    }
}, document.getElementById('sketch') ?? undefined)
