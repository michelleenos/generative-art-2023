import { GuiExtra } from '~/helpers/gui/lilgui-extra'
import { WavyBumpsConfig } from './config'

export function buildWavyBumpsGui(
    C: WavyBumpsConfig,
    { onChange, onNewSeed }: { onChange?: () => void; onNewSeed: () => void },
) {
    const gui = new GuiExtra()
    gui.add(C, 'spacing', 5, 300, 1)
    gui.add(C, 'alpha', 0, 1, 0.01)
    gui.add(C, 'overlap')
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

    const sf = gui.addFolder('field').close()
    sf.addVec2(C.field, 'density', 1, 50, 1)
    sf.addVec2(C.field, 'moveAmtTop', 0, 100, 1)
    sf.addVec2(C.field, 'moveAmtBot', 0, 100, 1)
    sf.addVec2(C.field, 'noiseScale', 0, 0.4, 0.001)

    const sif = gui.addFolder('stroke path').close()
    sif.add(C.strokePath, 'flattenAngle', 0, 1, 0.01)
    sif.add(C.strokePath, 'blendAngleAmt', 0, 1, 0.01)
    sif.add(C.strokePath, 'stepLen', 1, 100, 1)
    sif.add(C.strokePath, 'steps', 1, 20, 1)

    const rf = gui.addFolder('stroke ribbons').close()
    rf.add(C.strokeRibbon, 'width', 1, 20, 1)
    rf.add(C.strokeRibbon, 'taper', 0, 1, 0.1)
    rf.add(C.strokeRibbon, 'taperLen', 0, 100, 1)

    gui.onChange(() => onChange?.())
}
