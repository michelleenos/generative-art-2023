import p5 from 'p5'
import easing from '~/helpers/easings'
import '~/style.css'

new p5((p: p5) => {
    let graph: Graph
    p.setup = function () {
        p.createCanvas(800, 800)
        p.textAlign(p.CENTER, p.CENTER)
        p.noLoop()

        graph = new Graph(0.1, 2, 600)
    }

    p.draw = function () {
        p.background(255)
        p.push()

        p.translate(100, 600)
        graph.drawAxis()

        p.stroke(255, 0, 0).strokeWeight(2)
        graph.plotLine((x: number) => {
            let progress = x % 1
            let cp = progress
            cp = loopFns.linear(cp)
            // cp = p.constrain(cp, 0.3, 0.9)
            // cp = p.map(cp, 0.3, 0.9, 0, 1)
            return cp
        })

        {
            // 2 ways of doing the same thing
            // UNLESS you add the "constrain/map" bit

            p.stroke(255, 0, 255).strokeWeight(2)

            // graph.plotLine((x: number) => {
            //     let progress = x % 1
            //     let cp = progress
            //     cp = loopFns.inQuadAdj(cp)
            //     // if you uncomment this, it doesn't work so well:
            //     // cp = p.constrain(cp, 0.3, 0.9)
            //     // cp = p.map(cp, 0.3, 0.9, 0, 1)
            //     return cp
            // })
            p.stroke(0, 255, 255).strokeWeight(2)
            graph.plotLine((x: number) => {
                let progress = x % 1
                let cp = progress
                cp = (cp + 0.2) % 1 // this has to go before the loop
                cp = loopFns.linear(cp)
                // here if you uncomment this it still works
                cp = p.constrain(cp, 0.2, 0.7)
                cp = p.map(cp, 0.2, 0.7, 0, 1)
                cp = easing.inQuad(cp)
                return cp
            })

            graph.plotLine((x: number) => {
                let progress = x % 1
                let cp = progress
                cp = (cp + 0.1) % 1 // this has to go before the loop
                cp = loopFns.linear(cp)
                // here if you uncomment this it still works
                cp = p.constrain(cp, 0.2, 0.7)
                cp = p.map(cp, 0.2, 0.7, 0, 1)
                cp = easing.inQuad(cp)
                return cp
            })

            graph.plotLine((x: number) => {
                let progress = x % 1
                let cp = progress
                cp = (cp + 0.3) % 1 // this has to go before the loop
                cp = loopFns.linear(cp)
                // here if you uncomment this it still works
                cp = p.constrain(cp, 0.2, 0.7)
                cp = p.map(cp, 0.2, 0.7, 0, 1)
                cp = easing.inQuad(cp)
                return cp
            })
        }

        // all the nonmoving space is at the bottom
        // p.stroke(0, 255, 0).strokeWeight(2)
        // graph.plotLine((x: number) => {
        //     let progress = x % 1
        //     let cp = progress
        //     // cp = (cp + 0.2) % 1
        //     cp = p.constrain(cp, 0.2, 0.7)
        //     cp = p.map(cp, 0.2, 0.7, 0, 1)
        //     cp = loopFns.inQuadAdj(cp)
        //     return cp
        // })

        // if loop fn isn't linear, it's not what i intended:
        // p.stroke(0, 0, 255).strokeWeight(2)
        // graph.plotLine((x: number) => {
        //     let progress = x % 1
        //     let cp = progress
        //     // cp = (cp + 0.2) % 1
        //     cp = loopFns.inQuadAdj(cp)
        //     cp = p.constrain(cp, 0.3, 0.9)
        //     cp = p.map(cp, 0.3, 0.9, 0, 1)

        //     return cp
        // })

        // for (let i = 0; i < 2; i += 0.1) {
        //     // let progress = (sec % 3) / 3
        //     let progress = (i % 2) / 2
        //     let cp = p.constrain(progress, 0.3, 0.7)
        //     graph.showPoint(i, cp)
        // }

        p.pop()
    }

    const loopFns = {
        // inQuadAdj: (p) => Math.abs(easing.inQuad(p * 2 - 1)),
        outQuadAdj: (p) => easing.outQuad(p * 2),
        inQuadAdj: (p) => easing.inQuad(((p + 0.5) % 1) * 2 - 1),
        inCubicAdj: (p) => Math.abs(easing.inCubic(((p + 0.5) % 1) * 2 - 1)),
        inQuartAdj: (p) => easing.inQuart(((p + 0.5) % 1) * 2 - 1),
        inQuintAdj: (p) => Math.abs(easing.inQuint(((p + 0.5) % 1) * 2 - 1)),
        inCircAdj: (p) => easing.inCirc(((p + 0.5) % 1) * 2 - 1),
        bubbleTop: (p) => easing.inOutSine(Math.sin(p * Math.PI)),
        bubbleTopMore: (p) => easing.inOutQuart(Math.sin(p * Math.PI)),
        pointyTop: (p) => easing.inCubic(Math.sin(p * Math.PI)),
        pointyBottom: (p) => Math.abs(Math.sin(p * Math.PI)),
        inQuadCyc: (p) => (p < 0.5 ? easing.inQuad(p * 2) : 1 - easing.inQuad((p - 0.5) * 2)),
        linear: (p) => (p < 0.5 ? p * 2 : 1 - (p - 0.5) * 2),
    } satisfies { [key: string]: (progress: number) => number }

    class Graph {
        step: number
        size: number
        displaySize: number
        decimals: number

        constructor(step = 0.1, size = 1, displaySize = 500, decimals = 1) {
            this.step = step
            this.size = size
            this.displaySize = displaySize
            this.decimals = decimals
        }

        pointToDisplay(x: number, y: number) {
            return {
                x: (x / this.size) * this.displaySize,
                y: -(y / this.size) * this.displaySize,
            }
        }

        drawAxis() {
            p.stroke(0, 100)
            p.line(0, -p.height, 0, p.height)
            p.line(-p.width, 0, p.width, 0)
            let steps = this.size / this.step

            for (let i = 1; i <= steps; i++) {
                p.stroke(0, 100)
                p.noFill()
                let graphPos = i * this.step
                let displayPos = this.pointToDisplay(graphPos, 0).x
                p.line(displayPos, -5, displayPos, 5)
                p.line(-5, -displayPos, 5, -displayPos)

                p.stroke(0, 20)
                p.line(displayPos, 0, displayPos, -this.displaySize)
                p.line(0, -displayPos, this.displaySize, -displayPos)

                p.fill(0).noStroke()
                p.text(graphPos.toFixed(this.decimals), displayPos, 14)
                p.text(graphPos.toFixed(this.decimals), -14, -displayPos)
            }
        }

        plotLine(cb: (x: number, i: number) => number) {
            let precision = 0.005
            let ptPrev: { x: number; y: number } | null = null
            let steps = this.size / precision
            for (let i = 0; i <= steps; i++) {
                let x = i * precision
                let y = cb(x, i)
                let pt = this.pointToDisplay(x, y)
                if (ptPrev) {
                    p.line(ptPrev.x, ptPrev.y, pt.x, pt.y)
                }
                ptPrev = pt

                // if (i % 10 === 0) {
                //     p.circle(pt.x, pt.y, 5)
                // }
            }
        }

        showPoint(x: number, y: number) {
            let pt = this.pointToDisplay(x, y)
            p.circle(pt.x, pt.y, 5)
        }
    }
}, document.getElementById('sketch') ?? undefined)
