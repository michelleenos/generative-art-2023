import { GUI } from 'lil-gui'
import p5 from 'p5'
import { DataView } from '~/helpers/debug/data-view'
import '../../style.css'
import { Lines } from './random-lines-p5'
import { Recorder } from './recorder'
import { linesDebug } from './lines-debug'
import { bgFluffy2 } from '../05-backgrounds/05backgrounds'

let palette =
    // ['#f398c3', '#cf3895', '#a0d28d', '#06b4b0', '#fed000', '#FF8552']
    [
        '#874286',
        //  '#856596',
        '#fc814a',
        '#f9c8ce',
        // '#a8d7a8',
        '#b6cccc',
        // '#8aadbc',
        // '#7a7eb8',
    ]
// ['#99dfff', '#60ebca', '#c4f5ed', '#b8ccfc', '#04996d', '#4467ab'],

// palette.reverse()

let dataView = new DataView()
let gui = new GUI()

new p5((p: p5) => {
    let g: p5.Graphics
    let lines: Lines
    let rSize: number // rendered size
    let gSize: number // graphics size
    let bg: HTMLCanvasElement

    function setSizesAndBg() {
        rSize = 700
        gSize = Math.floor(rSize * 0.7)
    }

    function linesDrawRecord(_: number) {
        return linesDraw(20)
    }

    function linesDraw(delta: number) {
        lines.update(delta)
        p.clear()
        p.push()

        p.noStroke()
        p.drawingContext.drawImage(bg, 0, 0, rSize, rSize)
        p.image(g, 0, 0, rSize, rSize)

        dataView.update()

        return lines.done
    }

    p.setup = function () {
        setSizesAndBg()
        let canvas = p.createCanvas(rSize, rSize)
        new Recorder({
            canvas: canvas.elt,
            fns: {
                drawRecord: linesDrawRecord,
                draw: linesDraw,
                reset: () => lines.reset(),
            },
            gui,
        })

        g = p.createGraphics(gSize, gSize)

        bg = bgFluffy2(rSize, 200, 90)
        let pd = Math.min(p.pixelDensity(), 2)

        lines = new Lines(g, {
            pd,
            palette,
        })
        lines.stepRate = 4700
        lines.stepMult = 2
        lines.colors.pattern = 'step'
        lines.alphaThreshold = 245
        lines.lineWidth = 4
        lines.colors.move = 0.0001
        lines.colors.shadowAmt = 1
        lines.colors.shadowAlpha = 0.1
        lines.len.minStart = 40
        lines.len.minEnd = 15
        lines.len.minReduceBy = 1
        lines.len.max = 1000
        lines.longLineRatio = 0.5
        lines.colors.sort = 'luminance'
        lines.colors.move = 0.0001
        lines.colors.mixSpace = 'hsl'
        lines.colors.sortDir = '+'
        lines.colors.shadowAmt = 2
        lines.colors.shadowAlpha = 0.5
        lines.colors.pattern = 'length'
        lines.redraw = {
            rate: 10,
            maxMult: 5,
            after: 100,
        }
        lines.newPixelMethod = 'circle'
        lines.newPixelRadius = 100
        lines.wiggle.withinLine = 0.1
        lines.wiggle.onLinePointFail = 0.15
        lines.wiggle.betweenLine = 0.01
        lines.wiggle.nLines = 400
        lines.wiggle.dir = '+'
        lines.wiggle.max = 3

        lines.failsUntil.moveLook = 15
        lines.failsUntil.reduceMinLen = 1500
        lines.failsUntil.stop = 2000
        lines.tries.pixel = 30
        lines.tries.linePoint = 55
        lines.reset()

        linesDebug(lines, gui, dataView)
        p.noLoop()
    }
}, document.getElementById('sketch') ?? undefined)
