import chroma from 'chroma-js'
import p5 from 'p5'
import { map } from '~/helpers/utils'
import '~/style.css'
import { petal } from './Flower'
import { createNoise2D } from 'simplex-noise'

const PHI = (1 + Math.sqrt(5)) / 2
let goldenAngle = Math.PI * 2 * (2 - PHI)
// let goldenAngle = 360 * (2 - PHI)
// let t = Math.round((ms / 700) * 10) / 10
// let t = ms * 0.001

let color1 = '#04a777'
let color2 = '#beeaff'
let maxRadius = 300
let duration = 500

new p5((p: p5) => {
    let count = 51
    let angles: number[] = []
    let groups: number[] = []

    let groupSize = 3
    let groupsCount = Math.ceil(count / groupSize)
    let noise2D = createNoise2D()

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)

        let group = -1
        for (let i = 0; i < count; i++) {
            if (i % groupSize === 0) group++
            angles.push(i * goldenAngle)
            groups.push(group)
        }
    }

    let add = 0
    let lastAdd = 0
    p.draw = function () {
        let ms = p.millis()
        if (ms - lastAdd > duration) {
            lastAdd = ms
            add++
            angles.pop()
            angles.unshift(angles[0] - goldenAngle)
            groups.unshift(groups.pop()!)
        }
        let progress = (ms - lastAdd) / duration

        p.push()
        p.fill(255)
        p.rect(0, 0, p.width, p.height)
        p.noStroke()
        p.fill(0)
        p.text(`progress: ${progress.toFixed(2)}`, 10, 20)
        p.translate(p.width / 2, p.height / 2)

        let speed = 0.0001

        let groupVals: {
            cx1: number
            cx2: number
            cy1: number
            cy2: number
            tx: number
            ty: number
            off: number
            seed: number
        }[] = []
        for (let i = 0; i < groupsCount; i++) {
            let cx1 = map(noise2D(ms * speed, i), -1, 1, 0.1, 0.9)
            let cx2 = 1 - cx1
            let cy1 = map(noise2D(ms * speed, i), -1, 1, 0, 0.7)
            let cy2 = 1.3 - cy1
            groupVals.push({
                cx1,
                cx2,
                cy1,
                cy2,
                tx: 0,
                ty: 0,
                off: 0.25,
                seed: i,
            })
        }

        for (let i = count - 1; i >= 0; i--) {
            let group = groups[i]
            let angle = angles[i]
            let pct = (i + progress) / count
            let size = maxRadius * pct
            p.push()
            p.rotate(angle)
            let alpha = 1

            if (pct > 0.9) {
                alpha = map(pct, 0.9, 1, 1, 0)
            }
            p.fill(chroma.mix(color1, color2, pct).alpha(alpha).hex())

            if (!groupVals[group]) {
                continue
            }
            let { cx1, cx2, cy1, cy2, tx, ty } = groupVals[group]
            let off = 0.25

            petal(p, size, off, cx1, cx2, cy1, cy2, tx, ty)
            p.pop()
        }

        p.pop()
    }
}, document.getElementById('sketch') ?? undefined)
