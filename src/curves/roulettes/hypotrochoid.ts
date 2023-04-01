import '../../style.css'
import p5 from 'p5'
import { Pane } from 'tweakpane'
import RefreshContainer from './parts/refresh-container'
import initTrochoid from './parts/trochoid'

new p5((p: p5) => {
    let Trochoid = initTrochoid(p).Hypotrochoid
    let circ
    let pane = new Pane()
    let rc = new RefreshContainer(pane)

    const PARAMS = {
        lineLen: 30,
        radius: 30,
        baseRadius: 100,
        special: 'none',
    }

    const makeInput = (value, opts?) => {
        if (!opts) opts = { min: 1, max: 300, step: 1 }
        let input = pane.addInput(PARAMS, value, opts)

        const onChange = () => {
            if (rc.refreshing) return
            circ[value] = PARAMS[value]
            circ.makeSteps()
            rc.refresh()
        }

        if (onChange) input.on('change', onChange)
        return input
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
                circ.radius = PARAMS.radius
                circ.baseRadius = PARAMS.baseRadius
            }

            circ.lineLen = PARAMS.lineLen
            circ.makeSteps()
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
                circ.lineLen = PARAMS.lineLen
            }

            circ.baseRadius = PARAMS.baseRadius
            circ.radius = PARAMS.radius
            circ.makeSteps()
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

            circ.radius = PARAMS.radius
            circ.lineLen = PARAMS.lineLen
            circ.baseRadius = PARAMS.baseRadius
            circ.makeSteps()
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
                circ.lineLen = PARAMS.lineLen
            }

            circ.radius = PARAMS.radius
            circ.baseRadius = PARAMS.baseRadius

            circ.makeSteps()
            rc.refresh()
        })
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.angleMode(p.RADIANS)
        circ = new Trochoid({ radius: PARAMS.radius, baseRadius: PARAMS.baseRadius })

        setupControlsCircle()
    }

    p.draw = function () {
        p.background('#0a0a0a')
        p.translate(p.width / 2, p.height / 2)

        p.strokeWeight(1)
        p.noFill()
        p.stroke('#fff')
        circ.draw()
    }
})
