import p5 from 'p5'
import '../style.css'
import { Pane } from 'tweakpane'
import easings from '~/helpers/easings'

const P = {
    aspectMin: 0,
    aspectMax: 0.6,
    aspect: 0,
    animAspect: false,
    sidesMin: 3,
    sidesMax: 6,
    rectSize: 0.2,
    showNotCheckered: true,
    showCheckered: true,
    speedSize: 0.8,
    speedSides: 0.1,
    paused: false,
    stepSides: false,
    showCenters: false,
    multX: 3,
    multY: 1,
}

const pane = new Pane()
const folder = pane.addFolder({ title: 'controls' })

let fSides = pane.addFolder({ title: 'Sides' })
fSides.addInput(P, 'sidesMin', { min: 3, max: 10, step: 1 })
fSides.addInput(P, 'sidesMax', { min: 3, max: 10, step: 1 })
fSides.addInput(P, 'speedSides', { min: 0, max: 1, step: 0.001 })
fSides.addInput(P, 'stepSides')

const fSize = pane.addFolder({ title: 'Size/Aspect' })
let aspectAnimControl = fSize.addInput(P, 'animAspect', { label: 'animate' })
let aspectControl = fSize.addInput(P, 'aspect', { min: 0, max: 2 })
let aspectMinControl = fSize.addInput(P, 'aspectMin', { min: 0, max: 2 })
let aspectMaxControl = fSize.addInput(P, 'aspectMax', { min: 0, max: 2 })
let speedSizeControl = fSize.addInput(P, 'speedSize', { min: 0, max: 3, label: 'speed' })

aspectMinControl.hidden = !P.animAspect
aspectMaxControl.hidden = !P.animAspect
aspectControl.hidden = P.animAspect
speedSizeControl.hidden = !P.animAspect
aspectAnimControl.on('change', (e) => {
    if (e.value) {
        aspectMinControl.hidden = false
        aspectMaxControl.hidden = false
        speedSizeControl.hidden = false
        aspectControl.hidden = true
    } else {
        aspectMinControl.hidden = true
        aspectMaxControl.hidden = true
        speedSizeControl.hidden = true
        aspectControl.hidden = false
    }
})

folder.addInput(P, 'rectSize', { min: 0, max: 1 })

let fShow = pane.addFolder({ title: 'Show' })
fShow.addInput(P, 'showCheckered', { label: 'checkered' })
fShow.addInput(P, 'showNotCheckered', { label: 'notchckrd' })
fShow.addInput(P, 'showCenters', { label: 'centers' })
// folder.addInput(P, 'multX', { min: 0, max: 3, step: 0.1 })
// folder.addInput(P, 'multY', { min: 0, max: 3, step: 0.1 })
// folder.addInput(P, 'paused')

new p5((p: p5) => {
    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.angleMode(p.DEGREES)
    }

    p.draw = function () {
        p.background(0)

        p.stroke(255)
        p.strokeWeight(2)
        p.noFill()

        let sides
        let rectWidRatio
        // let progress = p.fract(p.millis() * 0.001)
        let sidesProgress = p.fract(p.millis() * 0.001 * P.speedSides)
        let centersProgress = p.fract(p.millis() * 0.001 * P.speedSides * 2)

        if (P.paused || !P.animAspect) {
            rectWidRatio = P.aspect
        } else {
            rectWidRatio = p.map(p.sin(p.frameCount * P.speedSize), -1, 1, P.aspectMin, P.aspectMax)
        }

        if (P.paused) {
            sides = P.sidesMin
        } else if (P.stepSides) {
            sides = p.floor(sidesProgress * (P.sidesMax - P.sidesMin + 1) + P.sidesMin)
        } else {
            let sidesCycProgress = easings.inCubic(p.sin(sidesProgress * 180))
            sides = p.map(sidesCycProgress, 0, 1, P.sidesMin, P.sidesMax)
        }

        let rectLen = p.width * P.rectSize
        let rectWid = rectLen * rectWidRatio

        let angle = 360 / sides
        let ySpace = p.round(p.abs(p.sin(angle) * rectLen), 2)
        let xSpace = p.round(p.abs(p.cos(angle) * rectLen), 2)

        let xCount = Math.floor(p.width / (xSpace + rectLen)) + 1
        let yCount = Math.floor(p.height / ySpace) + 1

        let yPos = 0
        for (let yi = 0; yi <= yCount + 2; yi++) {
            let xPos = yi % 2 === 0 ? 0 : -xSpace

            for (let xi = 0; xi <= xCount + 2; xi++) {
                let isCheckered = checkered(xi, yi)

                let xPos2 =
                    xPos +
                    p.cos(angle) * P.multX * rectLen * centersProgress * (isCheckered ? 1 : -1)
                let yPos2 =
                    yPos +
                    p.sin(angle) * P.multY * rectLen * centersProgress * (isCheckered ? 1 : -1)

                p.push()
                p.translate(xPos2, yPos2)
                p.rotate(isCheckered ? 0 : 180)
                if (isCheckered && P.showCheckered) {
                    squareStar(rectWid, rectLen, sides)
                } else if (!isCheckered && P.showNotCheckered) {
                    squareStar(rectWid, rectLen, sides)
                }
                p.pop()

                if (P.showCenters) {
                    if ((isCheckered && P.showCheckered) || (!isCheckered && P.showNotCheckered)) {
                        p.push()
                        p.translate(xPos2, yPos2)
                        p.fill(isCheckered ? 'red' : 'green')
                        p.noStroke()
                        p.circle(0, 0, 20)
                        p.pop()
                    }
                }

                xPos += isCheckered ? rectLen : xSpace * 2 + rectLen
            }

            yPos += ySpace
        }
    }

    const checkered = (x: number, y: number) => x % 2 === y % 2

    const squareStar = (rectWid: number, rectLen: number, sides = 3) => {
        let angle = 360 / sides
        let i = 0
        while (i < sides) {
            p.push()
            p.rotate(i * angle)
            p.rect(0, -rectWid / 2, rectLen, rectWid)
            p.pop()
            i++
        }
    }
})
