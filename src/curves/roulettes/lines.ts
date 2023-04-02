import '../../style.css'
import p5 from 'p5'
import { Pane } from 'tweakpane'
import RefreshContainer from '../../helpers/refresh-container'
import initTrochoid from './parts/trochoid'

new p5((p: p5) => {
    let Trochoid = initTrochoid(p).TrochoidOnLine
    let circ
    let pane = new Pane()
    let rc = new RefreshContainer(pane)

    const makeInput = (value, onChange?: () => void, opts?) => {
        if (!opts) opts = { min: 1, max: 100, step: 1 }
        let input = pane.addInput(circ, value, opts)
        if (onChange) input.on('change', onChange)
        return input
    }

    const PARAMS = {
        radius: 50,
        type: 'cycloid',
    }

    function setupControlsLine() {
        const onChange = () => {
            circ.makeSteps()
            if (circ.radius > circ.lineLen) {
                PARAMS.type = 'curtate'
            } else if (circ.radius < circ.lineLen) {
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
                circ.lineLen = Math.floor(circ.radius * 0.65)
            } else if (PARAMS.type === 'prolate') {
                circ.lineLen = Math.floor(circ.radius * 1.4)
            } else if (PARAMS.type === 'cycloid') {
                circ.lineLen = circ.radius
            }
            rc.refresh()
        })
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.angleMode(p.RADIANS)
        circ = new Trochoid({ radius: PARAMS.radius })

        setupControlsLine()
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
