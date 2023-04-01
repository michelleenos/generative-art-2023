import '../../style.css'
import p5 from 'p5'
import { Pane } from 'tweakpane'
import RefreshContainer from './parts/refresh-container'
import initTrochoid from './parts/trochoid'

new p5((p: p5) => {
    let Trochoid = initTrochoid(p).Epitrochoid
    let circ
    let pane = new Pane()
    let rc = new RefreshContainer(pane)

    const PARAMS = {
        mode: 'radius',
        ratio: 2,
        lineLen: 50,
        radius: 50,
        baseRadius: 50,
        special: 'none',
    }

    const makeInput = (value, opts?) => {
        if (!opts) opts = { min: 1, max: 300, step: 1 }
        let input = pane.addInput(PARAMS, value, opts)

        const onChange = () => {
            if (rc.refreshing) return
            console.log(PARAMS)

            if (PARAMS.mode === 'ratio') {
                PARAMS.special = 'none'
                circ[value] = PARAMS[value]
                PARAMS.radius = circ.radius
                PARAMS.baseRadius = circ.baseRadius
            } else if (PARAMS.special === 'cardioid' && PARAMS.mode === 'radius') {
                PARAMS.ratio = 1
                if (value === 'radius') {
                    PARAMS.baseRadius = PARAMS.radius
                    PARAMS['lineLen'] = PARAMS.radius
                } else if (value === 'baseRadius') {
                    PARAMS.radius = PARAMS.baseRadius
                    PARAMS['lineLen'] = PARAMS.radius
                } else if (value === 'lineLen') {
                    PARAMS.baseRadius = PARAMS.lineLen
                    PARAMS.radius = PARAMS.lineLen
                }
                circ['radius'] = PARAMS['radius']
                circ['baseRadius'] = PARAMS['baseRadius']
                circ['lineLen'] = PARAMS['lineLen']
            } else if (PARAMS.special === 'limacon' && PARAMS.mode === 'radius') {
                if (value === 'radius') {
                    PARAMS.baseRadius = PARAMS.radius
                    circ.radius = PARAMS.radius
                    circ.baseRadius = PARAMS.radius
                } else if (value === 'baseRadius') {
                    PARAMS.radius = PARAMS.baseRadius
                    circ.radius = PARAMS.radius
                    circ.baseRadius = PARAMS.radius
                } else {
                    circ[value] = PARAMS[value]
                }
            } else if (PARAMS.special === 'nephroid' && PARAMS.mode === 'radius') {
                if (value === 'radius') {
                    PARAMS.baseRadius = PARAMS.radius * 2
                    PARAMS.lineLen = PARAMS.radius
                } else if (value === 'baseRadius') {
                    PARAMS.radius = PARAMS.baseRadius / 2
                    PARAMS.lineLen = PARAMS.radius
                } else if (value === 'lineLen') {
                    PARAMS.radius = PARAMS.lineLen
                    PARAMS.baseRadius = PARAMS.radius * 2
                }
                circ.radius = PARAMS.radius
                circ.baseRadius = PARAMS.baseRadius
                circ.lineLen = PARAMS.lineLen
            } else if (PARAMS.mode === 'radius') {
                circ[value] = PARAMS[value]
                PARAMS.ratio = PARAMS.baseRadius / PARAMS.radius
            }
            circ.makeSteps()

            rc.refresh()
        }

        if (onChange) input.on('change', onChange)
        return input
    }

    function setupControlsCircle() {
        let inputLineLen = makeInput('lineLen')
        let inputRadius = makeInput('radius')
        let inputRatio = makeInput('ratio', { min: 1, max: 20, step: 1 })
        console.log(inputRatio)
        let inputBaseRadius = makeInput('baseRadius')

        if (PARAMS.mode === 'ratio') {
            inputRadius.disabled = true
        } else {
            inputRatio.disabled = true
        }

        pane.addInput(PARAMS, 'mode', {
            options: {
                ratio: 'ratio',
                radius: 'radius',
            },
        }).on('change', () => {
            if (rc.refreshing) return
            let mode = PARAMS.mode
            PARAMS.special = 'none'
            if (mode === 'ratio') {
                inputBaseRadius.disabled = true
                inputRatio.disabled = false
                circ = new Trochoid({ ratio: 1, baseRadius: PARAMS.baseRadius })
            } else {
                inputBaseRadius.disabled = false
                inputRatio.disabled = true
                PARAMS.special = 'none'
                circ = new Trochoid({ radius: PARAMS.radius, baseRadius: PARAMS.baseRadius })
            }
            rc.refresh()
        })

        pane.addInput(PARAMS, 'special', {
            options: {
                limaçon: 'limacon',
                'limaçon: cardiod': 'cardioid',
                nephroid: 'nephroid',
                none: 'none',
            },
        }).on('change', () => {
            if (rc.refreshing) return
            if (PARAMS.special === 'none') {
                return
            }
            PARAMS.mode = 'radius'
            inputBaseRadius.disabled = false
            inputRatio.disabled = true

            if (PARAMS.special === 'cardioid') {
                PARAMS.baseRadius = PARAMS.radius
                PARAMS.lineLen = PARAMS.radius
                circ = new Trochoid({ radius: PARAMS.radius, baseRadius: PARAMS.baseRadius })
            } else if (PARAMS.special === 'limacon') {
                PARAMS.baseRadius = PARAMS.radius
                circ = new Trochoid({
                    radius: PARAMS.radius,
                    baseRadius: PARAMS.baseRadius,
                    lineLen: PARAMS.lineLen,
                })
            } else if (PARAMS.special === 'nephroid') {
                PARAMS.baseRadius = PARAMS.radius * 2
                PARAMS.lineLen = PARAMS.radius
                circ = new Trochoid({
                    radius: PARAMS.radius,
                    baseRadius: PARAMS.baseRadius,
                    lineLen: PARAMS.lineLen,
                })
            }
            rc.refresh()
        })
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.angleMode(p.RADIANS)
        circ = new Trochoid({ radius: 30, baseRadius: 80 })

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
