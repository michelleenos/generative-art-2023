import p5 from 'p5'
import '~/style.css'
import { Trochoid, CircleRoulette } from './roulette-drawings'
import { Controller, GUI } from 'lil-gui'

new p5((p: p5) => {
    let hypoepi = new CircleRoulette({ movingRadius: 100, lineLen: 50, baseRadius: 300 })
    let trochoid = new Trochoid({ movingRadius: 50, lineLen: 50, width: p.width })

    let lastTime = 0

    const specialHypocycloid = (ratio?: number) => {
        hypoepi.type = 'hypotrochoid'
        if (ratio) hypoepi.ratio = ratio
        hypoepi.lineLen = hypoepi.movingRadius
    }

    const specialEpicycloid = (ratio?: number) => {
        hypoepi.type = 'epitrochoid'
        if (ratio) hypoepi.ratio = ratio
        hypoepi.lineLen = hypoepi.movingRadius
    }

    const specialFns: { [key: string]: () => void } = {
        epicycloid: () => specialEpicycloid(),
        'epicycloid 1:1': () => specialEpicycloid(1),
        'epicycloid 2:1': () => specialEpicycloid(2),
        hypocycloid: () => specialHypocycloid(),
        'hypocycloid 2:1': () => specialHypocycloid(2),
        'hypocycloid 3:1': () => specialHypocycloid(3),

        cycloid: () => {
            trochoid.lineLen = trochoid.movingRadius
        },
        'curtate cycloid': () => {
            trochoid.lineLen = Math.floor(trochoid.movingRadius * 0.65)
        },
        'prolate cycloid': () => {
            trochoid.lineLen = Math.floor(trochoid.movingRadius * 1.4)
        },
    }
    let params = {
        show: hypoepi,
        trochoidSpecial: '',
        circSpecial: '',
    }

    let gui = new GUI()

    function setGui() {
        const onChangeShow = () => {
            if (params.show instanceof CircleRoulette) {
                cfold.show()
                lFold.hide()
            } else {
                cfold.hide()
                lFold.show()
            }
        }
        gui.add(params, 'show', { 'hypo/epi': hypoepi, trochoid: trochoid }).onChange(onChangeShow)

        let animControls: Controller[] = []
        let cfold = gui.addFolder('Hypotrochoid')
        cfold.add(hypoepi, 'animate').onChange(() => {
            if (!hypoepi.animate) {
                animControls.forEach((c) => c.hide())
            } else {
                animControls.forEach((c) => c.show())
            }
        })

        cfold.add(hypoepi, 'type', ['hypotrochoid', 'epitrochoid']).onChange(() => {
            hypoepi.makeSteps()
        })
        cfold.add(hypoepi, 'fixRatio')
        cfold.add(hypoepi, 'movingRadius', 10, 300, 1).listen()
        cfold.add(hypoepi, 'baseRadius', 10, 500, 1).listen()
        cfold.add(hypoepi, 'ratio', 0.1, 20.1).listen().decimals(2)
        cfold.add(hypoepi, 'lineLen', 10, 500, 1)
        animControls.push(cfold.add(hypoepi, 'speed', 0.01, 2, 0.01))
        cfold.add(hypoepi, 'showBase')
        animControls.push(cfold.add(hypoepi, 'showMoving'))
        animControls.push(cfold.add(hypoepi, 'restart'))
        cfold.onChange(() => hypoepi.makeSteps())

        // let cFold2 = cfold.addFolder('Special')

        cfold
            .add(params, 'circSpecial', {
                epicycloid: 'epicycloid',
                'epicycloid 1:1 (cardioid)': 'epicycloid 1:1',
                'epicycloid 2:1 (nephroid)': 'epicycloid 2:1',
                hypocycloid: 'hypocycloid',
                'hypocycloid 2:1 (tusi couple)': 'hypocycloid 2:1',
                'hypocycloid 3:1 (deltoid)': 'hypocycloid 3:1',
            })
            .onChange((v: string) => {
                if (specialFns[v]) {
                    specialFns[v]()
                    hypoepi.makeSteps()
                }
            })
            .name('special types')

        let lFold = gui.addFolder('Trochoid')
        let lAnimControls: Controller[] = []
        lFold
            .add(trochoid, 'lineLen', 10, 500, 1)
            .onChange(trochoid.makeSteps.bind(trochoid))
            .listen()
        lFold.add(trochoid, 'movingRadius', 10, 300, 1).listen()
        lAnimControls.push(lFold.add(trochoid, 'showMoving'))
        lAnimControls.push(lFold.add(trochoid, 'speed', 0.01, 2, 0.01))
        lFold.add(trochoid, 'showBase')
        lFold.add(trochoid, 'showMoving')
        lFold.add(trochoid, 'animate').onChange(() => {
            if (!trochoid.animate) {
                lAnimControls.forEach((c) => c.hide())
            } else {
                lAnimControls.forEach((c) => c.show())
            }
        })

        lFold
            .add(params, 'trochoidSpecial', {
                cycloid: 'cycloid',
                'curtate cycloid': 'curtate cycloid',
                'prolate cycloid': 'prolate cycloid',
            })
            .name('special types')
            .onChange((v: string) => {
                if (specialFns[v]) {
                    specialFns[v]()
                    trochoid.makeSteps()
                }
            })

        onChangeShow()
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.angleMode(p.RADIANS)

        trochoid.width = p.width

        hypoepi.makeSteps()
        trochoid.makeSteps()

        setGui()
    }

    p.draw = function () {
        let ms = p.millis()
        let delta = ms - lastTime
        lastTime = ms
        p.background('#0a0a0a')
        p.translate(p.width / 2, p.height / 2)

        p.strokeWeight(1)
        p.noFill()
        p.stroke(255)

        params.show.tick(delta)
        params.show.draw(p)

        // p.fill(255).noStroke()
        // p.text(`Steps: ${trochoid.steps.length}`, -p.width / 2 + 20, -p.height / 2 + 30)
        // p.text(`MaxAngle: ${trochoid.maxAngle.toFixed(2)}`, -p.width / 2 + 20, -p.height / 2 + 50)
        // p.text(`StepSize: ${trochoid.stepSize.toFixed(4)}`, -p.width / 2 + 20, -p.height / 2 + 70)
        // let { num, denom } = simplify(trochoid.movingRadius, trochoid.baseRadius)
        // p.text(`denom: ${denom}, num: ${num} `, -p.width / 2 + 20, -p.height / 2 + 90)
    }
}, document.querySelector<HTMLElement>('#sketch') || undefined)
