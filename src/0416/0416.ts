import '../style.css'
import p5, { Oscillator } from 'p5'
import 'p5/lib/addons/p5.sound.js'
import { midiNumbers } from '~/helpers/midiNumbers'

// let btns = document.querySelector('#btns')

//prettier-ignore
const chords = {
    // C:      [48, 52, 55, 60, 64, 67],
    // d7:     [45, 50, 53, 57, 60, 62, 65],
    // Csus:   [48, 52, 53, 55, 60, 64, 65],
    // E7:     [47, 50, 52, 56, 59, 64, 68],
    // a7:     [45, 48, 52, 57, 60, 64, 67],
    // F:      [45, 48, 53, 57, 60, 65, 69],
    d7:     ['d2', 'f2', 'a2', 'c3', 'd3', 'f3', 'a3'],
    Csus:   ['c2', 'e2', 'f2', 'g2', 'c3', 'f3', 'g3'],
    E7:     ['d2', 'e2', 'e2', 'g#2','b2', 'e3', 'g#3'],
    a7:     ['c2', 'e2', 'g2', 'a2', 'c3', 'e3', 'g3'],
    F:      ['c2', 'f2', 'g2', 'a2', 'c3', 'f3', 'a3'],
}

let chooseChords = [chords.Csus, chords.d7, chords.a7, chords.F]

new p5((p: p5) => {
    class Particle {
        radius: number
        osc: Oscillator
        _freq: number
        x: number
        y: number
        addX: number
        addY: number
        playing: boolean = false
        touching: boolean = false
        env: p5.Envelope = new p5.Envelope()
        alphaOuter: number = 0
        lastTriggered: number = -Infinity
        hue: number
        freqHue: number

        constructor(freq = 200, addX = 3, addY = 2, radius = 8) {
            this.radius = radius
            this.osc = new p5.Oscillator(freq, 'triangle')
            this.x = p.random(0, p.width)
            this.y = p.random(0, p.height)
            this.addX = addX
            this.addY = addY
            this.osc.amp(0)
            this.osc.start()
            this._freq = freq
            this.freqHue = p.map(p.freqToMidi(freq), lowest, highest, 0, 360)
            this.hue = this.freqHue
            // this.env.set(0.1, 0.15, 0.1, 0.1, 0, 0)
            this.env.set(0.25, 0.15, 0.25, 0.1, 0.25, 0)
        }

        move() {
            this.x += this.addX
            this.y += this.addY

            if (this.x > p.width - this.radius) {
                this.addX = -p.abs(this.addX)
                // start = true
            }
            if (this.y > p.height - this.radius) {
                this.addY = -p.abs(this.addY)
                // start = true
            }
            if (this.x < this.radius) {
                this.addX = p.abs(this.addX)
                // start = true
            }
            if (this.y < this.radius) {
                this.addY = p.abs(this.addY)
                // start = true
            }
        }

        set freq(f: number) {
            this._freq = f
            this.osc.freq(f, 0)
            this.freqHue = p.map(p.freqToMidi(f), lowest, highest, 0, 360)
        }

        play(time) {
            if (!this.playing) {
                this.lastTriggered = time
                this.env.triggerAttack(this.osc, 0)
                this.alphaOuter = 1
                this.playing = true
            }
        }

        stop(time) {
            if (this.playing) {
                this.lastTriggered = time
                this.env.triggerRelease(this.osc, 0)
                this.playing = false
            }
        }

        draw() {
            this.hue = p.lerp(this.hue, this.freqHue, 0.1)

            // if (this.alphaOuter > 0) this.alphaOuter -= 0.01
            if (this.playing) {
                p.fill(this.hue, 80, 50, 0.3)
                p.circle(this.x, this.y, this.radius * 4)
            }

            p.fill(this.hue, 80, 50, 1)
            p.circle(this.x, this.y, this.radius * 2)

            let energy = fft.getEnergy(this._freq)
            p.text(energy, this.x + 10, this.y + 10)
        }

        distanceFrom(particle: Particle) {
            return p.dist(this.x, this.y, particle.x, particle.y)
        }
    }

    let distmax
    let particles: Particle[] = []
    let sloop
    let lowest
    let highest
    let fft
    let spectrum

    let chordsMidi = chooseChords.map((chord) => {
        return chord.map((note) => midiNumbers[note])
    })

    let chordsFreq = chooseChords.map((chord) => {
        return chord.map((note) => p.midiToFreq(midiNumbers[note]))
    })

    p.setup = function () {
        p.createCanvas(400, 400)
        distmax = (p.width + p.height) * 0.15
        p.colorMode(p.HSL)

        let freqVals = chordsMidi.reduce((acc, chord) => {
            return acc.concat(chord)
        }, [])
        lowest = p.min(freqVals)
        highest = p.max(freqVals)

        sloop = new p5.SoundLoop(() => {
            // console.log(time)
            // let index = (sloop.iterations - 1) % chordsArr.length
            // let chord = chordsArr[index]
            let chord = p.random(chordsFreq)
            for (let i = 0; i < particles.length; i++) {
                let note = chord[i % chord.length]
                particles[i].freq = note
            }
        }, 3)
        sloop.start()

        let current = chordsFreq[0]
        for (let i = 0; i < 7; i++) {
            let note = current[i % current.length]
            particles.push(
                new Particle(note, p.random(0.2, 2), p.random(0.2, 2))
            )
        }

        fft = new p5.FFT()
    }

    p.draw = function () {
        p.background(10)
        p.noStroke()

        spectrum = fft.analyze()
        p.fill(0, 0, 100, 1)
        p.beginShape()
        p.vertex(0, p.height)
        p.vertex(0, p.height)
        for (let i = lowest; i < highest; i++) {
            let x = p.map(i, lowest, highest, 0, p.width)
            let energy = fft.getEnergy(p.midiToFreq(i))
            let height = p.map(energy, 0, 255, 0, p.height)
            // p.rect(x, p.height, p.width / 300, h)
            p.curveVertex(x, height)
            if (p.frameCount === 30) {
                console.log({ x, height })
            }
        }
        p.vertex(p.width, p.height)
        p.vertex(p.width, p.height)
        p.endShape()

        if (p.frameCount === 30) {
            console.log({ lowest, highest })
            console.log(spectrum)
        }

        for (let i = 0; i < particles.length; i++) {
            particles[i].move()
            particles[i].draw()
        }

        for (let i = 0; i < particles.length; i++) {
            let touching = false
            for (let j = 0; j < particles.length; j++) {
                if (i == j) continue
                let d = particles[i].distanceFrom(particles[j])
                if (d < distmax) {
                    p.stroke(0, 100, 100, 0.2)
                    p.strokeWeight(1)
                    p.line(
                        particles[i].x,
                        particles[i].y,
                        particles[j].x,
                        particles[j].y
                    )
                    touching = true
                }
            }
            particles[i].touching = touching
            if (particles[i].touching) {
                particles[i].play(p.millis())
            } else {
                particles[i].stop(p.millis())
            }
        }
    }
})
