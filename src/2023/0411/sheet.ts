import p5 from 'p5'

export interface SheetOpts {
    x: number
    y: number
    w: number
    h: number
    nx: number
    ny: number
    border?: number
    offset?: boolean
}

interface SheetOpts2d extends SheetOpts {
    sizeX: number
    sizeY: number
}
interface SheetOptsSize extends SheetOpts {
    size: number
}

interface RectsSheetOpts extends SheetOpts2d {}
interface RoundedSheetOpts extends SheetOpts2d {}
interface ArcsSheetOpts extends SheetOptsSize {
    ratio: number
}
interface CircleSheetOpts extends SheetOpts {
    diameter: number
}
interface PlusSheetOpts extends SheetOptsSize {
    thickness: number
}
interface ZigZagSheetOpts extends SheetOptsSize {}

function getSheetVals(opts: SheetOpts) {
    const { w, h, nx, ny, border = 0.03 } = opts
    const hypot = Math.sqrt(w * w + h * h)
    const edge = Math.min(w, h) * border
    const gridx = (w - edge * 2) / nx
    const gridy = (h - edge * 2) / ny
    return { hypot, edge, gridx, gridy }
}

function drawOuter(w: number, h: number, p: p5, defineShape = false) {
    if (defineShape) p.beginShape()
    p.vertex(0, 0)
    p.vertex(w, 0)
    p.vertex(w, h)
    p.vertex(0, h)
    if (defineShape) p.endShape()
}

function cleanEdges({ w, h }: { w: number; h: number }, p: p5) {
    p.push()
    let ctx = p.drawingContext
    ctx.globalCompositeOperation = 'destination-in'
    p.beginShape()
    drawOuter(w, h, p)
    p.endShape()
    ctx.globalCompositeOperation = 'source-over'
    p.pop()
}

function drawEdge({ w, h, edge }: { w: number; h: number; edge: number }, p: p5) {
    p.beginShape()
    drawOuter(w, h, p)
    p.beginContour()
    p.vertex(w - edge, edge)
    p.vertex(edge, edge)
    p.vertex(edge, h - edge)
    p.vertex(w - edge, h - edge)
    p.endContour()
    p.endShape()
}

function rects(opts: RectsSheetOpts, p: p5) {
    let { nx, ny, sizeX = 0.9, sizeY = 0.9, offset = false } = opts
    const { gridx, gridy, edge } = getSheetVals(opts)
    p.beginShape()
    drawOuter(opts.w, opts.h, p)

    let w = gridx * sizeX
    let h = gridy * sizeY
    for (let xi = 0; xi <= nx; xi++) {
        for (let yi = 0; yi < ny; yi++) {
            let dx = (offset && yi % 2 === 0 ? xi * gridx : (xi + 0.5) * gridx) + edge
            let dy = edge + (yi + 0.5) * gridy

            p.beginContour()
            p.vertex(dx - w / 2, dy - h / 2)
            p.vertex(dx - w / 2, dy + h / 2)
            p.vertex(dx + w / 2, dy + h / 2)
            p.vertex(dx + w / 2, dy - h / 2)
            p.endContour()
        }
    }

    p.endShape()

    drawEdge({ w: opts.w, h: opts.h, edge }, p)
}

function arcs(opts: ArcsSheetOpts, p: p5) {
    const { gridx, gridy, edge } = getSheetVals(opts)
    const { nx, ny, offset = true, size = 0.9, ratio = 1 } = opts
    let w = gridx * size
    let h = w * ratio

    drawOuter(opts.w, opts.h, p, true)
    p.push()
    p.erase()

    for (let xi = -1; xi <= nx; xi++) {
        for (let yi = 0; yi < ny; yi++) {
            let dx = gridx * (offset && yi % 2 === 0 ? xi + 0.5 : xi) + edge

            dx += (gridx - w) / 2
            let dy = yi * gridy + edge
            dy += (gridy - h) / 2

            p.beginShape()
            p.arc(dx + w * 0.5, dy + h * 0.75, w, h, -Math.PI, 0)
            // p.vertex(dx + w, dy + h)
            // p.bezierVertex(dx + w, dy + h * 0.5, dx + w * 0.75, dy, dx + w / 2, dy)
            // p.bezierVertex(dx + w * 0.25, dy, dx, dy + h * 0.5, dx, dy + h)
            p.endShape()
        }
    }

    p.pop()
    drawEdge({ w: opts.w, h: opts.h, edge }, p)
}

// function drawArcs2(opts: SheetOpts, p: p5) {
//     const { edge, gridx, gridy } = getSheetVals(opts)
//     let { nx, ny, size1 = 0.9 } = opts

//     let w = gridx * size1
//     let h = gridy * size1
//     // let diag = Math.sqrt(w * w + h * h)
//     let diax = gridx * size1
//     let diay = gridy * size1

//     drawOuter(opts.w, opts.h, p, true)

//     p.push()
//     p.erase()
//     for (let xi = -1; xi <= nx; xi++) {
//         for (let yi = -1; yi <= ny; yi++) {
//             let dx = xi * gridx + edge
//             let dy = yi * gridy + edge

//             p.arc(dx + gridx / 2, dy + gridy / 2, diax, diay, Math.PI * -0.25, Math.PI * 0.75)
//         }
//     }

//     p.pop()

//     drawEdge({ edge, w: opts.w, h: opts.h }, p)
// }

