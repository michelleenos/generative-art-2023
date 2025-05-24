import '~/style.css'
import createCanvas from '~/helpers/create-canvas'
import { Sizes } from '~/helpers/sizes'
import { clamp, map, random } from '~/helpers/utils'
import { createNoise2D, NoiseFunction2D } from 'simplex-noise'
import alea from 'alea'

const sizes = new Sizes()

const { ctx, canvas, resizeCanvas } = createCanvas(sizes.width, sizes.height)

let cellSize = 200
let palette = ['#d92332', '#f28705', '#f2e0c9']
let seed = alea()()
console.log(seed)
// 0.9017155373003334
// 0.2422418629284948
// 0.7694214957300574
// 0.3454599294345826
// 0.638447534525767
// 0.3236903080251068
// 0.5611425142269582
let simplexNoise2d = createNoise2D(() => seed)

const fbm2d = (noise2D: NoiseFunction2D, octaves: number): NoiseFunction2D => {
    return function fbmFn(x: number, y: number) {
        let value = 0
        let amplitude = 0.5
        for (let i = 0; i < octaves; i++) {
            value += noise2D(x, y) * amplitude
            x *= 0.5
            y *= 0.5
            amplitude *= 0.8
        }
        return value
    }
}

const myNoise = (noise2D: NoiseFunction2D) => {
    let freq1 = 0.5
    let freq2 = 0.6

    return function (x: number, y: number) {
        let n1 = noise2D(x * freq1, y * freq1)
        let n2 = noise2D(-x * freq2, -y * freq2)
        // let r = random([n1, n2, n1 * n2])
        return noise2D(n2, n1)
        // return clamp(r, -1, 1)
    }
}

let noise2d = myNoise(simplexNoise2d)
let noiseScale = 0.1

const draw = () => {
    let cellsX = Math.ceil(sizes.width / cellSize)
    let cellsY = Math.ceil(sizes.height / cellSize)
    ctx.clearRect(0, 0, sizes.width, sizes.height)

    let extraX = (cellsX * cellSize) % sizes.width
    let extraY = (cellsY * cellSize) % sizes.height
    ctx.translate(Math.floor(-extraX / 2), Math.floor(-extraY / 2))

    let rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]

    for (let x = 0; x < cellsX; x++) {
        for (let y = 0; y < cellsY; y++) {
            let noiseVal = noise2d(x * noiseScale, y * noiseScale)
            let bgIndex = Math.floor(map(noiseVal, -1, 1, 0, palette.length * 5)) % palette.length

            let shapeIndex = (x % 2) + (y % 2)
            if (x % 2 === 0 && y % 2 === 1) shapeIndex = 3
            let rOffset = Math.floor(Math.abs(noiseVal) * 3)
            if (noiseVal > 0.5) {
                shapeIndex = (shapeIndex + rOffset) % 6
            } else {
                shapeIndex = (shapeIndex + rOffset) % 4
            }

            ctx.save()
            ctx.translate(x * cellSize, y * cellSize)
            // ctx.translate(cellSize / 2, cellSize / 2)
            // ctx.rotate(rotations[rotateIndex])
            // ctx.translate(-cellSize / 2, -cellSize / 2)

            let bg = bgIndex
            let fg = (bg + 1) % palette.length

            ctx.beginPath()
            ctx.rect(0, 0, cellSize, cellSize)

            ctx.fillStyle = palette[bg]
            ctx.fill()

            ctx.beginPath()
            if (shapeIndex === 0) {
                ctx.arc(0, 0, cellSize, 0, Math.PI / 2)
                ctx.lineTo(0, 0)
            } else if (shapeIndex === 1) {
                ctx.arc(cellSize, 0, cellSize, Math.PI / 2, Math.PI)
                ctx.lineTo(cellSize, 0)
            } else if (shapeIndex === 2) {
                ctx.arc(cellSize, cellSize, cellSize, Math.PI, Math.PI * 1.5)
                ctx.lineTo(cellSize, cellSize)
            } else if (shapeIndex === 3) {
                ctx.arc(0, cellSize, cellSize, Math.PI * 1.5, Math.PI * 2)
                ctx.lineTo(0, cellSize)
            } else if (shapeIndex === 4) {
                ctx.arc(0, 0, cellSize, 0, Math.PI / 2)
                ctx.arc(cellSize, cellSize, cellSize, Math.PI, Math.PI * 1.5)
            } else if (shapeIndex === 5) {
                ctx.arc(cellSize, 0, cellSize, Math.PI / 2, Math.PI)
                ctx.arc(0, cellSize, cellSize, Math.PI * 1.5, Math.PI * 2)
            }
            ctx.fillStyle = palette[fg]
            ctx.fill()

            ctx.restore()
        }
    }
}

draw()
