import '../style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import loop from '~/helpers/loop'
import easings from '~/helpers/easings'
import { map, random } from '~/helpers/utils'
import { Pane } from 'tweakpane'
import RefreshContainer from '~/helpers/refresh-container'

let currentPreset: number
let pane: Pane
let rc: RefreshContainer
let params: Params

type Easing = keyof typeof easings

let width = window.innerWidth
let height = window.innerHeight

let { ctx, canvas } = createCanvas(width, height)

type Params = {
    ease_r: Easing
    ease_arc: Easing
    n: number
    r_max_mult: number
    r_min_mult: number
    arc_dist: number
    arc_start: number
    arc_calc: '1 - i/n' | 'i/n' | 'opposite'
    sides: 'same' | 'opposite'
    rotate: boolean
    animation: boolean
    phase: number
}

const defaults: () => Params = () => ({
    ease_r: 'inSine',
    ease_arc: 'inSine',
    n: Math.floor(random(35, 55)),
    r_max_mult: random(0.3, 0.45),
    r_min_mult: random(0.01, 0.1),
    arc_dist: 180,
    sides: random(['same', 'opposite']),
    arc_start: -90,
    arc_calc: random(['1 - i/n', 'i/n', 'opposite']),
    rotate: false,
    animation: false,
    phase: 1,
})

const presets: (() => Params)[] = [
    () => ({
        ...defaults(),
        ease_r: random(['inSine', 'inCubic']),
        ease_arc: 'inSine',
        r_min_mult: random(0.05, 0.15),
    }),
    () => ({
        ...defaults(),
        ease_arc: random(['inSine', 'inQuad']),
        r_min_mult: 0.01,
    }),
    () => ({
        ...defaults(),
        ease_r: random(['inOutQuart', 'inCirc', 'outSquareRoot']),
        ease_arc: random(['inSine', 'inQuad', 'inCubic', 'inQuart']),
        arc_calc: 'opposite',
        phase: 2,
    }),
]

const getParams = () => {
    let preset = Math.floor(random(presets.length))
    currentPreset = preset
    let vals = presets[preset]()
    return vals
}

params = getParams()

const setPane = () => {
    let easeOpts = Object.keys(easings).reduce((obj, current) => {
        obj[current] = current
        return obj
    }, {} as Record<string, string>)

    pane = new Pane({ title: 'settings' })
    pane.addInput(params, 'ease_r', { options: easeOpts })
    pane.addInput(params, 'ease_arc', { options: easeOpts })
    pane.addInput(params, 'n', { min: 1, max: 100, step: 1 })
    pane.addInput(params, 'r_max_mult', { min: 0, max: 1 })
    pane.addInput(params, 'r_min_mult', { min: 0, max: 1 })
    pane.addInput(params, 'arc_dist', { min: 0, max: 360 })
    pane.addInput(params, 'arc_start', { min: -180, max: 180 })
    pane.addInput(params, 'arc_calc', {
        options: { '1 - i/n': '1 - i/n', 'i/n': 'i/n', opposite: 'opposite' },
    })
    pane.addInput(params, 'sides', { options: { same: 'same', opposite: 'opposite' } })
    let inputAnim = pane.addInput(params, 'animation')
    let rotateAnim = pane.addInput(params, 'rotate', { hidden: !params.animation })
    let inputPhase = pane.addInput(params, 'phase', {
        min: 1,
        max: 3,
        step: 1,
        hidden: params.animation,
    })

    inputAnim.on('change', (e) => {
        if (e.value) {
            inputPhase.hidden = true
            rotateAnim.hidden = false
        } else {
            inputPhase.hidden = false
            rotateAnim.hidden = true
        }
    })

    rc = new RefreshContainer(pane)
}

function draw(t: number) {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = 'rgb(230,230,230)'
    ctx.fillRect(0, 0, width, height)

    let progress = params.animation ? (t * 0.0001) % 1 : params.phase * 0.25

    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.fillText(progress.toFixed(2), 10, 10)

    ctx.save()
    ctx.translate(width / 2, height / 2)
    if (params.rotate) ctx.rotate(progress * Math.PI)

    let size = Math.min(width, height)

    ctx.strokeStyle = '#000'
    ctx.lineWidth = 0.7

    for (let j = 0; j < 2; j++) {
        let n = params.n
        let y = 0
        let r_end = size * params.r_max_mult
        let r_start = size * params.r_min_mult
        let arc_start = params.arc_start * (Math.PI / 180) + (j === 0 ? 0 : Math.PI)
        let arc_dist = (params.arc_dist * Math.PI) / 180
        ctx.strokeStyle = `rgba(0,0,0,${1 - j * 0.5})`

        halfDrop({
            n,
            y,
            r_start,
            r_end,
            arc_start,
            ease_r: params.ease_r,
            ease_arc: params.ease_arc,
            arc_calc:
                params.arc_calc === 'opposite' ? (j === 0 ? '1 - i/n' : 'i/n') : params.arc_calc,
            progress,
            dir: params.sides === 'same' ? (j === 0 ? 'right' : 'left') : 'right',
            arc_dist,
        })
    }

    ctx.restore()

    ctx.fillText(`preset: ${currentPreset}`, 10, height - 10)
}

function halfDrop({
    n = 35,
    y = 0,
    r_start,
    r_end,
    arc_start = 0,
    arc_dist = Math.PI,
    ease_r = 'outSine',
    ease_arc = 'inSine',
    arc_calc = '1 - i/n',
    dir = 'right',
    progress,
}: {
    n?: number
    y?: number
    r_start: number
    r_end: number
    arc_start?: number
    arc_dist?: number
    ease_r?: Easing
    ease_arc?: Easing
    dir?: 'left' | 'right'
    arc_calc?: '1 - i/n' | 'i/n'
    progress: number
}) {
    let r_diff = r_end - r_start

    const right = (r: number, arc: number, p: number) => {
        ctx.beginPath()
        ctx.arc(0, y, r, arc_start, arc_start + arc * p)
        ctx.stroke()
    }
    const left = (r: number, arc: number, p: number) => {
        ctx.beginPath()
        ctx.arc(0, y, r, arc_start - arc * p, arc_start)
        ctx.stroke()
    }

    for (let i = 0; i < n; i++) {
        let r = r_start + r_diff * easings[ease_r](i / n)
        let arc = arc_dist * easings[ease_arc](arc_calc === '1 - i/n' ? 1 - i / n : i / n)

        if (progress < 0.25) {
            let p = map(progress, 0, 0.25, 0, 1)
            dir === 'right' ? right(r, arc, p) : left(r, arc, p)
        } else if (progress < 0.5) {
            dir === 'right' ? right(r, arc, 1) : left(r, arc, 1)
            let p = map(progress, 0.25, 0.5, 0, 1)
            dir === 'right' ? left(r, arc, p) : right(r, arc, p)
        } else if (progress < 0.75) {
            dir === 'right' ? left(r, arc, 1) : right(r, arc, 1)
            let p = map(progress, 0.5, 0.75, 0, 1)
            dir === 'right' ? right(r, arc, 1 - p) : left(r, arc, 1 - p)
        } else {
            let p = map(progress, 0.75, 1, 0, 1)
            dir === 'right' ? left(r, arc, 1 - p) : right(r, arc, 1 - p)
        }
    }
}

canvas.addEventListener('click', () => {
    let newParams = getParams()
    Object.assign(params, newParams)
    rc.refresh()
})

setPane()

loop(draw)
