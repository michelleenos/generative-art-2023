import '../style.css'
import p5 from 'p5'
import { Pane } from 'tweakpane'
import easings from '../../helpers/easings'
import { shuffle } from '~/helpers/utils'

let palettes = [
    ['#98c1d9', '#6969b3', '#533a7b', '#94d2bd'],
    ['#e4572e', '#391d68', '#e8d7f1', '#d3bccc', '#1c7293'],
    ['#001219', '#94d2bd', '#e9d8a6', '#ee9b00', '#ca6702', '#bb3e03', '#ae2012', '#9b2226'],
    ['#071952', '#088395', '#05BFDB', '#94d2bd'],
    ['#071952', '#e9d8a6', '#05BFDB', '#088395'],
    ['#e9d8a6', '#ae2012', '#12b0b3', '#ee9b00'],
    ['#ee9b00', '#ca6702', '#bb3e03', '#9b2226'],
    ['#704da8', '#ee9b00', '#ca6702', '#9b2226'],
]

let palette: string[]

const props = {
    stepSize: 100,
    speed: 0.0001,
    speedCells: 0.0001,
    varyX: 0.5,
    varyY: -0.05,
    varyX2: -0.35,
    varyY2: 0.3,
    progressFnVary: 2,
}

const PI = Math.PI

const progressFns = [
    (pr: number) => Math.abs(easings.inCubic(pr * 2 - 1)),
    (pr: number) => easings.inCubic(Math.sin(pr * PI)),
    (pr: number) => 1 - easings.inCubic(Math.sin(pr * PI)),
    (pr: number) => 1 - Math.sin(pr * PI),
    (pr: number) => easings.outSine(Math.sin(pr * PI)),
]

let progressFnsOpts = [
    { value: 0, text: 'Math.abs(easeInCubic(pr * 2 - 1))' },
    { value: 1, text: 'easeInCubic(Math.sin(pr * PI))' },
    { value: 2, text: '1 - easeInCubic(Math.sin(pr * PI))' },
    { value: 3, text: '1 - Math.sin(pr * PI)' },
    { value: 4, text: 'easeInOutSine(Math.sin(pr * PI))' },
]

const setPane = (onChangeSize: () => void) => {
    let pane = new Pane()
    let folder = pane.addFolder({ title: 'Settings' })
    let stepSizeInput = folder.addInput(props, 'stepSize', { min: 10, max: 200, step: 1 })
    stepSizeInput.on('change', () => onChangeSize())

    folder.addInput(props, 'speed', { min: 0, max: 0.001, step: 0.000001 })
    folder.addInput(props, 'speedCells', { min: 0, max: 0.001, step: 0.000001 })
    folder.addInput(props, 'varyX', { min: -2, max: 2, step: 0.05 })
    folder.addInput(props, 'varyY', { min: -2, max: 2, step: 0.05 })
    folder.addInput(props, 'varyX2', { min: -2, max: 2, step: 0.001 })
    folder.addInput(props, 'varyY2', { min: -2, max: 2, step: 0.001 })
    folder.addInput(props, 'progressFnVary', {
        view: 'list',
        options: progressFnsOpts,
    })
}

new p5((p: p5) => {
    let stepsX: number
    let stepsY: number
    let translate: { x: number; y: number }

    const setSizes = () => {
        stepsX = Math.ceil(p.width / props.stepSize)
        stepsY = Math.ceil(p.height / props.stepSize)
        translate = {
            x: (p.width - stepsX * props.stepSize) / 2,
            y: (p.height - stepsY * props.stepSize) / 2,
        }
    }

    p.setup = () => {
        let canvas = p.createCanvas(window.innerWidth, window.innerHeight)
        canvas.mousePressed(() => {
            palette = [...p.random(palettes)]
            palette = shuffle(palette)
        })
        setSizes()
        palette = [...p.random(palettes)]
        palette = shuffle(palette)

        setPane(setSizes)
    }

    p.draw = () => {
        p.translate(translate.x, translate.y)
        let st = props.stepSize
        let dia = st * 0.95

        p.noStroke()

        let millis = p.millis()
        let pr = (millis * props.speed) % 1
        let pr_cells = (millis * props.speedCells) % 1

        // let ct = easeInOutSine(pr * 2)

        let vary_amount: number
        // vary_amount = Math.abs(easeInCubic(pr * 2 - 1))
        //  vary_amount = 1 - Math.sin(pr * PI)
        // vary_amount = easeInOutSine(Math.sin(pr * PI))
        vary_amount = progressFns[props.progressFnVary](pr)

        for (let x = 0; x < stepsX; x++) {
            for (let y = 0; y < stepsY; y++) {
                p.push()
                p.translate(props.stepSize * x, props.stepSize * y)

                let vary =
                    x * props.varyX +
                    y * props.varyY +
                    (stepsX / 2 - x) * props.varyX2 +
                    (stepsY / 2 - y) * props.varyY2
                vary %= 1
                let pr_cell = pr_cells + vary * vary_amount
                let t = easings.inOutSine(pr_cell * 2)
                // let t = progressFns[props.progressFnCell](pr_cell)

                if (x % 2 === y % 2) {
                    let accentBg = (y % 4 === 2 && x % 4 === 0) || (x % 4 === 2 && y % 4 === 0)
                    p.fill(palette[accentBg ? 3 : 0])
                    p.rect(0, 0, props.stepSize, props.stepSize)

                    let dx = dia * t
                    let dy = st

                    let accentRightCirc =
                        (y % 4 === 1 && x % 4 === 1) || (y % 4 === 3 && x % 4 === 3)
                    p.fill(palette[accentRightCirc ? 2 : 1])
                    p.arc(st, st / 2, dx, dy, PI * 0.5, PI * 1.5)

                    let accentLeftCirc =
                        (y % 4 === 1 && x % 4 === 3) || (y % 4 === 3 && x % 4 === 1)
                    p.fill(palette[accentLeftCirc ? 2 : 1])
                    p.arc(0, st / 2, dx, dy, PI * -0.5, PI * 0.5)
                } else {
                    let accentBg = (x % 4 === 2 && y % 4 === 1) || (x % 4 === 0 && y % 4 === 3)
                    p.fill(palette[accentBg ? 2 : 1])
                    p.rect(0, 0, props.stepSize, props.stepSize)

                    let dx = st
                    let dy = dia * t

                    let accentTop = (x % 4 === 0 && y % 4 === 3) || (x % 4 === 2 && y % 4 === 1)
                    p.fill(palette[accentTop ? 3 : 0])
                    p.arc(st / 2, 0, dx, dy, 0, p.PI)

                    let accentBottom = (x % 4 === 0 && y % 4 === 1) || (x % 4 === 2 && y % 4 === 3)
                    p.fill(palette[accentBottom ? 3 : 0])
                    p.arc(st / 2, st, dx, dy, p.PI, 0)
                }

                // let middleCircDia = p.max(vary * vary_amount, 0) * st * 0.2
                // p.fill(palette[2])
                // p.circle(st / 2, st / 2, middleCircDia)
                // p.fill(0)
                // p.noStroke()
                // p.text(`${pr_cell.toFixed(2)}`, st / 2, st / 2)
                p.pop()
            }
        }

        // Object.keys(rects).forEach((coords) => {
        //     let [x, y] = coords.split(',').map((v) => parseInt(v))
        //     p.stroke(255, 255, 255, 150)
        //     p.noFill()
        //     p.rect(x * st, y * st, st, st)
        // })
    }
}, document.getElementById('sketch') ?? undefined)
