import '../../style.css'
import p5 from 'p5'
import { type InputParams, Pane } from 'tweakpane'
import RefreshContainer from '../../helpers/refresh-container'
// import initTrochoid from './parts/trochoid'
import { TrochoidOnLine } from './parts/trochoid-2'

new p5((p: p5) => {
    // let Trochoid = initTrochoid(p).TrochoidOnLine
    let trochoid: TrochoidOnLine
    let pane = new Pane()
    let rc = new RefreshContainer(pane)

    const makeInput = (value: 'radius' | 'lineLen', onChange?: () => void, opts?: InputParams) => {
        if (!opts) opts = { min: 1, max: 100, step: 1 }
        let input = pane.addInput(trochoid, value, opts)
        if (onChange) input.on('change', onChange)
        return input
    }

    const PARAMS = {
        radius: 50,
        type: 'cycloid',
    }

    function setupControlsLine() {
        const onChange = () => {
            trochoid.makeSteps()
            if (trochoid.radius > trochoid.lineLen) {
                PARAMS.type = 'curtate'
            } else if (trochoid.radius < trochoid.lineLen) {
                PARAMS.type = 'prolate'
            } else {
                PARAMS.type = 'cycloid'
            }
            rc.refresh()
        }
        makeInput('radius', onChange)
        makeInput('lineLen', onChange)

        pane.addInput(PARAMS, 'type', {
            options: {
                cycloid: 'cycloid',
                'prolate trochoid': 'prolate',
                'curtate trochoid': 'curtate',
            },
        }).on('change', () => {
            if (rc.refreshing) return
            if (PARAMS.type === 'curtate') {
                trochoid.lineLen = Math.floor(trochoid.radius * 0.65)
            } else if (PARAMS.type === 'prolate') {
                trochoid.lineLen = Math.floor(trochoid.radius * 1.4)
            } else if (PARAMS.type === 'cycloid') {
                trochoid.lineLen = trochoid.radius
            }
            rc.refresh()
        })
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.angleMode(p.RADIANS)
        trochoid = new TrochoidOnLine({ radius: PARAMS.radius, width: p.width })

        setupControlsLine()
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
