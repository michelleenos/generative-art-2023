import '../../style.css'
import p5 from 'p5'
import { type InputParams, Pane } from 'tweakpane'
import RefreshContainer from '../../helpers/refresh-container'
// import initTrochoid from './parts/trochoid'
import { Epitrochoid } from './parts/trochoid-2'

new p5((p: p5) => {
    // let Trochoid = initTrochoid(p).Epitrochoid
    // let circ: InstanceType<typeof Trochoid>
    let trochoid: Epitrochoid
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

    const makeInput = (
        value: 'lineLen' | 'radius' | 'baseRadius' | 'ratio',
        opts?: InputParams
    ) => {
        if (!opts) opts = { min: 1, max: 300, step: 1 }
        let input = pane.addInput(PARAMS, value, opts)

        const onChange = () => {
            if (rc.refreshing) return

            if (PARAMS.mode === 'ratio') {
                PARAMS.special = 'none'
                trochoid[value] = PARAMS[value]
                PARAMS.radius = trochoid.radius
                PARAMS.baseRadius = trochoid.baseRadius
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
                trochoid['radius'] = PARAMS['radius']
                trochoid['baseRadius'] = PARAMS['baseRadius']
                trochoid['lineLen'] = PARAMS['lineLen']
            } else if (PARAMS.special === 'limacon' && PARAMS.mode === 'radius') {
                if (value === 'radius') {
                    PARAMS.baseRadius = PARAMS.radius
                    trochoid.radius = PARAMS.radius
                    trochoid.baseRadius = PARAMS.radius
                } else if (value === 'baseRadius') {
                    PARAMS.radius = PARAMS.baseRadius
                    trochoid.radius = PARAMS.radius
                    trochoid.baseRadius = PARAMS.radius
                } else {
                    trochoid[value] = PARAMS[value]
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
                trochoid.radius = PARAMS.radius
                trochoid.baseRadius = PARAMS.baseRadius
                trochoid.lineLen = PARAMS.lineLen
            } else if (PARAMS.mode === 'radius') {
                trochoid[value] = PARAMS[value]
                PARAMS.ratio = PARAMS.baseRadius / PARAMS.radius
            }
            trochoid.makeSteps()

            rc.refresh()
        }

        if (onChange) input.on('change', onChange)
        return input
    }

    function setupControlsCircle() {
        makeInput('lineLen')
        let inputRadius = makeInput('radius')
        let inputRatio = makeInput('ratio', { min: 1, max: 20, step: 1 })

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
                trochoid = new Epitrochoid({ ratio: 1, baseRadius: PARAMS.baseRadius })
            } else {
                inputBaseRadius.disabled = false
                inputRatio.disabled = true
                PARAMS.special = 'none'
                trochoid = new Epitrochoid({
                    radius: PARAMS.radius,
                    baseRadius: PARAMS.baseRadius,
                })
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
                trochoid = new Epitrochoid({
                    radius: PARAMS.radius,
                    baseRadius: PARAMS.baseRadius,
                })
            } else if (PARAMS.special === 'limacon') {
                PARAMS.baseRadius = PARAMS.radius
                trochoid = new Epitrochoid({
                    radius: PARAMS.radius,
                    baseRadius: PARAMS.baseRadius,
                    lineLen: PARAMS.lineLen,
                })
            } else if (PARAMS.special === 'nephroid') {
                PARAMS.baseRadius = PARAMS.radius * 2
                PARAMS.lineLen = PARAMS.radius
                trochoid = new Epitrochoid({
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
        trochoid = new Epitrochoid({ radius: 30, baseRadius: 80 })

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
