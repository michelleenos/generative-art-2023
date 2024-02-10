import '../../style.css'
import { random, shuffle, clamp, map, round } from '~/helpers/utils'
import createCanvas from '~/helpers/canvas/createCanvas'
import { burst, crazyTiles } from '~/helpers/canvas/shapes'
import loop from '~/helpers/loop'

let palettes = {
    darks: [
        ['#6a105e', '#fa0939', '#0C2F4B', '#ed2b92'],
        ['#0e1428', '#5D2A42', '#3f612d', '#1d201f', '#414066'],
        ['#D01FD0', '#25A2DB', '#02BA36', '#BB1B4E'],
        ['#281951', '#4A64BF', '#E32033', '#FA5621'],
    ],
    lights: [
        ['#f6b02c', '#f24333', '#ff7a27', '#058ed9', '#5bc4f1', '#FC6C9C'],
        ['#f0a202', '#f18805', '#d95d39', '#d1dede', '#ceff1a'],
        ['#50b2d3', '#FF9F31', '#3CBC50', '#81d560'],
    ],
}

type Props = {
    iterations: number
    divisions: '2s' | '2s-3s' | 'random'
    minSize: number
    durationSingle: number
    overlapMotion: number
}

let props: Props = {
    iterations: 6,
    divisions: '2s',
    minSize: 50,
    durationSingle: 2000,
    overlapMotion: 3,
}

let width = 700
let height = 700
let { ctx } = createCanvas(width, height)
let colors = [...random(palettes.darks), ...random(palettes.lights)]
let totalDuration: number
let durationFrac: number

interface PatternProps {
    cx: number
    cy: number
    w: number
    h: number
    startTime?: number
    bg?: string
    fg?: string
}

class Pattern {
    cx: number
    cy: number
    w: number
    h: number
    startTime: number
    bg: string
    fg: string
    radius: number
    constructor({ cx, cy, w, h, startTime, bg, fg }: PatternProps) {
        this.cx = cx
        this.cy = cy
        this.w = w
        this.h = h
        this.startTime = startTime || 0
        this.bg = bg || '#fff'
        this.fg = fg || '#000'
        this.radius = Math.min(w, h) * 0.4
    }

    drawBg = () => {
        ctx.beginPath()
        ctx.rect(this.cx - this.w / 2, this.cy - this.h / 2, this.w, this.h)
        ctx.fillStyle = this.bg
        ctx.fill()
    }

    getProgress = (t: number) => {
        let p = (t < this.startTime ? t + 1 - this.startTime : t - this.startTime) / durationFrac
        return Math.min(1, p)
    }

    text = (text: string) => {
        ctx.save()
        ctx.font = 'bold 15px sans-serif'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#000'
        ctx.fillText(text, this.cx, this.cy)
        ctx.restore()
    }
}

interface PatternArt extends Pattern {
    draw(progress: number): void
}

class PatternBurst extends Pattern implements PatternArt {
    burstStart: number
    nodes: number

    constructor(props: PatternProps & { burstStart?: number; nodes?: number }) {
        super(props)
        this.burstStart = props.burstStart || 0
        this.nodes = props.nodes || 6
    }

    draw = (progress: number) => {
        let amtVary = 0.1 + 0.15 * Math.sin(progress * Math.PI)
        let burstStartVal = this.burstStart
        if (progress < 1) {
            burstStartVal += Math.PI * (2 / this.nodes) * 2 * progress
        }

        ctx.beginPath()
        burst(ctx, {
            cx: this.cx,
            cy: this.cy,
            r: this.radius,
            nodes: this.nodes,
            vary: this.radius * amtVary,
            start: burstStartVal,
        })
        ctx.fillStyle = this.fg
        ctx.fill()
    }
}

class PatternOutlines extends Pattern implements PatternArt {
    step: number
    wid: number
    iterations: number
    squareCx: number
    squareCy: number
    size: number
    constructor(
        props: PatternProps & {
            stepMult?: number
            widthMult?: number
            iterations?: number
            squareCx?: number
            squareCy?: number
            size?: number
        }
    ) {
        super(props)
        this.squareCx = props.squareCx ?? this.cx + random(-this.radius, this.radius)
        this.squareCy = props.squareCy ?? this.cy + random(-this.radius, this.radius)
        this.size = props.size ?? (random() < 0.5 ? this.w : this.h)
        this.step = this.size * (props.stepMult ?? 0.17)
        this.wid = this.size * (props.widthMult ?? 0.12)
        this.iterations = props.iterations ?? 3
    }

    draw(progress: number) {
        ctx.clip()
        let size = this.size
        if (progress < 0.5) {
            size = map(progress, 0, 0.5, this.size, this.size * 2)
        } else if (progress < 1) {
            size = map(progress, 0.5, 1, 0, this.size)
        }
        for (let i = 0; i < this.iterations; i++) {
            let radius = size - this.step * i
            if (radius <= 0) continue
            let x1 = this.squareCx - radius
            let x2 = this.squareCx + radius
            let y1 = this.squareCy - radius
            let y2 = this.squareCy + radius
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y1)
            ctx.lineTo(x2, y2)
            ctx.lineTo(x1, y2)
            ctx.closePath()

            let innerRadius = radius - this.wid
            if (innerRadius > 0) {
                let iX1 = this.squareCx - innerRadius
                let iX2 = this.squareCx + innerRadius
                let iY1 = this.squareCy - innerRadius
                let iY2 = this.squareCy + innerRadius
                ctx.moveTo(iX1, iY1)
                ctx.lineTo(iX2, iY1)
                ctx.lineTo(iX2, iY2)
                ctx.lineTo(iX1, iY2)
                ctx.closePath()
            }
            ctx.fillStyle = this.fg
            ctx.fill('evenodd')
        }
    }
}

let patterns: (PatternBurst | PatternOutlines)[] = []

function setup() {
    let tiles: { cx: number; cy: number; w: number; h: number }[] = []

    crazyTiles({
        x: width / 2,
        y: height / 2,
        w: width,
        h: height,
        iterations: props.iterations,
        fn: (x, y, w, h) => {
            tiles.push({ cx: x, cy: y, w, h })
        },
        minSize: props.minSize,
    })

    tiles = shuffle(tiles)
    let count = tiles.length
    let portion = 1 / count

    tiles.forEach((tile, i) => {
        let props = {
            cx: tile.cx,
            cy: tile.cy,
            w: tile.w,
            h: tile.h,
            startTime: i * portion,
            fg: colors[i % colors.length],
            bg: colors[(i + 1) % colors.length],
        }

        if (random() < 0.5) {
            patterns.push(
                new PatternBurst({
                    ...props,
                    burstStart: i * 0.2,
                })
            )
        } else {
            let iterations = random([3, 4, 5])
            patterns.push(
                new PatternOutlines({
                    ...props,
                    iterations,
                })
            )
        }
    })

    totalDuration = (patterns.length * props.durationSingle) / props.overlapMotion
    durationFrac = props.overlapMotion / patterns.length
}

function draw(t: number) {
    let progress = (t % totalDuration) / totalDuration

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)

    patterns.forEach((pattern, i) => {
        ctx.save()
        pattern.drawBg()
        let p = pattern.getProgress(progress)
        pattern.draw(p)
        ctx.restore()
    })
}

setup()
loop(draw)
