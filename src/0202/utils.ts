import p5 from 'p5'

export const colorUtils = (p: p5, palette) => ({
    fillOrStroke: (index: number = -1, weight = 2) => {
        let color = index > -1 ? palette[index] : p.random(palette)
        if (p.random() < 0.5) {
            p.noFill()
            p.stroke(color)
            p.strokeWeight(weight)
        } else {
            p.noStroke()
            p.fill(color)
        }
    },
    stroke: (index: number = -1, weight = 2) => {
        p.noFill()
        p.stroke(index > -1 ? palette[index] : p.random(palette))
        p.strokeWeight(weight)
    },
    fill: (index: number = -1) => {
        p.noStroke()
        p.fill(index > -1 ? palette[index] : p.random(palette))
    },
    strokeFill: (iStroke: number = -1, iFill: number = -1, weight = 2) => {
        if (iStroke === -1) iStroke = p.floor(p.random(palette.length))
        p.stroke(palette[iStroke])
        if (iFill === -1) iFill = (iStroke + 1) % palette.length
        p.fill(palette[iFill])
        p.strokeWeight(weight)
    },
})

type PtsIndexToMove = false | [number, number] | number

type MoveOpts = {
    mult?: [number, number]
    subset?: PtsIndexToMove
}

interface MoveCenterOpts extends MoveOpts {
    pts: p5.Vector[]
}

type ShapeOpts = {
    scale?: [number, number]
    rotate?: boolean
    moveOpts?: MoveOpts
}

type TrisOpts = {
    scale?: [number, number] | number
    scaleChance?: number
    chance?: number
    translate?: false | number
}

export const shapeUtils = (p: p5) => ({
    midpoint: (a, b) => p.createVector((a.x + b.x) / 2, (a.y + b.y) / 2),

    tri: (a: p5.Vector, b: p5.Vector, c: p5.Vector) => {
        p.beginShape()
        p.vertex(a.x, a.y)
        p.vertex(b.x, b.y)
        p.vertex(c.x, c.y)
        p.vertex(a.x, a.y)
        p.endShape()
    },

    moveCenter: ({ pts, subset = false, mult = [0.2, 0.8] }: MoveCenterOpts) => {
        let chooseFrom = pts
        if (subset && typeof subset === 'number') {
            chooseFrom = [pts[subset]]
        } else if (subset && typeof subset === 'object') {
            chooseFrom = pts.slice(subset[0], subset[1])
        }
        let move = p.random(chooseFrom).copy().mult(p.random(mult[0], mult[1]))
        p.translate(move.x, move.y)
    },

    shape: (pts: p5.Vector[]) => {
        p.beginShape()
        pts.forEach((pt) => {
            p.vertex(pt.x, pt.y)
        })
        p.vertex(pts[0].x, pts[0].y)
        p.endShape()
    },

    shapeMoved: function (pts: p5.Vector[], { moveOpts = {}, rotate = false, scale = [0.4, 0.6] }: ShapeOpts = {}) {
        let scaleVal = p.random(scale[0], scale[1])
        p.push()
        this.moveCenter({ pts, ...moveOpts })
        rotate && p.rotate(p.PI / 2)
        this.shape(pts.map((pt) => pt.copy().mult(scaleVal)))
        p.pop()
    },

    baseShape: function (pts: p5.Vector[]) {
        this.shapeMoved(pts, { scale: [0.8, 1.1] })
    },

    trisRound: function (
        pts: p5.Vector[],
        center: p5.Vector,
        { translate = 0.3, chance = 1, scale = [0.6, 0.8], scaleChance = 0.5 }: TrisOpts = {}
    ) {
        let len = pts.length
        if (typeof scale === 'number') scale = [scale, 1]

        for (let i = 0; i < len; i++) {
            if (p.random() > chance) continue

            let pt1 = pts[i]
            let pt2 = pts[(i + 1) % len]

            p.push()
            if (translate) {
                let trans = this.midpoint(pt1, pt2).mult(translate)
                p.translate(trans.x, trans.y)
            }
            if (p.random() < scaleChance) {
                center = center.copy().mult(scale[0])
                pt1 = pt1.copy().mult(scale[0])
                pt2 = pt2.copy().mult(scale[0])
            } else {
                center = center.copy().mult(scale[1])
                pt1 = pt1.copy().mult(scale[1])
                pt2 = pt2.copy().mult(scale[1])
            }
            this.shape([center, pt1, pt2])
            p.pop()
        }
    },
})
