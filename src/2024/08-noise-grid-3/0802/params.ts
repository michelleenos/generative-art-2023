import GUI from 'lil-gui'
import easing, { Easing } from '~/helpers/easings'
import { getStagger } from '~/helpers/stagger'

export const params = {
    minDepth: 2,
    maxDepth: 5,
    delayMin: 200,
    delayMax: 1000,
    durationIn: 1000,
    durationOut: 1000,
    eachAmount: 0.3,
    // noiseFreqDiv: 1,
    // noiseSpeedDiv: 4,
    noiseFreqAngle: 0.5,
    noiseSpeedAngle: 0.1,
    innerRadiusAmt: 0.7,
    layers: 5,
    divSpeed: 2,
    biasChangeSpeed: 9,
    minAge: 500,
    layersMag: 2,
    lwMult: 0.2,

    // easeInLayers: 'inBack' as Easing,
    easeIn: 'outQuad' as Easing,
    easeOut: 'outQuad' as Easing,
    easeThreshold: 'outCirc' as Easing,
}

const updateStagger = (stagger: typeof cellStagger) => {
    stagger.in = getStagger({
        durationTotal: params.durationIn,
        durationEach: params.durationIn * params.eachAmount,
        steps: params.layers,
    })
    stagger.out = getStagger({
        durationTotal: params.durationOut,
        durationEach: params.durationOut * params.eachAmount,
        steps: params.layers,
    })
}

export const cellStagger = {
    in: getStagger({
        durationTotal: params.durationIn,
        durationEach: params.durationIn * params.eachAmount,
        steps: params.layers,
    }),
    out: getStagger({
        durationTotal: params.durationOut,
        durationEach: params.durationOut * params.eachAmount,
        steps: params.layers,
    }),
}

export const makeGui = () => {
    let easeOpts = Object.keys(easing)

    const gui = new GUI().close()

    gui.add(params, 'minDepth', 1, 5, 1)
    gui.add(params, 'maxDepth', 1, 9, 1)
    gui.add(params, 'delayMin', 0, 1500, 10)
    gui.add(params, 'delayMax', 0, 1500, 10)

    let d = gui.addFolder('.')
    d.add(params, 'layers', 1, 6, 1)
    d.add(params, 'durationIn', 0, 5000, 10)
    d.add(params, 'durationOut', 0, 5000, 10)
    d.add(params, 'eachAmount', 0, 1, 0.01)
    d.onChange(() => {
        updateStagger(cellStagger)
    })

    gui.add(params, 'noiseFreqAngle', 0, 2, 0.01)
    gui.add(params, 'noiseSpeedAngle', 0, 2, 0.01)
    gui.add(params, 'innerRadiusAmt', 0, 1, 0.01)
    gui.add(params, 'divSpeed', 0, 6, 0.1)
    gui.add(params, 'biasChangeSpeed', 0, 10, 0.1)

    gui.add(params, 'minAge', 0, 5000, 10)
    gui.add(params, 'layersMag', 0, 10, 0.01)
    gui.add(params, 'lwMult', 0, 2, 0.01)

    gui.add(params, 'easeIn', easeOpts)
    gui.add(params, 'easeOut', easeOpts)
    // gui.add(params, 'easeInLayers', easeOpts)

    return gui
}
