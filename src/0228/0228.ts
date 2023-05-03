import p5 from 'p5'
import '../style.css'
import { curves, CurvesOptions } from './curves'

// https://mathworld.wolfram.com/MalteseCrossCurve.html

new p5((p: p5) => {
    let btns = document.querySelector('#btns')

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.noLoop()
        p.colorMode(p.HSB)
    }

    p.draw = function () {
        const getAlphaVals: () => {
            alphaStart: number
            alphaEnd: number
            ease: (number) => number
        } = () => {
            if (p.random() < 0.5) {
                return {
                    alphaStart: 0,
                    alphaEnd: 1,
                    ease: p.random(['inCubic', 'inQuad', 'inQuart']),
                }
            } else {
                return {
                    alphaStart: 1,
                    alphaEnd: p.random(0, 0.5),
                    ease: p.random([
                        'outQuad',
                        'outSine',
                        'inOutCirc',
                        'inQuad',
                    ]),
                }
            }
        }

        let { alphaStart, alphaEnd, ease } = getAlphaVals()

        let options: CurvesOptions = {
            color: p.random(['light', 'dark', 'color']),
            nStart: p.random(-2, 0),
            // nStart: -1,
            nEnd: p.random(0.5, 1.5),
            // angleMult: p.random([p.random(0.5, 2), p.random([3, 4, 5, 6, 7])]),
            angleMult: p.random([3, 4, 5, 6, 7, 8]),
            scale: p.random(7, 30),
            rotate: p.random(90),
            alphaStart,
            alphaEnd,
            ease,
        }
        curves(p, options)
    }

    p.mouseClicked = function (e: Event) {
        if (
            e.target instanceof HTMLElement &&
            (!btns || !btns.contains(e.target))
        ) {
            p.redraw()
        }
    }
})
