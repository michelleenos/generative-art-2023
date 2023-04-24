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

export type PtsIndexToMove = false | [number, number] | number

export type MoveOpts = {
    mult?: [number, number]
    subset?: PtsIndexToMove
}

export interface MoveCenterOpts extends MoveOpts {
    pts: p5.Vector[]
}

export type ShapeOpts = {
    scale?: [number, number]
    rotate?: boolean
    moveOpts?: MoveOpts
}

export type TrisOpts = {
    scale?: [number, number] | number
    scaleChance?: number
    num?: number
    translate?: false | number
    chooseColor?: () => void
}

export type CirclesOpts = {
    radius?: number | (() => number)
    num?: number
    chooseColor?: () => void
    translate?: false | number
}

export const shapeUtils = (p: p5) => ({
    midpoint: (a, b) => p.createVector((a.x + b.x) / 2, (a.y + b.y) / 2),

    moveCenter: ({
        pts,
        subset = false,
        mult = [0.2, 0.8],
    }: MoveCenterOpts) => {
        let chooseFrom = pts
        if (typeof subset === 'number') {
            chooseFrom = [pts[subset]]
        } else if (typeof subset === 'object') {
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

    shapeMoved: function (
        pts: p5.Vector[],
        { moveOpts = {}, rotate = false, scale = [0.4, 0.6] }: ShapeOpts = {}
    ) {
        // let rotateVals = [p.PI * 0.5, p.PI * 0.25, p.PI * -0.25]
        let scaleVal = p.random(scale[0], scale[1])

        p.push()
        this.moveCenter({ pts, ...moveOpts })
        // rotate && p.rotate(p.random(rotateVals))
        rotate && p.rotate(p.PI / 2)
        this.shape(pts.map((pt) => pt.copy().mult(scaleVal)))
        p.pop()
    },

    baseShape: function (pts: p5.Vector[]) {
        this.shapeMoved(pts, {
            scale: [0.8, 1.1],
            moveOpts: { mult: [0, 0.2] },
            // rotate: p.random() < 0.5,
        })
    },

    trisRound: function (
        pts: p5.Vector[],
        center: p5.Vector,
        {
            translate = 0.3,
            num = 3,
            scale = [0.5, 0.8],
            scaleChance = 1,
            chooseColor = undefined,
        }: TrisOpts = {},
        moveOpts?: MoveOpts
    ) {
        p.push()
        if (moveOpts) this.moveCenter({ pts, ...moveOpts })
        let indexes = pts.map((_, i) => i)
        p.shuffle(indexes, true)
        if (!num) num = p.floor(p.random(indexes.length))

        if (typeof scale === 'number') scale = [scale, scale]

        let len = indexes.length

        for (let i = 0; i < Math.min(num, len); i++) {
            let ind: number = indexes.pop()!
            let pt1 = pts[ind]
            let pt2 = pts[(ind + 1) % len]

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
            if (chooseColor) chooseColor()
            this.shape([center, pt1, pt2])
            p.pop()
        }

        p.pop()
    },

    trisMoved: function (
        pts: p5.Vector[],
        center: p5.Vector,
        trisOpts: TrisOpts = { num: 3, scaleChance: 1 },
        moveOpts: MoveOpts = { mult: [0.4, 0.8] }
    ) {
        p.push()
        this.moveCenter({ pts, ...moveOpts })
        this.trisRound(pts, center, trisOpts)
        p.pop()
    },

    lines: function (pts: p5.Vector[], center: p5.Vector, num = 0) {
        let ptsCopy = pts.map((pt) => pt)
        p.shuffle(ptsCopy, true)
        if (!num) num = p.floor(p.random(ptsCopy.length))

        for (let i = 0; i < Math.min(num, ptsCopy.length - 1); i++) {
            p.line(ptsCopy[i].x, ptsCopy[i].y, center.x, center.y)
        }
    },

    circles: function (
        pts: p5.Vector[],
        {
            radius = 7,
            num = 0,
            translate = 0.5,
            chooseColor = undefined,
        }: CirclesOpts = {}
    ) {
        let ptsCopy = pts.map((pt) => pt)
        p.shuffle(ptsCopy, true)
        if (!num) num = p.floor(p.random(ptsCopy.length))

        for (let i = 0; i < Math.min(num, ptsCopy.length - 1); i++) {
            let pt = ptsCopy[i]
            p.push()
            if (translate) {
                // let trans = this.midpoint(pt, center).mult(translate)
                let trans = pt.copy().mult(translate)
                p.translate(trans.x, trans.y)
            }
            let r = typeof radius === 'function' ? radius() : radius
            if (chooseColor) chooseColor()

            p.circle(0, 0, r)
            p.pop()
        }
    },
})
