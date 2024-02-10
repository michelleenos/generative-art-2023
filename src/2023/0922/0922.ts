import '../style.css'

import p5 from 'p5'

let palettes = [['#157A6E', '#77B28C', '#C2C5BB', '#1C2321']]

let palette: string[] = ['#1C2321', '#157A6E', '#77B28C', '#C2C5BB']

const props = {
    stepSize: 70,
}

const PI = Math.PI

const easeInOutSine = (x: number) => {
    return -(Math.cos(Math.PI * x) - 1) / 2
}

new p5((p: p5) => {
    let stepsX: number
    let stepsY: number
    let translate: { x: number; y: number }
    let div: HTMLElement

    p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight)

        // palette = [...p.random(palettes)]
        // palette = p.shuffle(palette)

        stepsX = Math.ceil(p.width / props.stepSize)
        stepsY = Math.ceil(p.height / props.stepSize)

        translate = {
            x: (p.width - stepsX * props.stepSize) / 2,
            y: (p.height - stepsY * props.stepSize) / 2,
        }
    }

    p.draw = () => {
        p.fill(palette[1])
        p.noStroke()

        p.translate(translate.x, translate.y)
        let st = props.stepSize
        let dia = st * 0.95

        // let ct = easeInOutSine(((p.frameCount * 0.002) % 1) * 2)
        let ct = 1 - Math.sin(((p.frameCount * 0.002) % 1) * PI)

        for (let x = 0; x < stepsX; x++) {
            for (let y = 0; y < stepsY; y++) {
                p.push()
                p.translate(props.stepSize * x, props.stepSize * y)

                let diff = p.noise(x * 0.2, y * 0.2, p.frameCount * 0.01)
                let t = Math.cos(p.frameCount * 0.02 + diff * 15 * ct) * 0.5 + 0.5

                if (x % 2 === y % 2) {
                    p.fill(palette[0])
                    p.rect(0, 0, props.stepSize, props.stepSize)

                    let dx = dia * t
                    let dy = st
                    p.fill(palette[1])
                    p.arc(0, st / 2, dx, dy, PI * -0.5, PI * 0.5)
                    p.arc(st, st / 2, dx, dy, PI * 0.5, PI * 1.5)
                } else {
                    p.fill(palette[1])
                    p.rect(0, 0, props.stepSize, props.stepSize)

                    let dx = st
                    let dy = dia * t
                    p.fill(palette[0])
                    p.arc(st / 2, 0, dx, dy, 0, p.PI)
                    p.arc(st / 2, st, dx, dy, p.PI, 0)
                }

                let middleCircDia = p.max(diff * 2 - 1, 0) * st
                p.fill(palette[2])
                p.circle(st / 2, st / 2, middleCircDia)

                p.pop()
            }
        }
    }
}, document.getElementById('sketch') ?? undefined)
