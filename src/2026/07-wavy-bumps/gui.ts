import { GuiExtra } from '~/helpers/gui/lilgui-extra'
import { WavyBumpsConfig } from './config'

export function buildWavyBumpsGui(
    C: WavyBumpsConfig,
    { onChange, onNewSeed }: { onChange?: () => void; onNewSeed: () => void },
) {
    const gui = new GuiExtra()
    gui.add(C, 'spacing', 5, 300, 1)
    gui.add(C, 'alpha', 0, 1, 0.01)
    gui.add(
        {
            newSeed: onNewSeed,
        },
        'newSeed',
    )

    const bf = gui.addFolder('bumps').close()
    bf.add(C.bumps, 'lowMin', 0, 300, 1)
    bf.add(C.bumps, 'lowMax', 0, 300, 1)
    bf.add(C.bumps, 'highMin', 0, 500, 1)
    bf.add(C.bumps, 'highMax', 0, 500, 1)
    bf.add(C.bumps, 'peakMin', 0, 20, 1)
    bf.add(C.bumps, 'peakMax', 0, 20, 1)
    bf.add(C.bumps, 'peakWidth', 0, 300, 1)
    bf.add(C.bumps, 'chaikinTimes', 0, 6, 1)

    const sf = gui.addFolder('strokes').close()
    sf.add(C.strokes, 'stepLen', 1, 100, 1)
    sf.add(C.strokes, 'steps', 1, 20, 1)
    sf.addVec2(C.strokes, 'density', 1, 200, 1)
    sf.addVec2(C.strokes, 'moveAmtTop', 0, 100, 1)
    sf.addVec2(C.strokes, 'moveAmtBot', 0, 100, 1)
    sf.add(C.strokes, 'useNoise')
    sf.addVec2(C.strokes, 'noiseScale', 0, 0.4, 0.001)
    sf.add(C.strokes, 'flattenAngle', 0, 1, 0.01)
    sf.add(C.strokes, 'blendAngleAmt', 0, 1, 0.01)

    const rf = gui.addFolder('stroke ribbons').close()
    rf.add(C.strokeRibbon, 'width', 1, 20, 1)
    rf.add(C.strokeRibbon, 'taper', 0, 1, 0.1)
    rf.add(C.strokeRibbon, 'taperLen', 0, 100, 1)
    rf.add(C.strokeRibbon, 'useCurves')

    gui.onChange(() => onChange?.())
}
