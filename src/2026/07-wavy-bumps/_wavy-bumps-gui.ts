import { GuiExtra } from '~/helpers/gui/lilgui-extra'
import { WavyBumpsConfig } from './_wavy-bumps-types'

export function buildWavyBumpsGui(gui: GuiExtra, C: WavyBumpsConfig) {
    const colorShiftCtrl = gui.add(C.inputs, 'colorShift', [1, 2, 3, 'random'])
    const bumpsTendencyCtrl = gui.add(C.inputs, 'bumpsTendency', ['flat', 'bumpy', 'random'])
    const fieldTypeCtrl = gui.add(C.inputs, 'fieldType', [
        'scribbly',
        'tight',
        'pointillism',
        'random',
    ])

    const waves = gui.addFolder('waves').close()
    waves.add(C.waves, 'alpha', 0, 1, 0.01)
    waves.add(C.waves, 'overlap')
    waves.add(C.waves, 'spacing', 5, 300, 1)
    waves.add(C.waves, 'lowMin', 0, 300, 1)
    waves.add(C.waves, 'lowMax', 0, 300, 1)
    waves.add(C.waves, 'highMin', 0, 500, 1)
    waves.add(C.waves, 'highMax', 0, 500, 1)
    waves.add(C.waves, 'peakMin', 0, 20, 1)
    waves.add(C.waves, 'peakMax', 0, 20, 1)
    waves.add(C.waves, 'peakWidth', 0, 300, 1)
    waves.add(C.waves, 'chaikinTimes', 0, 6, 1)
    waves.listen()

    const strokes = gui.addFolder('strokes').close()
    strokes.add(C.strokes, 'stepLen', 1, 100, 1)
    strokes.add(C.strokes, 'steps', 1, 20, 1)
    strokes.addVec2Items(C.strokes, 'density', 0.1, 40, 0.1)
    strokes.addVec2Items(C.strokes, 'moveAmtTop', 0, 100, 1)
    strokes.addVec2Items(C.strokes, 'moveAmtBot', 0, 100, 1)
    strokes.addVec2Items(C.strokes, 'noiseScale', 0, 0.4, 0.001)
    strokes.add(C.strokes, 'flattenAngle', 0, 1, 0.01)
    strokes.add(C.strokes, 'blendAngleAmt', 0, 1, 0.01)
    strokes.add(C.strokes, 'strokeWidth', 1, 20, 1)
    strokes.add(C.strokes, 'taper', 0, 1, 0.1)
    strokes.add(C.strokes, 'taperLen', 0, 100, 1)
    strokes.add(C.strokes, 'taperType', ['symmetric', 'end'])
    strokes.listen()

    const colors = gui.addFolder('colors').close()
    colors.add(C.colors, 'hue', 0, 360, 1)
    colors.add(C.colors, 'addHue', 10, 350, 1)
    colors.add(C.colors, 'lessSaturated')
    colors.listen()

    const animate = gui.addFolder('animation').close()
    animate.add(C.animation, 'jitterRatio', 0.1, 7, 0.1)
    animate.add(C.animation, 'clumpAmt', 0, 300, 1)
    animate.add(C.animation, 'clumpScale', 0, 0.2, 0.0001)
    animate.add(C.animation, 'strokesPerFrame', 1, 150, 1)
    animate.add(C.animation, 'direction', ['up', 'down'])
    animate.add(C.animation, 'rowStagger', 0, 1, 0.01)

    const sections = [
        { key: 'colors', folder: colors, input: colorShiftCtrl },
        { key: 'waves', folder: waves, input: bumpsTendencyCtrl },
        { key: 'strokes', folder: strokes, input: fieldTypeCtrl },
        { key: 'animation', folder: animate, input: null },
    ] as const

    const custom = gui.addFolder('custom')
    sections.forEach(({ key, folder, input }) => {
        const sync = () => {
            const on = C.custom[key]
            on ? folder.show() : folder.hide()
            // custom overrides the input for its section
            if (input) on ? input.disable() : input.enable()
        }
        custom.add(C.custom, key).onChange(sync)
        sync()
    })

    return { colors, waves, strokes, animate, custom }
}
