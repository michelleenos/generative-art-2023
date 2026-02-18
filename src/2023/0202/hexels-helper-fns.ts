import p5 from 'p5'

export const colorUtils = (p: p5, palette: string[]) => ({
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
        return this
    },
    stroke: (index: number = -1, weight = 2) => {
        p.noFill()
        p.stroke(index > -1 ? palette[index] : p.random(palette))
        p.strokeWeight(weight)
        return this
    },
    fill: (index: number = -1) => {
        p.noStroke()
        p.fill(index > -1 ? palette[index] : p.random(palette))
        return this
    },
    strokeFill: (iStroke: number = -1, iFill: number = -1, weight = 2) => {
        if (iStroke === -1) iStroke = p.floor(p.random(palette.length))
        p.stroke(palette[iStroke])
        if (iFill === -1) iFill = (iStroke + 1) % palette.length
        p.fill(palette[iFill])
        p.strokeWeight(weight)
        return this
    },
})

type NumOrMinMax = number | [min: number, max: number]

export interface MoveOpts {
    // distMin?: number
    dist?: NumOrMinMax
    // distMax?: number
    moveToIndex?: number
}

export interface ShapeOpts {
    scale?: NumOrMinMax
    rotate?: boolean
}

export interface TrisOpts {
    // scale?: number | [number, number]
    scaleBase?: number
    scaleAlt?: number
    scaleAltChance?: number
    num?: number
    translate?: NumOrMinMax | false
    colorFn?: () => void
}

export interface CirclesOpts {
    radius?: number | (() => number)
    num?: number
    colorFn?: () => void
    translate?: false | number
}

export interface LinesOpts {
    num?: number
}

export const shapeUtils = (p: p5) => ({
    midpoint: (a: p5.Vector, b: p5.Vector) => p.createVector((a.x + b.x) / 2, (a.y + b.y) / 2),

    moveCenter: (pts: p5.Vector[], { moveToIndex, dist = [0.2, 0.8] }: MoveOpts = {}) => {
        let move = (typeof moveToIndex === 'number' ? pts[moveToIndex] : p.random(pts))
            .copy()
            .mult(typeof dist === 'number' ? dist : p.random(...dist))
        p.translate(move.x, move.y)
    },

    shape: function (
        pts: p5.Vector[],
        { rotate = false, scale }: ShapeOpts = {},
        moveCenterOpts?: MoveOpts,
    ) {
        p.push()
        if (moveCenterOpts) this.moveCenter(pts, moveCenterOpts)
        rotate && p.rotate(p.PI / 2)
        let shapePts = [...pts]
        if (scale) {
            let scaleAmt = typeof scale === 'number' ? scale : p.random(...scale)
            shapePts = shapePts.map((pt) => pt.copy().mult(scaleAmt))
        }
        p.beginShape()
        shapePts.forEach((pt) => p.vertex(pt.x, pt.y))
        p.vertex(shapePts[0].x, shapePts[0].y)
        p.endShape()
        p.pop()
    },

    trisRound: function (
        pts: p5.Vector[],
        {
            translate = 0.3,
            num = 3,
            scaleBase = 0.5,
            scaleAlt,
            scaleAltChance = 0.5,
            colorFn = undefined,
        }: TrisOpts = {},
        moveOpts?: MoveOpts,
    ) {
        p.push()
        if (moveOpts) this.moveCenter(pts, { ...moveOpts })
        let indexes = pts.map((_, i) => i)
        p.shuffle(indexes, true)
        if (!num) num = p.floor(p.random(indexes.length))

        let len = indexes.length

        for (let i = 0; i < Math.min(num, len); i++) {
            let ind = indexes[i]
            let pt1 = pts[ind]
            let pt2 = pts[(ind + 1) % len]

            let scale = scaleBase
            if (typeof scaleAlt === 'number' && typeof scaleAltChance === 'number') {
                scale = p.random() < scaleAltChance ? scaleAlt : scale
            }

            p.push()
            if (translate) {
                let tr = typeof translate === 'number' ? translate : p.random(...translate)
                let trans = this.midpoint(pt1, pt2).mult(tr)
                p.translate(trans.x, trans.y)
            }

            pt1 = pt1.copy().mult(scale)
            pt2 = pt2.copy().mult(scale)

            if (colorFn) colorFn()
            this.shape([new p5.Vector(0, 0), pt1, pt2])
            p.pop()
        }

        p.pop()
    },

    lines: function (pts: p5.Vector[], { num = 0 }: LinesOpts = {}, moveOpts?: MoveOpts) {
        p.push()
        if (moveOpts) this.moveCenter(pts, moveOpts)
        let ptsCopy = pts.map((pt) => pt)
        p.shuffle(ptsCopy, true)
        if (!num) num = p.floor(p.random(ptsCopy.length))

        for (let i = 0; i < Math.min(num, ptsCopy.length - 1); i++) {
            p.line(ptsCopy[i].x, ptsCopy[i].y, 0, 0)
        }

        p.pop()
    },

    circles: function (
        pts: p5.Vector[],
        { radius = 7, num, translate = 0.5, colorFn = undefined }: CirclesOpts = {},
        moveOpts?: MoveOpts,
    ) {
        let ptsCopy = pts.map((pt) => pt)
        p.shuffle(ptsCopy, true)
        if (!num) num = p.ceil(p.random(ptsCopy.length))

        p.push()
        if (moveOpts) this.moveCenter(pts, moveOpts)

        for (let i = 0; i < Math.min(num, ptsCopy.length); i++) {
            let pt = ptsCopy[i]
            p.push()
            if (translate) {
                let trans = pt.copy().mult(translate)
                p.translate(trans.x, trans.y)
            }
            let r = typeof radius === 'function' ? radius() : radius
            if (colorFn) colorFn()

            p.circle(0, 0, r)
            p.pop()
        }

        p.pop()
    },
})
