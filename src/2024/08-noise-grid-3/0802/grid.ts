import Alea from 'alea'
import chroma, { Scale } from 'chroma-js'
import { NoiseFunction3D, createNoise3D } from 'simplex-noise'
import { Cell } from './cell'
import { Sizes } from '~/helpers/sizes'
import { map } from '~/helpers/utils'
import { Rectangle } from '~/helpers/trig-shapes'
import { random, randomBias } from '~/helpers/utils'
import { getItems, multBy } from '../helpful-stuff'
import { cellStagger, params } from './params'

import easing from '~/helpers/easings'

// const initCells = (
//     sizes: { width: number; height: number },
//     minDepth: number,
//     maxDepth: number
// ) => {
//     let sz = 850

//     let bounds = new Rectangle((sizes.width - sz) / 2, (sizes.height - sz) / 2, sz, sz)
//     let root = new Cell(bounds)

//     let leaves = root.getLeaves()
//     let minDepthCount = leaves.filter((cell) => cell.depth < minDepth).length
//     let maxDepthCount = leaves.filter((cell) => cell.depth === maxDepth).length

//     let biasX = random(bounds.width * 0.25, bounds.width * 0.75) + bounds.x
//     let biasY = random(bounds.width * 0.25, bounds.height * 0.75) + bounds.y

//     while (minDepthCount > 0 || maxDepthCount < 5) {
//         let x = randomBias(bounds.x, bounds.x + bounds.width, biasX, 0.6)
//         let y = randomBias(bounds.y, bounds.y + bounds.height, biasY, 0.6)
//         let cell = root.findCell(x, y)
//         if (cell && cell.depth < maxDepth) {
//             cell.divide()
//         }

//         let leaves = root.getLeaves()
//         maxDepthCount = leaves.filter((cell) => cell.depth === maxDepth).length
//         minDepthCount = leaves.filter((cell) => cell.depth < minDepth).length
//     }

//     return root
// }

export class Grid {
    root: Cell
    width: number
    height: number
    noise: NoiseFunction3D
    leaves: (Cell & { d?: number; n?: number })[]
    palette = ['#7051b5', '#cf3895', '#fed000', '#ff8552']
    scale: Scale
    lastTime: number = 0
    lastDivTime: number = 0
    lastBiasChange: number = 0
    biasPoint: { x: number; y: number }

    constructor(width: number, height: number) {
        this.width = width
        this.height = height

        let prng = Alea('seed')
        this.noise = createNoise3D(prng)

        this.leaves = []

        this.scale = chroma.scale(this.palette).mode('rgb')

        this.biasPoint = {
            x: random(width * 0.25, width * 0.75),
            y: random(height * 0.25, height * 0.75),
        }

        this.root = this.initCells(params.minDepth, params.maxDepth)
        this.root.onCollapse = this.updateLeaves
        this.root.onDivide = this.updateLeaves
    }

    initCells = (minDepth: number, maxDepth: number) => {
        let sz = 850

        let bounds = new Rectangle((this.width - sz) / 2, (this.height - sz) / 2, sz, sz)
        let root = new Cell(bounds)

        let leaves = root.getLeaves()
        let minDepthCount = leaves.filter((cell) => cell.depth < minDepth).length
        let maxDepthCount = leaves.filter((cell) => cell.depth === maxDepth).length

        // let biasX = random(bounds.width * 0.25, bounds.width * 0.75) + bounds.x
        // let biasY = random(bounds.width * 0.25, bounds.height * 0.75) + bounds.y

        while (minDepthCount > 0 || maxDepthCount < 5) {
            let x = randomBias(bounds.x, bounds.x + bounds.width, this.biasPoint.x, 0.6)
            let y = randomBias(bounds.y, bounds.y + bounds.height, this.biasPoint.y, 0.6)
            let cell = root.findCell(x, y)
            if (cell && cell.depth < maxDepth) {
                cell.divide()
            }

            let leaves = root.getLeaves()
            maxDepthCount = leaves.filter((cell) => cell.depth === maxDepth).length
            minDepthCount = leaves.filter((cell) => cell.depth < minDepth).length
        }

        return root
    }

