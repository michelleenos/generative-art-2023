import '../../style.css'
import p5 from 'p5'
import { Pane } from 'tweakpane'
import RefreshContainer from '../../helpers/refresh-container'
// import initTrochoid from './parts/trochoid'
import { Hypotrochoid } from './parts/trochoid-2'

new p5((p: p5) => {
    // let Trochoid = initTrochoid(p).Hypotrochoid
    let trochoid: Hypotrochoid
    let pane = new Pane()
    let rc = new RefreshContainer(pane)

    const PARAMS = {
        lineLen: 30,
        radius: 30,
        baseRadius: 100,
        special: 'none',
    }

    function setupControlsCircle() {
        let opts = { min: 1, max: 300, step: 1 }
        pane.addInput(PARAMS, 'lineLen', opts).on('change', () => {
            if (PARAMS.special === 'hypocycloid' || PARAMS.special.startsWith('cycratio')) {
                PARAMS.radius = PARAMS.lineLen

                if (PARAMS.special.includes('ratio2')) {
                    PARAMS.baseRadius = PARAMS.radius * 2
                } else if (PARAMS.special.includes('ratio3')) {
                    PARAMS.baseRadius = PARAMS.radius * 3
                } else if (PARAMS.special.includes('ratio4')) {
                    PARAMS.baseRadius = PARAMS.radius * 4
                }
                trochoid.radius = PARAMS.radius
                trochoid.baseRadius = PARAMS.baseRadius
            }

            trochoid.lineLen = PARAMS.lineLen
            trochoid.makeSteps()
            rc.refresh()
        })
        pane.addInput(PARAMS, 'radius', opts).on('change', () => {
            if (PARAMS.special.includes('ratio2')) {
                PARAMS.baseRadius = PARAMS.radius * 2
            } else if (PARAMS.special.includes('ratio3')) {
                PARAMS.baseRadius = PARAMS.radius * 3
            } else if (PARAMS.special.includes('ratio4')) {
                PARAMS.baseRadius = PARAMS.radius * 4
            }
            if (PARAMS.special === 'hypocycloid' || PARAMS.special.startsWith('cycratio')) {
                PARAMS.lineLen = PARAMS.radius
                trochoid.lineLen = PARAMS.lineLen
            }

            trochoid.baseRadius = PARAMS.baseRadius
            trochoid.radius = PARAMS.radius
            trochoid.makeSteps()
            rc.refresh()
        })
        pane.addInput(PARAMS, 'baseRadius', opts).on('change', () => {
            if (PARAMS.special.includes('ratio2')) {
                PARAMS.radius = Math.floor(PARAMS.baseRadius / 2)
                PARAMS.baseRadius = PARAMS.radius * 2
            } else if (PARAMS.special.includes('ratio3')) {
                PARAMS.radius = Math.floor(PARAMS.baseRadius / 3)
                PARAMS.baseRadius = PARAMS.radius * 3
            } else if (PARAMS.special.includes('ratio4')) {
                PARAMS.radius = Math.floor(PARAMS.baseRadius / 4)
                PARAMS.baseRadius = PARAMS.radius * 4
            }

            if (PARAMS.special === 'hypocycloid' || PARAMS.special.startsWith('cycratio')) {
                PARAMS.lineLen = PARAMS.radius
            }

            trochoid.radius = PARAMS.radius
            trochoid.lineLen = PARAMS.lineLen
            trochoid.baseRadius = PARAMS.baseRadius
            trochoid.makeSteps()
            rc.refresh()
        })

        pane.addInput(PARAMS, 'special', {
            options: {
                none: 'none',
                hypocycloid: 'hypocycloid',
                'hypocycloid 2:1 (tulsi couple)': 'cycratio2',
                'hypocycloid 3:1 (deltoid)': 'cycratio3',
                'hypocycloid 4:1 (astroid)': 'cycratio4',
                'ratio 2:1': 'ratio2',
                'ratio 3:1': 'ratio3',
                'ratio 4:1': 'ratio4',
            },
        }).on('change', () => {
            if (rc.refreshing) return
            if (PARAMS.special === 'none') return

            if (PARAMS.special.includes('ratio2')) {
                if (PARAMS.radius > 150) PARAMS.radius = 150
                PARAMS.baseRadius = PARAMS.radius * 2
            } else if (PARAMS.special.includes('ratio3')) {
                if (PARAMS.radius > 100) PARAMS.radius = 100
                PARAMS.baseRadius = PARAMS.radius * 3
            } else if (PARAMS.special.includes('ratio4')) {
                if (PARAMS.radius > 75) PARAMS.radius = 75
                PARAMS.baseRadius = PARAMS.radius * 4
            }
            if (PARAMS.special === 'hypocycloid' || PARAMS.special.startsWith('cycratio')) {
                PARAMS.lineLen = PARAMS.radius
                trochoid.lineLen = PARAMS.lineLen
            }

            trochoid.radius = PARAMS.radius
            trochoid.baseRadius = PARAMS.baseRadius

            trochoid.makeSteps()
            rc.refresh()
        })
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.angleMode(p.RADIANS)
        trochoid = new Hypotrochoid({
            radius: PARAMS.radius,
            baseRadius: PARAMS.baseRadius,
        })

        setupControlsCircle()
    }

    let lastTime = 0
    p.draw = function () {
        let ms = p.millis()
        let delta = ms - lastTime
        lastTime = ms
        p.background('#0a0a0a')
        p.translate(p.width / 2, p.height / 2)

        p.strokeWeight(1)
        p.noFill()
        p.stroke('#fff')
        trochoid.tick(delta)
        trochoid.draw(p)
    }
})
