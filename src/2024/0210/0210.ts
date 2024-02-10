import '../../style.css'
import p5 from 'p5'
import { leaf } from './leaf'

new p5((p: p5) => {
    let coords: number[][]
    let current: number = 0
    let pixelCount: number

    let done = false

    function setup() {
        coords = leaf
        current = 0
        pixelCount = p.width * p.height

        let xvals = coords.map((c) => c[0])
        let yvals = coords.map((c) => c[1])
        let xmin = Math.min(...xvals)
        let xmax = Math.max(...xvals)
        let ymin = Math.min(...yvals)
        let ymax = Math.max(...yvals)

        // scale the coordinates to fit the canvas
        coords = coords.map((c) => [
            p.map(c[0], xmin, xmax, 40, p.width - 40),
            p.map(c[1], ymin, ymax, 40, p.height - 40),
        ])
    }

    p.setup = () => {
        p.createCanvas(500, 500)
        p.pixelDensity(1)
        p.background('#fff')
        setup()
    }

    p.draw = () => {
        p.fill('#000')
        if (done) return

        p.loadPixels()

        let i = 0
        while (i < 1000) {
            let px = current % p.width
            let py = p.floor(current / p.width)
            let pixel = current * 4
            let closest = getClosest(px, py, coords)
            let amount = p.map(closest[1], 0, 5, 250, 0)
            amount = p.constrain(amount, 0, 250)
            p.pixels[pixel] = 250
            p.pixels[pixel + 1] = amount
            p.pixels[pixel + 2] = amount
            p.pixels[pixel + 3] = 255
            current++
            if (current >= pixelCount) {
                done = true
                break
            }
            i += p.floor(p.random(1, 10))
        }
        // let drawnCount = 0
        // for (let i = 0; i < 200; i++) {
        //     let pixelCoords = getRandomBlankPixel()
        //     if (!pixelCoords) continue
        //     let [x, y] = pixelCoords
        //     drawnCount++
        //     drawPoint(x, y)
        // }

        p.updatePixels()
    }

    function getRandomBlankPixel(): [number, number] | undefined {
        let x = p.floor(p.random(p.width))
        let y = p.floor(p.random(p.height))
        let pixel = (x + y * p.width) * 4

        let tries = 0
        let maxTries = 5
        while (tries < maxTries) {
            if (p.pixels[pixel] === 255) {
                return [x, y]
            }
            x = p.floor(p.random(p.width))
            y = p.floor(p.random(p.height))
            pixel = (x + y * p.width) * 4

            tries++
        }
    }

    function getClosest(x: number, y: number, coords: number[][]) {
        return coords.reduce(
            (acc, c, i) => {
                let d = p.dist(x, y, c[0], c[1])
                if (d < acc[1]) {
                    return [i, d]
                }
                return acc
            },
            [0, Infinity]
        )
    }

    function drawPoint(x: number, y: number) {
        let pixel = (x + y * p.width) * 4
        let closest = getClosest(x, y, coords)
        let amount = p.map(closest[1], 0, 100, 250, 0)
        amount = p.constrain(amount, 0, 250)
        p.pixels[pixel] = 250
        p.pixels[pixel + 1] = amount
        p.pixels[pixel + 2] = amount
        p.pixels[pixel + 3] = 255
    }
}, document.getElementById('sketch') ?? undefined)