    updateLeaves = () => {
        this.leaves = this.root.getLeaves()

        this.leaves.forEach((leaf) => {
            if (!leaf.timer && leaf.stage === 'in') {
                leaf.enter()
            }
        })
    }

    newBias = () => {
        this.biasPoint = {
            x: random(this.width * 0.15, this.width * 0.85),
            y: random(this.height * 0.15, this.height * 0.85),
        }
    }

    update = (ms: number) => {
        let delta = ms - this.lastTime
        this.lastTime = ms
        let doDiv = false
        if (this.lastTime - this.lastDivTime > params.divSpeed * 1000) {
            doDiv = true
            this.lastDivTime = this.lastTime
        }

        if (this.lastTime - this.lastBiasChange > params.biasChangeSpeed * 1000) {
            this.newBias()
            this.lastBiasChange = this.lastTime
        }

        this.leaves.forEach((cell) => {
            if (cell.timer) cell.timer.tick(delta)

            if (!doDiv || cell.stage !== 'idle' || cell.getAge(ms) < params.minAge) {
                return
            }

            let cx = cell.bounds.x + cell.bounds.width / 2
            let cy = cell.bounds.y + cell.bounds.height / 2

            let distance = Math.sqrt((cx - this.biasPoint.x) ** 2 + (cy - this.biasPoint.y) ** 2)
            let d = distance / this.width
            d = easing.outCubic(d)

            let n = random()
            cell.d = d
            cell.n = n
            if (n > d && cell.depth < params.maxDepth) {
                cell.setWillDivide()
            } else if (n < d && cell.depth > params.minDepth) {
                let parent = cell.parent
                if (parent) {
                    parent.setWillCollapse()
                }
            }
        })

        // if (doDiv) {
        //     this.newBias()
        // }
    }

    draw = (ms: number, ctx: CanvasRenderingContext2D) => {
        this.update(ms)

        ctx.fillStyle = 'rgb(230,230,230)'
        ctx.fillRect(0, 0, this.width, this.height)

        let items = getItems(params, ['noiseFreqAngle', 'noiseSpeedAngle'])
        let { noiseSpeedAngle, noiseFreqAngle } = multBy(items, 0.001)

        this.updateLeaves()

        this.leaves.forEach((cell) => {
            let progress = cell.progress
            if (progress === 0) return

            let radius = cell.bounds.width / 2
            let radiusInner = radius * params.innerRadiusAmt

            let cx = cell.bounds.x + cell.bounds.width / 2
            let cy = cell.bounds.y + cell.bounds.height / 2

            let angle =
                this.noise(cx * noiseFreqAngle, cy * noiseFreqAngle, ms * noiseSpeedAngle) *
                Math.PI *
                2

            for (let i = 0; i < params.layers; i++) {
                let lw = (params.layers - i) * params.lwMult
                let ri: number
                if (i === 0) {
                    ri = radius
                } else {
                    let mult = (i - 1) / params.layers
                    mult = 1 - mult
                    ri = radiusInner * mult
                }

                let p =
                    cell.stage === 'in'
                        ? cellStagger.in.getProgress(progress, i)
                        : cell.stage === 'out'
                        ? cellStagger.out.getProgress(progress, i)
                        : 1

                let pr: number
                let pt: number
                if (i > 0 && cell.stage === 'in') {
                    pr = easing[params.easeIn](p)
                    pt = easing[params.easeIn](p)
                } else {
                    pr = easing[cell.stage === 'in' ? params.easeIn : params.easeOut](p)
                    pt = pr
                }
                let translateAmt = map(pt, 0, 1, ri, radius - ri)
                ri *= pr

                let x = cx
                let y = cy
                if (i > 0) {
                    x += Math.cos(angle) * translateAmt
                    y += Math.sin(angle) * translateAmt
                }

                ctx.strokeStyle = '#000'
                ctx.lineWidth = lw
                ctx.beginPath()
                ctx.arc(x, y, Math.max(ri - lw / 2, 0), 0, Math.PI * 2)
                ctx.stroke()
            }
        })

        // ctx.fillStyle = '#000'
        // ctx.beginPath()
        // ctx.arc(this.biasPoint.x, this.biasPoint.y, 5, 0, Math.PI * 2)
        // ctx.fill()
    }
}
