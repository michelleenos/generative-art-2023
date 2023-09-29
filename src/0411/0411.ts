import p5 from 'p5'
import '../style.css'
import { Pane } from 'tweakpane'
import RefreshContainer from '~/helpers/refresh-container'
import {
    createSheet,
    drawArcs,
    drawArcsTilted,
    drawCircles,
    drawPluses,
    drawRounded,
    drawRects,
    drawZigZag,
    drawArcs2,
    SheetOpts,
} from './sheet'

let palette = [
    [1, 60, 50],
    [250, 60, 50],
    [200, 60, 50],
    [145, 70, 45],
    [40, 90, 55],
]

let opts = {
    rects: 'rects',
    arcs: 'arcs',
    pluses: 'pluses',
    circles: 'circles',
    rounded: 'rounded',
    zigzag: 'zigzag',
    arcs2: 'arcs2',
}

type Pattern = {
    drawing: (typeof opts)[keyof typeof opts]
    color: p5.Color | string
    nx: number
    ny: number
    size1: number
    size2: number
    show: boolean
    offset: boolean
}

new p5((pmain: p5) => {
    // let btns = document.querySelector('#btns')
    let size: number
    let colors: string[] = pmain.shuffle(palette).map((c) => pmain.color(c).toString())

    pmain.setup = function () {
        pmain.createCanvas(window.innerWidth, window.innerHeight)
        pmain.noLoop()
        pmain.colorMode(pmain.HSL)
        size = pmain.min(pmain.width, pmain.height) * 0.6

        genPatterns()
    }

    let ONE: Pattern = {
        drawing: 'rects',
        color: pmain.random(colors).toString(),
        nx: 1,
        ny: 1,
        size1: 0.9,
        size2: 0.9,
        show: false,
        offset: false,
    }
    let TWO: Pattern = {
        drawing: 'rects',
        color: pmain.random(colors).toString(),
        nx: 5,
        ny: 5,
        size1: 0.75,
        size2: 0.75,
        show: true,
        offset: false,
    }
    let THREE: Pattern = {
        drawing: 'arcs2',
        color: pmain.random(colors).toString(),
        nx: 5,
        ny: 5,
        size1: 0.9,
        size2: 0.9,
        show: true,
        offset: false,
    }

    let pane = new Pane()
    let rc = new RefreshContainer(pane)
    let shapeOne = pane.addFolder({ title: 'shapeOne' })
    shapeOne.addInput(ONE, 'drawing', { options: opts, label: 'drawing' })
    shapeOne.addInput(ONE, 'nx', { min: 1, max: 12, step: 1 })
    shapeOne.addInput(ONE, 'ny', { min: 1, max: 12, step: 1 })
    shapeOne.addInput(ONE, 'size1', { min: 0, max: 1.5, step: 0.05 })
    shapeOne.addInput(ONE, 'size2', { min: 0, max: 1.5, step: 0.05 })
    shapeOne.addInput(ONE, 'color', { view: 'color' })
    shapeOne.addInput(ONE, 'show')
    shapeOne.addInput(ONE, 'offset')

    let shapeTwo = pane.addFolder({ title: 'shapeTwo' })
    shapeTwo.addInput(TWO, 'drawing', { options: opts, label: 'drawing' })
    shapeTwo.addInput(TWO, 'nx', { min: 1, max: 12, step: 1 })
    shapeTwo.addInput(TWO, 'ny', { min: 1, max: 12, step: 1 })
    shapeTwo.addInput(TWO, 'size1', { min: 0, max: 1.5, step: 0.05 })
    shapeTwo.addInput(TWO, 'size2', { min: 0, max: 1.5, step: 0.05 })
    shapeTwo.addInput(TWO, 'color', { view: 'color' })
    shapeTwo.addInput(TWO, 'show')
    shapeTwo.addInput(TWO, 'offset')

    let shapeThree = pane.addFolder({ title: 'shapeThree' })
    shapeThree.addInput(THREE, 'drawing', { options: opts, label: 'drawing' })
    shapeThree.addInput(THREE, 'nx', { min: 1, max: 12, step: 1 })
    shapeThree.addInput(THREE, 'ny', { min: 1, max: 12, step: 1 })
    shapeThree.addInput(THREE, 'size1', { min: 0, max: 1.5, step: 0.05 })
    shapeThree.addInput(THREE, 'size2', { min: 0, max: 1.5, step: 0.05 })
    shapeThree.addInput(THREE, 'color', { view: 'color' })
    shapeThree.addInput(THREE, 'show')
    shapeThree.addInput(THREE, 'offset')

    let btnRandom = pane.addButton({ title: 'generate random' })
    btnRandom.on('click', () => {
        genPatterns()
        draw()
    })

    let btnSave = pane.addButton({ title: 'save' })
    btnSave.on('click', () => pmain.saveCanvas('pattern', 'png'))

    pane.on('change', () => {
        if (!rc.refreshing) draw()
    })

    function setParam(PARAM: Pattern, color: p5.Color | string, drawOpts = Object.keys(opts)) {
        let drawing = pmain.random(drawOpts)
        PARAM['size1'] = pmain.round(pmain.random(0.6, 0.9), 2)
        PARAM['size2'] = pmain.round(pmain.random(0.6, 0.9), 2)

        if (drawing === 'arcs') {
            PARAM['nx'] = pmain.random([5, 6, 7, 8])
            PARAM['ny'] = PARAM['nx'] + pmain.random([-1, 0, 1])
        } else if (drawing === 'zigzag') {
            PARAM['nx'] = pmain.random([3, 4, 5, 6, 7, 8, 9])
            PARAM['ny'] = PARAM['nx'] + pmain.random([-1, 0, 1])
        } else if (drawing === 'pluses') {
            PARAM['nx'] = pmain.random([3, 4, 5, 6, 7, 8, 9])
            PARAM['ny'] = PARAM['nx']
        } else if (drawing === 'circles') {
            PARAM['nx'] = pmain.random([4, 5, 6, 7, 8, 9])
            PARAM['ny'] = PARAM['nx'] + pmain.random([-1, -2, 0, 1, 2])
        } else if (drawing === 'rounded') {
            PARAM['nx'] = pmain.random([1, 2, 3])
            PARAM['ny'] = PARAM['nx'] + pmain.random([3, 4, 5, 6, 7])
        } else if (drawing === 'arcs2') {
            PARAM['nx'] = pmain.random([5, 6, 7, 8, 9])
            PARAM['ny'] = PARAM['nx']
            PARAM['size1'] = pmain.random(0.7, 0.92)
            PARAM['size2'] = PARAM['size1']
        } else {
            PARAM['nx'] = pmain.random([1, 2, 3, 4, 5, 6, 7, 8, 9])
            PARAM['ny'] = pmain.random([1, 2, 3, 4, 5, 6, 7, 8, 9])
        }
        PARAM['color'] = color
        PARAM['drawing'] = drawing
    }

    function setParamTop(PARAM: Pattern, color: p5.Color | string, drawOpts = Object.keys(opts)) {
        let drawing = pmain.random(drawOpts)

        PARAM['size1'] = pmain.round(pmain.random(0.7, 0.9), 2)
        PARAM['size2'] = pmain.round(pmain.random(0.7, 0.9), 2)
        if (drawing === 'arcsTilted') {
            PARAM['nx'] = pmain.random([5, 6, 7, 8])
            PARAM['ny'] = PARAM['nx'] + pmain.random([-1, 0, 1])
        } else if (drawing === 'arcs') {
            PARAM['nx'] = pmain.random([5, 6, 7, 8])
            PARAM['ny'] = PARAM['nx'] + pmain.random([-1, 0, 1])
        } else if (drawing === 'zigzag') {
            PARAM['nx'] = pmain.random([3, 4, 5, 6, 7, 8, 9])
            PARAM['ny'] = PARAM['nx'] + pmain.random([-1, 0, 1])
        } else if (drawing === 'pluses') {
            PARAM['nx'] = pmain.random([3, 4, 5])
            PARAM['ny'] = PARAM['nx']
        } else if (drawing === 'circles') {
            PARAM['nx'] = pmain.random([3, 4, 5])
            PARAM['ny'] = PARAM['nx'] + pmain.random([-1, 0, 1])
            PARAM['size1'] = pmain.round(pmain.random(0.8, 0.95), 2)
            PARAM['size2'] = pmain.round(pmain.random(0.8, 0.95), 2)
        } else {
            PARAM['nx'] = pmain.random([1, 2, 3, 4])
            PARAM['ny'] = pmain.random([1, 2, 3, 4])
        }
        PARAM['color'] = color
        PARAM['drawing'] = drawing
    }

    function genPatterns() {
        let colors = pmain.shuffle(palette).map((c) => pmain.color(c).toString())

        setParam(TWO, colors[0])
        setParam(ONE, colors[1])
        setParamTop(THREE, colors[2], ['circles', 'rects', 'pluses', 'rounded'])

        rc.refresh()
    }

    function drawPattern(pattern: Pattern, sheetOpts: SheetOpts) {
        if (!pattern.show) return
        let p = pmain.createGraphics(sheetOpts.w, sheetOpts.h)
        p.colorMode(p.HSL)

        let sheet = createSheet(p, {
            ...sheetOpts,
            nx: pattern.nx,
            ny: pattern.ny,
        })

        let opts = {
            size: pattern.size1,
            size2: pattern.size2,
            offset: pattern.offset,
        }

        p.fill(pattern.color as p5.Color)
        p.noStroke()
        if (pattern.drawing === 'rects') {
            drawRects(sheet, p, opts)
        } else if (pattern.drawing === 'arcs') {
            drawArcs(sheet, p, opts)
        } else if (pattern.drawing === 'arcsTilted') {
            drawArcsTilted(sheet, p, opts)
        } else if (pattern.drawing === 'pluses') {
            drawPluses(sheet, p, opts)
        } else if (pattern.drawing === 'circles') {
            drawCircles(sheet, p, opts)
        } else if (pattern.drawing === 'rounded') {
            drawRounded(sheet, p, opts)
        } else if (pattern.drawing === 'zigzag') {
            drawZigZag(sheet, p, opts)
        } else if (pattern.drawing === 'arcs2') {
            drawArcs2(sheet, p, opts)
        }

        pmain.image(p, sheetOpts.x, sheetOpts.y)
    }

    pmain.draw = function () {
        draw()
    }

    function draw() {
        pmain.clear(0, 0, pmain.width, pmain.height)
        pmain.noStroke()

        let sheetOpts = {
            x: (pmain.width - size) * 0.1,
            y: (pmain.height - size) * 0.5,
            w: size,
            h: size,
        }

        console.log('drawing')

        drawPattern(ONE, sheetOpts)
        drawPattern(TWO, sheetOpts)
        drawPattern(THREE, sheetOpts)
    }
})
