import GUI from 'lil-gui'
import easing, { Easing } from '~/helpers/easings'
import { getStagger } from '~/helpers/stagger'

export const params = {
    minDepth: 2,
    maxDepth: 5,
    delayMin: 50,
    delayMax: 400,
    durationIn: 1500,
    durationOut: 1500,
    eachAmount: 0.3,
    noiseFreqDiv: 2,
    noiseSpeedDiv: 4,
    noiseFreqColor: 1,
    noiseSpeedColor: 0.05,
    noiseFreqAngle: 0.1,
    noiseSpeedAngle: 0.1,
    rootSize: 200,
    innerRadiusAmt: 0.7,
    layers: 3,
    colorsDist: 0.2,
    threshold: 0.7,
    minAge: 0,
    randomness: 0.2,
    layersMag: 2,

    // easeInLayers: 'inBack' as Easing,
    easeIn: 'outCirc' as Easing,
    easeOut: 'outCirc' as Easing,
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

    gui.add(params, 'noiseFreqDiv', 0, 4, 0.01)
    gui.add(params, 'noiseSpeedDiv', 0, 4, 0.01)
    gui.add(params, 'noiseFreqColor', 0, 2, 0.01)
    gui.add(params, 'noiseSpeedColor', 0, 2, 0.01)
    gui.add(params, 'noiseFreqAngle', 0, 2, 0.01)
    gui.add(params, 'noiseSpeedAngle', 0, 2, 0.01)
    gui.add(params, 'innerRadiusAmt', 0, 1, 0.01)
    gui.add(params, 'colorsDist', 0, 1, 0.01)
    gui.add(params, 'threshold', 0, 1, 0.01).listen()
    gui.add(params, 'minAge', 0, 5000, 10)
    gui.add(params, 'randomness', 0, 1, 0.01)
    gui.add(params, 'layersMag', 0, 10, 0.01)

    let easeOpts = Object.keys(easing)
    gui.add(params, 'easeIn', easeOpts)
    gui.add(params, 'easeOut', easeOpts)
    // gui.add(params, 'easeInLayers', easeOpts)

    return gui
}
