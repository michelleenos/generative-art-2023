import '../../style.css'
import p5 from 'p5'
import 'p5/lib/addons/p5.sound.js'

var pitches = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84] // A minor pentatonic scale

new p5((p: p5) => {
    let synth: p5.PolySynth
    let sloop: p5.SoundLoop
    let bpm = 60
    let steps = 8
    let currentStep = 0
    let cols: Cell[][] = []
    // let rect: { width: number; height: number; x: number; y: number }

    class Cell {
        pos: p5.Vector
        w: number
        h: number
        pitch: number
        on: boolean
        step: number

        constructor(pos: p5.Vector, w: number, h: number, pitch: number, step: number) {
            this.pos = pos
            this.w = w
            this.h = h
            this.pitch = pitch
            this.on = false
            this.step = step
        }

        display() {
            p.stroke(200, 0, 100)
            p.strokeWeight(2)
            p.fill(this.on ? 100 : this.step === currentStep ? 150 : 200)
            p.rect(this.pos.x, this.pos.y, this.w, this.h)
        }

        toggle() {
            this.on = !this.on
        }
    }

    function createCells() {
        let w = p.width / steps
        let h = p.height / pitches.length
        for (let i = 0; i < steps; i++) {
            cols[i] = []
            for (let j = 0; j < pitches.length; j++) {
                let x = i * w
                let y = j * h
                cols[i][j] = new Cell(p.createVector(x, y), w, h, pitches[j], i)
            }
        }
    }

    p.setup = function () {
        p.createCanvas(600, 400)

        createCells()

        synth = new p5.PolySynth()
        sloop = new p5.SoundLoop(soundLoop, '8n')
        sloop.bpm = bpm

        p.frameRate(10)

        let btn = p.createButton('play/pause')
        btn.mouseClicked(() => {
            // @ts-ignore
            if (sloop.isPlaying) {
                sloop.pause()
            } else {
                sloop.start()
            }
        })
    }

    function soundLoop(time: number) {
        currentStep = (currentStep + 1) % steps
        let seconds = 0.5

        for (let i = 0; i < pitches.length; i++) {
            if (cols[currentStep][i].on) {
                let freq = p.midiToFreq(cols[currentStep][i].pitch)
                synth.play(freq, 0.1, time, seconds)
            }
        }
    }

    p.draw = function () {
        p.background(255)
        p.noStroke()

        for (let i = 0; i < cols.length; i++) {
            for (let j = 0; j < cols[i].length; j++) {
                cols[i][j].display()
            }
        }

        p.noStroke()
        p.fill(0)
        p.text(currentStep, p.width - 20, p.height - 20)
    }

    p.mouseClicked = function () {
        let x = p.floor(p.mouseX / (p.width / steps))
        let y = p.floor(p.mouseY / (p.height / pitches.length))
        let cell = cols[x][y]
        if (cell) cell.toggle()
    }
}, document.getElementById('sketch') ?? undefined)