// function drawArcsTilted(opts: SheetOpts, p: p5) {
//     const { offset = true, size1 = 0.9, size2 = 0.7, w, h } = opts
//     const { hypot, edge } = getSheetVals(opts)
//     p.push()
//     p.rotate(-Math.PI / 4)
//     p.translate(-hypot / 2, 0)
//     // let diagSheet = createSheet(p, {
//     //     x: 0,
//     //     y: 0,
//     //     w: sheet.diagonal,
//     //     h: sheet.diagonal,
//     //     ny: sheet.ny,
//     //     nx: sheet.nx,
//     //     border: 0.03,
//     // })

//     const newOpts: SheetOpts = {
//         x: 0,
//         y: 0,
//         w: hypot,
//         h: hypot,
//         nx: opts.nx,
//         ny: opts.ny,
//         offset,
//         size1,
//         size2,
//     }

//     drawArcs(newOpts, p)
//     p.pop()

//     drawEdge({ w: opts.w, h: opts.h, edge }, p)
//     // cleanEdges(sheet, p)
// }

function circles(opts: CircleSheetOpts, p: p5) {
    const { gridx, gridy, edge } = getSheetVals(opts)

    const { nx, ny, diameter = 0.9, offset = false, w, h } = opts
    let dia = Math.min(gridx, gridy) * diameter

    drawOuter(w, h, p, true)

    p.push()
    p.erase()
    for (let xi = 0; xi <= nx; xi++) {
        for (let yi = 0; yi < ny; yi++) {
            let dx = (offset && yi % 2 === 0 ? xi * gridx : (xi + 0.5) * gridx) + edge
            let dy = edge + (yi + 0.5) * gridy
            p.ellipse(dx, dy, dia, dia)
        }
    }

    p.pop()

    drawEdge({ edge, w, h }, p)
}

function pluses(opts: PlusSheetOpts, p: p5) {
    const { gridx, gridy, edge } = getSheetVals(opts)
    const { nx, ny, w, h, size = 0.9, thickness = 0.35, offset = false } = opts
    // size2 = thickness

    let off = (1 - size) / 2
    let x1 = gridx * off
    let x2 = gridx * (1 - off)
    let y1 = gridy * off
    let y2 = gridy * (1 - off)

    drawOuter(w, h, p, true)

    p.push()
    p.erase()
    p.strokeWeight(gridx * thickness * 0.5)
    p.stroke(0)
    p.strokeCap(p.SQUARE)
    for (let xi = 0; xi <= nx; xi++) {
        for (let yi = 0; yi < ny; yi++) {
            let dx = (offset && yi % 2 === 0 ? (xi - 0.5) * gridx : xi * gridx) + edge
            let dy = edge + gridy * yi

            p.line(dx + x1, dy + gridy / 2, dx + x2, dy + gridy / 2)
            p.line(dx + gridx / 2, dy + y1, dx + gridx / 2, dy + y2)
        }
    }

    p.pop()
    drawEdge({ w, h, edge }, p)
}

function rounded(opts: RoundedSheetOpts, p: p5) {
    const { nx, ny, sizeX = 0.9, sizeY = 0.7, offset = false } = opts
    // const { gridx, gridy, nx, ny, edge } = sheet
    const { gridx, gridy, edge } = getSheetVals(opts)
    let w = gridx * sizeX
    let h = gridy * sizeY
    let offx = (gridx - w) / 2
    let offy = (gridy - h) / 2
    let br = p.min(w, h) * 0.5

    drawOuter(opts.w, opts.h, p, true)

    p.push()
    p.erase()
    for (let xi = 0; xi <= nx; xi++) {
        for (let yi = 0; yi < ny; yi++) {
            let dx = (offset && yi % 2 === 0 ? (xi - 0.5) * gridx : xi * gridx) + edge + offx
            let dy = yi * gridy + edge + offy
            p.rect(dx, dy, w, h, br)
        }
    }
    p.pop()

    drawEdge({ w: opts.w, h: opts.h, edge }, p)
}

function zigzag(opts: ZigZagSheetOpts, p: p5) {
    const { gridx, gridy, edge } = getSheetVals(opts)
    const { nx, ny, size = 0.9 } = opts
    let thickness = Math.min(gridx, gridy) * size * 0.5

    // let ratio = ny / nx
    // let yoff = thickness * 0.6
    // if (ratio < 1) yoff = thickness * 0.8
    // if (ratio < 0.6) yoff = thickness * 1

    p.beginShape()
    drawOuter(opts.w, opts.h, p)
    p.endShape()

    p.push()
    p.erase()
    p.noFill()
    p.stroke(0)
    p.strokeWeight(thickness)
    p.strokeJoin(p.MITER)
    p.strokeCap(p.PROJECT)
    for (let yi = -1; yi <= ny; yi++) {
        p.beginShape()
        for (let xi = -1; xi <= nx + 1; xi++) {
            let dx = xi * gridx + edge
            let dy = (yi - 0.5) * gridy + edge

            if (xi % 2 === 0) {
                p.vertex(dx, dy)
            } else {
                p.vertex(dx, dy + gridy)
            }
        }
        p.endShape()
    }
    p.pop()

    drawEdge({ w: opts.w, h: opts.h, edge }, p)
}

export const sheetTypes = ['arcs', 'circles', 'pluses', 'rounded', 'rects', 'zigzag'] as const
export type SheetType = (typeof sheetTypes)[number]
export const drawings: Record<SheetType, (opts: any, p: p5) => void> = {
    arcs,
    circles,
    pluses,
    rounded,
    rects,
    zigzag,
}
