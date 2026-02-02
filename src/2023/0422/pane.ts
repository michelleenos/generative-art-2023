import { Pane } from 'tweakpane'
import p5 from 'p5'
import { PARAMS as paramsDef } from './0422'

function setPane(
    PARAMS: typeof paramsDef,
    p: p5,
    initVelOpts: { [key: string]: string },
    makeParticles: (n: number, reset: boolean) => void,
    setup: () => void,
) {
    let pane = new Pane()
    const restart = () => {
        setup()
        p.loop()
    }

    pane.addBinding(PARAMS, 'gravityConstant', { min: 0.1, max: 3, step: 0.1 })

    let dFolder = pane.addFolder({ title: 'draw' })
    dFolder.addBinding(PARAMS.draw, 'strokeWeight', { min: 0, max: 10, step: 0.1 })
    dFolder.addBinding(PARAMS.draw, 'alpha', { min: 0, max: 1, step: 0.01 })
    dFolder.addBinding(PARAMS.draw, 'saturation', { min: 0, max: 100, step: 1 })
    dFolder.addBinding(PARAMS.draw, 'lightness', { min: 0, max: 100, step: 1 })
    dFolder.addBinding(PARAMS.draw, 'hueMin', { min: 0, max: 360, step: 1 })
    dFolder.addBinding(PARAMS.draw, 'hueMax', { min: 0, max: 360, step: 1 })
    dFolder.addBinding(PARAMS.draw, 'showAttractors')
    dFolder.addBinding(PARAMS.draw, 'showParticles')

    let pFolder = pane.addFolder({ title: 'particles grid' })
    pFolder
        .addBinding(PARAMS.particles, 'type', {
            options: { random: 'random', grid: 'grid' },
        })
        .on('change', setDisabled)

    function setDisabled() {
        gridOpts.forEach((input) => {
            input.hidden = PARAMS.particles.type === 'random'
        })
        randomOpts.forEach((input) => {
            input.hidden = PARAMS.particles.type === 'grid'
        })
    }

    let randomVelOpts = {
        '1': '1',
        '-1': '-1',
        '0': '0',
        random: 'random',
    }
    let randomOpts = [
        pFolder.addBinding(PARAMS.particles, 'nRandom', {
            min: 0,
            max: 100,
            step: 1,
        }),
        pFolder.addBinding(PARAMS.particles, 'initVelX', {
            options: randomVelOpts,
        }),
        pFolder.addBinding(PARAMS.particles, 'initVelY', {
            options: randomVelOpts,
        }),
    ]

    let gridOpts = [
        pFolder.addBinding(PARAMS.particles, 'initVelX', {
            options: initVelOpts,
        }),
        pFolder.addBinding(PARAMS.particles, 'initVelY', {
            options: initVelOpts,
        }),
        pFolder.addBinding(PARAMS.particles, 'nx', { min: 0, max: 100, step: 1 }),
        pFolder.addBinding(PARAMS.particles, 'ny', { min: 0, max: 100, step: 1 }),
        pFolder.addBinding(PARAMS.particles, 'gridXMin', {
            min: 0,
            max: 1,
            step: 0.05,
        }),
        pFolder.addBinding(PARAMS.particles, 'gridXMax', {
            min: 0,
            max: 1,
            step: 0.05,
        }),
        pFolder.addBinding(PARAMS.particles, 'gridYMin', {
            min: 0,
            max: 1,
            step: 0.05,
        }),
        pFolder.addBinding(PARAMS.particles, 'gridYMax', {
            min: 0,
            max: 1,
            step: 0.05,
        }),
    ]

    let a1 = pane.addFolder({ title: 'attractor 1' })
    a1.addBinding(PARAMS.a1, 'mass', { min: 1, max: 100, step: 1 })
    a1.addBinding(PARAMS.a1, 'pos', {
        x: { min: 0, max: 1, step: 0.01 },
        y: { min: 0, max: 1, step: 0.01 },
    })
    a1.addBinding(PARAMS.a1, 'enable')

    let a2 = pane.addFolder({ title: 'attractor 2' })
    a2.addBinding(PARAMS.a2, 'mass', { min: 1, max: 100, step: 1 })
    a2.addBinding(PARAMS.a2, 'pos', {
        x: { min: 0, max: 1, step: 0.01 },
        y: { min: 0, max: 1, step: 0.01 },
    })
    a2.addBinding(PARAMS.a2, 'enable')

    pFolder.on('change', restart)
    a1.on('change', restart)
    a2.on('change', restart)

    pane.addButton({ title: 'add 5 random particles' }).on('click', () => makeParticles(5, false))
    pane.addButton({ title: 'restart' }).on('click', restart)

    setDisabled()
    return pane
}

export default setPane
