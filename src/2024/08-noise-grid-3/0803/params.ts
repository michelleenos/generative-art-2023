import GUI from 'lil-gui'
import easing, { Easing } from '~/helpers/easings'
import { getStagger } from '~/helpers/stagger'

export const params = {
    minDepth: 2,
    maxDepth: 5,
    delayMin: 80,
    delayMax: 800,
    durationIn: 1100,
    durationOut: 800,
    eachAmount: 0.7,
    noiseFreqDiv: 2,
    noiseSpeedDiv: 1,
    noiseFreqColor: 1.63,
    noiseSpeedColor: 0.2,
    // noiseFreqAngle: 0.1,
    // noiseSpeedAngle: 0.1,
    innerRadiusAmt: 0.7,
    layers: 3,
    colorsDist: 0.2,
    minAge: 0,
    randomness: 0.2,

    divideInt: 3000,

    // easeInLayers: 'inBack' as Easing,
    easeIn: 'outQuint' as Easing,
    easeOut: 'outQuart' as Easing,
}

const updateStagger = (stagger: typeof cellStagger) => {
    stagger.in = getStagger({
        total: params.durationIn,
        each: params.durationIn * params.eachAmount,
        steps: params.layers,
    })
    stagger.out = getStagger({
        total: params.durationOut,
        each: params.durationOut * params.eachAmount,
        steps: params.layers,
    })
}

export const cellStagger = {
    in: getStagger({
        total: params.durationIn,
        each: params.durationIn * params.eachAmount,
        steps: params.layers,
    }),
    out: getStagger({
        total: params.durationOut,
        each: params.durationOut * params.eachAmount,
        steps: params.layers,
    }),
}

export const makeGui = () => {
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

    gui.add(params, 'noiseFreqDiv', 0, 100, 0.01)
    gui.add(params, 'noiseSpeedDiv', 0, 100, 0.01)
    gui.add(params, 'noiseFreqColor', 0, 2, 0.01)
    gui.add(params, 'noiseSpeedColor', 0, 2, 0.01)
    gui.add(params, 'innerRadiusAmt', 0, 1, 0.01)
    gui.add(params, 'colorsDist', 0, 1, 0.01)

    gui.add(params, 'minAge', 0, 5000, 10)
    gui.add(params, 'randomness', 0, 1, 0.01)

    gui.add(params, 'divideInt', 0, 10000, 10)

    let easeOpts = Object.keys(easing)
    gui.add(params, 'easeIn', easeOpts)
    gui.add(params, 'easeOut', easeOpts)
    // gui.add(params, 'easeInLayers', easeOpts)

    return gui
}
