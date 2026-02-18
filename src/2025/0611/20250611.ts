import p5 from 'p5'
import '~/style.css'

import { getPaletteContexts, PaletteWithContext } from 'mish-bainrow'
import { random } from '~/helpers/utils'

type Pt = [number, number]

let pals = getPaletteContexts({
    isolateColors: true,
    minContrastBg: 0.2,
    minColors: 3,
    bgShade: { type: 'dark', lumEdge: 0.1 },
})

let pal: PaletteWithContext

let sideCount = 0
let lineCount = 0
new p5(
    (p: p5) => {
        let vpa: [number, number]
        let vpb: [number, number]
        let sides: Side[] = []
        let lines: Line[] = []
        let sizes: { w: number; h: number }

        class Side {
            x: number
            y1: number
            y2: number
            id: number
            linea1?: Line
            linea2?: Line
            lineb1?: Line
            lineb2?: Line
            a: Side[] = []
            b: Side[] = []
            drawn: boolean
            constructor(x: number, y1: number, y2: number) {
                this.x = x
                this.y1 = y1
                this.y2 = y2
                this.id = sideCount++
                this.drawn = false
            }

            getOrCreateLine(which: 'a1' | 'a2' | 'b1' | 'b2') {
                switch (which) {
                    case 'a1':
                        if (!this.linea1) this.linea1 = new Line([this.x, this.y1], vpa, this)
                        return this.linea1
                    case 'a2':
                        if (!this.linea2) this.linea2 = new Line([this.x, this.y2], vpa, this)
                        return this.linea2
                    case 'b1':
                        if (!this.lineb1) this.lineb1 = new Line([this.x, this.y1], vpb, this)
                        return this.lineb1
                    case 'b2':
                        if (!this.lineb2) this.lineb2 = new Line([this.x, this.y2], vpb, this)
                        return this.lineb2
                    default:
                        throw new Error('Invalid line type')
                }
            }

            setLinesA(line1: Line, line2: Line) {
                if (this.linea1) console.warn('Overwriting existing linea1')
                this.linea1 = line1
                line1.addSides(this)
                if (this.linea2) console.warn('Overwriting existing linea2')
                this.linea2 = line2
                line2.addSides(this)
            }

            setLinesB(line1: Line, line2: Line) {
                if (this.lineb1) console.warn('Overwriting existing lineb1')
                this.lineb1 = line1
                line1.addSides(this)
                if (this.lineb2) console.warn('Overwriting existing lineb2')
                this.lineb2 = line2
                line2.addSides(this)
            }

            setSides(a: Side | null, b: Side | null) {
                if (a) {
                    if (!this.a.includes(a)) {
                        this.a.push(a)
                        if (!a.a.includes(this)) {
                            a.a.push(this)
                        }
                    }
                }
                if (b) {
                    if (!this.b.includes(b)) {
                        this.b.push(b)
                        if (!b.b.includes(this)) {
                            b.b.push(this)
                        }
                    }
                }
            }
        }

        class Line {
            m: number
            yInt: number
            drawn = false
            sides: Side[] = []
            id = lineCount++

            constructor(p1: Pt, p2: Pt, side?: Side) {
                this.m = (p2[1] - p1[1]) / (p2[0] - p1[0])
                this.yInt = p1[1] - this.m * p1[0]
                if (side) this.sides.push(side)

                lines.push(this)
            }

            getY(x: number) {
                return this.m * x + this.yInt
            }

            getX(y: number) {
                return (y - this.yInt) / this.m
            }

            drawFull() {
                if (this.drawn) return

                // p.stroke(255 - 50 * this.sides.length, 0, 100 + 80 * this.sides.length, 255)
                p.stroke(`${pal.colors[0]}55`).strokeWeight(1).noFill()

                let y1 = this.getY(-sizes.w)
                let y2 = this.getY(sizes.w)
                p.line(-sizes.w, y1, sizes.w, y2)

                this.drawn = true
            }

            addSides(...sides: Side[]) {
                sides.forEach((side) => {
                    if (!this.sides.includes(side)) {
                        this.sides.push(side)
                    }
                })
            }
        }

        function getSideVals(from: Side, dir: 'a' | 'b', x: number) {
            let line1, line2: Line
            if (dir === 'a') {
                line1 = from.getOrCreateLine('a1')
                line2 = from.getOrCreateLine('a2')
            } else {
                line1 = from.getOrCreateLine('b1')
                line2 = from.getOrCreateLine('b2')
            }
            let y1 = line1.getY(x)
            let y2 = line2.getY(x)
            return { y1, y2, line1, line2 }
        }

        function getSide(from: Side, dir: 'a' | 'b', x: number) {
            let side = new Side(x, 0, 0)

            if (dir === 'a') {
                let [line1, line2] = [from.getOrCreateLine('a1'), from.getOrCreateLine('a2')]

                side.y1 = line1.m * x + line1.yInt
                side.y2 = line2.m * x + line2.yInt

                side.setLinesA(line1, line2)
                side.setSides(from, null)
            } else {
                let [line1, line2] = [from.getOrCreateLine('b1'), from.getOrCreateLine('b2')]
                side.y1 = line1.m * x + line1.yInt
                side.y2 = line2.m * x + line2.yInt
                side.setLinesB(line1, line2)
                side.setSides(null, from)
            }

            return side
        }

        function joinSide(side1: Side, side2: Side, dir: 'a-b' | 'b-a') {
            // let dir: 'a-b' | 'b-a' = side1.x < side2.x ? 'a-b' : 'b-a'
            // if (side1.a.length > side1.b.length) {
            //     dir = 'b-a'
            // } else {
            //     dir = 'a-b'
            // }

            let lineb1, linea1, lineb2, linea2: Line

            if (dir === 'b-a') {
                lineb1 = side1.getOrCreateLine('b1')
                linea1 = side2.getOrCreateLine('a1')
                lineb2 = side1.getOrCreateLine('b2')
                linea2 = side2.getOrCreateLine('a2')
            } else {
                linea1 = side1.getOrCreateLine('a1')
                lineb1 = side2.getOrCreateLine('b1')
                linea2 = side1.getOrCreateLine('a2')
                lineb2 = side2.getOrCreateLine('b2')
            }

            let x = (linea1.yInt - lineb1.yInt) / (lineb1.m - linea1.m)
            let y1 = lineb1.getY(x)
            let y2 = lineb2.getY(x)

            let side = new Side(x, y1, y2)

            side.setLinesA(linea1, linea2)
            side.setLinesB(lineb1, lineb2)
            dir === 'a-b' ? side.setSides(side1, side2) : side.setSides(side2, side1)
            return side
        }

        function drawSide(side: Side, recursive = true) {
            if (side.drawn) return
            side.drawn = true

            p.stroke(pal.colors[2]).strokeWeight(2)
            p.line(side.x, side.y1, side.x, side.y2)
            // p.fill(255).noStroke()
            // p.text(`${side.id}`, side.x + 5, side.y1 - 5 + random(-20, 0))

            let { a, b } = side

            a.forEach((sideA) => {
                if (!sideA.drawn) {
                    p.stroke(pal.colors[1]).strokeWeight(2)
                    p.line(side.x, side.y1, sideA.x, sideA.y1)
                    p.line(side.x, side.y2, sideA.x, sideA.y2)

                    p.fill(`${pal.colors[1]}77`).noStroke()
                    p.beginShape()
                    p.vertex(side.x, side.y1)
                    p.vertex(sideA.x, sideA.y1)
                    p.vertex(sideA.x, sideA.y2)
                    p.vertex(side.x, side.y2)
                    p.endShape(p.CLOSE)
                }
            })

            b.forEach((sideB) => {
                if (!sideB.drawn) {
                    p.stroke(pal.colors[1]).strokeWeight(2)
                    p.line(side.x, side.y1, sideB.x, sideB.y1)
                    p.line(side.x, side.y2, sideB.x, sideB.y2)

                    p.fill(`${pal.colors[1]}77`).noStroke()
                    p.beginShape()
                    p.vertex(side.x, side.y1)
                    p.vertex(sideB.x, sideB.y1)
                    p.vertex(sideB.x, sideB.y2)
                    p.vertex(side.x, side.y2)
                    p.endShape(p.CLOSE)
                }
            })

            const maybeDrawLine = (line: Line | undefined) => {
                if (line && !line.drawn) {
                    line.drawFull()
                }
            }

            maybeDrawLine(side.linea1)
            maybeDrawLine(side.linea2)
            maybeDrawLine(side.lineb1)
            maybeDrawLine(side.lineb2)

            if (recursive) {
                side.a.forEach((s) => drawSide(s, recursive))
                side.b.forEach((s) => drawSide(s, recursive))
            }
        }

        function getSizes() {
            let aspect = 4 / 3
            let w = p.width * 0.9
            let h = w / aspect
            if (h > p.height * 0.9) {
                h = p.height * 0.9
                w = h * aspect
            }
            return { w, h }
        }

        function findSide(
            sideFirst: 'a' | 'b',
            x: number,
            fromSides: Side[],
        ): { side: Side; vp: 'a' | 'b' } | null {
            let index = fromSides.length - 1
            let limit = sizes.h * 0.45

            let vps: ('a' | 'b')[] = sideFirst === 'a' ? ['a', 'b'] : ['b', 'a']
            let vpi = 0
            while (index >= 0 && vpi < vps.length) {
                let side = fromSides[index]
                let newSideVals = getSideVals(side, vps[vpi], x)

                if (
                    newSideVals.y1 >= -limit &&
                    newSideVals.y2 >= -limit &&
                    newSideVals.y2 <= limit &&
                    newSideVals.y1 <= limit
                ) {
                    return { side: getSide(side, vps[vpi], x), vp: vps[vpi] }
                }
                index--
                if (index < 0 && vpi < vps.length - 1) {
                    index = fromSides.length - 1
                    vpi++
                }
            }

            // index = fromSides.length - 1
            // while (index >= 0) {
            //     let side = fromSides[index]
            //     let newSide = getSide(side, sideFirst === 'a' ? 'b' : 'a', x)
            //     if (newSide.y1 <= -sizes.h / 2 || newSide.y2 >= sizes.h / 2) {
            //         index--
            //         continue
            //     }
            //     return newSide
            // }

            return null
        }

        function newDrawing() {
            pal = random(pals)
            sizes = getSizes()

            p.clear()

            p.noiseSeed(p.random())
            vpa = [-sizes.w / 2, 0]
            vpb = [sizes.w / 2, 0]
            let limit = sizes.h * 0.45

            let s1h = sizes.h * p.random(0.1, 0.4)
            let s1y1 = p.random(0, sizes.h * 0.25)
            let s1y2 = p.min(s1y1 + s1h, limit)

            let s2h = sizes.h * p.random(0.1, 0.4)
            let s2y1 = p.random(0, sizes.h * 0.25) * -1
            let s2y2 = p.min(s2y1 - s2h, -limit)
            // let side1 = new Side(p.random(-200, 200), )
            let sides1 = [new Side(0, s1y1, s1y2)]
            let sides2 = [new Side(0, s2y1, s2y2)]

            let noiseCount = 0
            let count = 7
            let vplast: 'a' | 'b' = 'a'

            while (sides1.length < count) {
                let newSide: Side | null = null

                let tries = 0
                while (!newSide && tries < 100) {
                    noiseCount += 0.5
                    let x = p.constrain(
                        Math.sin((sides1.length / count) * Math.PI * 2) * p.noise(noiseCount),
                        -0.6,
                        0.6,
                    )
                    x = p.map(x, -0.6, 0.6, -sizes.w * 0.45, sizes.w * 0.45)
                    let newSideInfo = findSide(vplast === 'a' ? 'b' : 'a', x, sides1)
                    if (newSideInfo) {
                        vplast = newSideInfo.vp
                        newSide = newSideInfo.side
                    }
                    tries++
                }

                if (!newSide) {
                    console.log('Could not find new side after 100 tries, breaking')
                    break
                }

                sides1.push(newSide)
            }

            let lastSide = sides1[sides1.length - 1]
            let firstSide = sides1[0]
            sides1.push(joinSide(lastSide, firstSide, vplast === 'a' ? 'b-a' : 'a-b'))

            while (sides2.length < count) {
                let newSide: Side | null = null

                let tries = 0
                while (!newSide && tries < 100) {
                    noiseCount += 0.5
                    let x = p.constrain(
                        Math.sin((sides2.length / count) * Math.PI * 2) * p.noise(noiseCount),
                        -0.6,
                        0.6,
                    )
                    x = p.map(x, -0.6, 0.6, -sizes.w * 0.45, sizes.w * 0.45)
                    let newSideInfo = findSide(vplast === 'a' ? 'b' : 'a', x, sides2)
                    if (newSideInfo) {
                        vplast = newSideInfo.vp
                        newSide = newSideInfo.side
                    }
                    tries++
                }

                if (!newSide) {
                    console.log('Could not find new side after 100 tries, breaking')
                    break
                }

                sides2.push(newSide)
            }
            lastSide = sides2[sides2.length - 1]
            firstSide = sides2[0]
            sides2.push(joinSide(lastSide, firstSide, vplast === 'a' ? 'b-a' : 'a-b'))

            sides = [...sides1, ...sides2]

            sides.forEach((side) => (side.drawn = false))

            p.background(pal.bg)

            p.push()
            p.translate(p.width / 2, p.height / 2)

            let border = 10
            p.fill(pal.bg).stroke(pal.colors[2]).strokeWeight(border)
            p.rect(
                -sizes.w / 2 - border / 2,
                -sizes.h / 2 - border / 2,
                sizes.w + border,
                sizes.h + border,
            )

            p.beginClip()
            p.rect(-sizes.w / 2, -sizes.h / 2, sizes.w, sizes.h)
            p.endClip()

            sides.forEach((side) => {
                drawSide(side)
            })

            p.pop()
        }

        p.setup = () => {
            p.createCanvas(window.innerWidth, window.innerHeight)
            p.noLoop()
        }

        p.draw = () => {
            newDrawing()
        }

        p.mouseClicked = function () {
            p.redraw()
        }
    },
    document.getElementById('sketch') ?? undefined,
)
