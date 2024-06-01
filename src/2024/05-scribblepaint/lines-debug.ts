import { Lines } from './random-lines-p5'
import { GUI } from 'lil-gui'
import { DataView } from '~/helpers/debug/data-view'

let colorModeOptions = ['rgb', 'hsl', 'hsv', 'hsi', 'lab', 'oklab', 'lch', 'oklch', 'hcl', 'lrgb']

export const linesDebug = (lines: Lines, gui: GUI, dataView: DataView, onReset?: () => void) => {
    let mf = gui.addFolder('general').close()
    mf.add(lines, 'stepRate', 0, 5000, 1)
    mf.add(lines, 'stepMult', 1, 30, 1)

    mf.add(lines, 'alphaThreshold', 0, 255, 1)
    mf.add(lines, 'lineWidth', 1, 20, 0.5)
    mf.add(lines, 'longLineRatio', 0, 3, 0.01)
    mf.add(lines, 'newPixelRadius', 5, 2000, 1)
    mf.add(lines, 'newPixelMethod', ['random', 'rect', 'circle'])
    mf.add(lines, 'parallel', 1, 100, 1)

    let debug = {
        doRedraw: lines.redraw === false ? false : true,
        redraw: {
            rate: 50,
            maxMult: 2,
            after: 300,
        },
        reset: () => {
            if (onReset) onReset()
            lines.reset()
        },
    }

    let rf = gui.addFolder('redraw').close()
    let doRedrawControl = rf.add(debug, 'doRedraw')

    rf.add(debug.redraw, 'rate', 0, 1000, 1)
    rf.add(debug.redraw, 'maxMult', 1, 10, 0.1)
    rf.add(debug.redraw, 'after', 0, 1000, 1)
    rf.onChange(({ object, property, value, controller }) => {
        if (controller === doRedrawControl) {
            if (value) {
                lines.redraw = debug.redraw
                rf.controllersRecursive().forEach((c) => {
                    if (c !== doRedrawControl) c.enable()
                })
            } else {
                lines.redraw = false
                rf.controllersRecursive().forEach((c) => {
                    if (c !== doRedrawControl) c.disable()
                })
            }
        }
    })

    let lf = gui.addFolder('lengths').close()
    lf.add(lines.len, 'minStart', 0, 500, 1).name('minStart')
    lf.add(lines.len, 'minEnd', 0, 500, 1).name('minEnd')
    lf.add(lines.len, 'minReduceBy', 0, 500, 1).name('minReduce')
    lf.add(lines.len, 'max', 0, 1000, 1).name('max')
    lf.add(lines.len, 'maxForColor', 0, 1000, 1).name('maxForColor')

    let cf = gui.addFolder('colors').close()
    cf.add(lines.colors, 'mixSpace', colorModeOptions)
    cf.add(lines.colors, 'pattern', ['length', 'step'])
    cf.add(lines.colors, 'move', 0, 0.005, 0.000001)
    cf.add(lines.colors, 'sort', ['none', 'hue', 'saturation', 'lightness', 'luminance'])
    cf.add(lines.colors, 'sortDir', ['+', '-'])
    cf.add(lines.colors, 'shadowAmt', 0, 10, 0.01)
    cf.add(lines.colors, 'shadowAlpha', 0, 1, 0.01)
    cf.add(lines.colors.shadowOffset, '0', -1, 1, 0.01).name('shadowOffset.x')
    cf.add(lines.colors.shadowOffset, '1', -1, 1, 0.01).name('shadowOffset.y')

    // let sf = gui.addFolder('start vals').close()
    // sf.add(lines.lookPointStart, '0', 0, lines.width, 1).name('startPoint.x')
    // sf.add(lines.lookPointStart, '1', 0, lines.height, 1).name('startPoint.y')
    // sf.add(lines, 'angleStart', 0, Math.PI * 2)
    // sf.add(debg, 'randomizeStartVals').name('randomize')

    let wf = gui.addFolder('wiggle').close()
    wf.add(lines.wiggle, 'withinLine', 0, 5, 0.001)
    wf.add(lines.wiggle, 'onLinePointFail', 0, 5, 0.001)
    wf.add(lines.wiggle, 'betweenLine', 0, 5, 0.001)
    wf.add(lines.wiggle, 'dir', [1, -1, undefined])
    wf.add(lines.wiggle, 'nLines', 0, 1000, 1)
    wf.add(lines.wiggle, 'max', 0, 5, 0.01)

    let ff = gui.addFolder('fails').close()
    ff.add(lines.failsUntil, 'stop', 0, 10000, 1)
    ff.add(lines.failsUntil, 'moveLook', 0, 10000, 1)
    ff.add(lines.failsUntil, 'forceMoveLook', 0, 10000, 1)
    ff.add(lines.failsUntil, 'reduceMinLen', 0, 10000, 1)
    ff.add(lines.tries, 'pixel', 0, 1000, 1).name('tries.pixel')
    ff.add(lines.tries, 'linePoint', 0, 1000, 1).name('tries.linePoint')

    gui.add(debug, 'reset')
    // gui.add(debg, 'stop')
    // gui.add(debg, 'start')

    let ds = dataView.createSection('lines')
    ds.addNested(lines.state, 'linesDrawn')
    ds.addNested(lines.state, 'failsCount')
    ds.addNested(lines.state, 'angle')
    ds.addNested(lines.state, 'longLines.length', 'longLines len', 0)
    // ds.add(lines.state, 'lineLookPoint')
    ds.add(lines.state, 'currentMinLen', 1, 'length min current')
    ds.add(lines.state, 'redrawnCount', 0)
    ds.addNested(lines, 'state.longLinesSaved.length', 'longLines saved', 0)
    ds.add(lines.state, 'done')
    ds.add(lines.state, 'doneAdding')

    // @ts-ignore
    window.lines = lines
}
