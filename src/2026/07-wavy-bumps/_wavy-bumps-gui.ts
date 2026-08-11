import { GuiExtra } from '~/helpers/gui/lilgui-extra'
import { WavyBumpsConfig } from './config'

export function buildWavyBumpsGui(
    gui: GuiExtra,
    C: WavyBumpsConfig,
    // {
    //     onRestart,
    //     onChange,
    //     onNewSeed,
    // }: { onRestart: () => void; onChange?: () => void; onNewSeed: () => void },
) {
    // const gui = new GuiExtra()

    const waves = gui.addFolder('waves').close()
    waves.add(C.waves, 'alpha', 0, 1, 0.01)
    waves.add(C.waves, 'overlap')

    const bumps = gui.addFolder('bumps').close()
    bumps.add(C.bumps, 'spacing', 5, 300, 1)
    bumps.add(C.bumps, 'lowMin', 0, 300, 1)
    bumps.add(C.bumps, 'lowMax', 0, 300, 1)
    bumps.add(C.bumps, 'highMin', 0, 500, 1)
    bumps.add(C.bumps, 'highMax', 0, 500, 1)
    bumps.add(C.bumps, 'peakMin', 0, 20, 1)
    bumps.add(C.bumps, 'peakMax', 0, 20, 1)
    bumps.add(C.bumps, 'peakWidth', 0, 300, 1)
    bumps.add(C.bumps, 'chaikinTimes', 0, 6, 1)
    bumps.add(C.bumps, 'regenerate')
    bumps.listen()

    const field = gui.addFolder('field').close()
    field.addVec2(C.field, 'density', 1, 50, 1)
    field.addVec2(C.field, 'moveAmtTop', 0, 100, 1)
    field.addVec2(C.field, 'moveAmtBot', 0, 100, 1)
    field.addVec2(C.field, 'noiseScale', 0, 0.4, 0.001)

    const path = gui.addFolder('stroke path').close()
    path.add(C.strokePath, 'flattenAngle', 0, 1, 0.01)
    path.add(C.strokePath, 'blendAngleAmt', 0, 1, 0.01)
    path.add(C.strokePath, 'stepLen', 1, 100, 1)
    path.add(C.strokePath, 'steps', 1, 20, 1)

    const ribbons = gui.addFolder('stroke ribbons').close()
    ribbons.add(C.strokeRibbon, 'width', 1, 20, 1)
    ribbons.add(C.strokeRibbon, 'taper', 0, 1, 0.1)
    ribbons.add(C.strokeRibbon, 'taperLen', 0, 100, 1)

    const animate = gui.addFolder('animation').close()
    animate.add(C.animation, 'jitterRatio', 0.1, 7, 0.1)
    animate.add(C.animation, 'clumpAmt', 0, 300, 1)
    animate.add(C.animation, 'clumpScale', 0, 0.2, 0.0001)
    animate.add(C.animation, 'strokesPerFrame', 1, 50, 1)
    animate.add(C.animation, 'direction', ['up', 'down'])
    animate.add(C.animation, 'rowStagger', 0, 1, 0.01)

    const colors = gui.addFolder('colors')
    colors.add(C.colors, 'hue', 0, 360, 1).listen()
    colors.add(C.colors, 'addHue', 10, 350, 1).listen()
    colors.add(C.colors, 'lessSaturated').listen()
    colors.add(C.colors, 'regenerate')
    // let restart = gui.add({ restart: () => onRestart() }, 'restart')
    // gui.add({ newSeed: onNewSeed }, 'newSeed')

    return { colors, waves, bumps, field, path, ribbons, animate }
}
