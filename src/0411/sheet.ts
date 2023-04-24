import p5 from 'p5'

type sheetOpts = {
    x: number
    y: number
    w: number
    h: number
    nx?: number
    ny?: number
    style?: 'arcs' | 'squares' | 'grid' | 'arcs-tilt'
    border?: number
}

type Sheet = {
    x: number
    y: number
    w: number
    h: number
    nx: number
    ny: number
    gridx: number
    gridy: number
    diagonal: number
    edge: number
    innerw: number
    innerh: number
}

const createSheet = (
    p: p5,
    { x, y, w, h, nx = 5, ny = 5, border = 0.03 }: sheetOpts
): Sheet => {
    let diagonal = Math.sqrt(w * w + h * h)
    let edge = p.min(w, h) * border
    let innerw = w - edge * 2
    let innerh = h - edge * 2
    let gridx = innerw / nx
    let gridy = innerh / ny

    return { x, y, w, h, nx, ny, gridx, gridy, diagonal, edge, innerw, innerh }
}

function drawOuter(w: number, h: number, p: p5, defineShape = false) {
    if (defineShape) p.beginShape()
    p.vertex(0, 0)
    p.vertex(w, 0)
    p.vertex(w, h)
    p.vertex(0, h)
    if (defineShape) p.endShape()
}

function cleanEdges(sheet, p: p5) {
    p.push()
    let ctx = p.drawingContext
    ctx.globalCompositeOperation = 'destination-in'
    p.beginShape()
    drawOuter(sheet.w, sheet.h, p)
    p.endShape()
    ctx.globalCompositeOperation = 'source-over'
    p.pop()
}

function drawEdge(sheet, p: p5) {
    p.beginShape()
    drawOuter(sheet.w, sheet.h, p)
    p.beginContour()
    p.vertex(sheet.w - sheet.edge, sheet.edge)
    p.vertex(sheet.edge, sheet.edge)
    p.vertex(sheet.edge, sheet.h - sheet.edge)
    p.vertex(sheet.w - sheet.edge, sheet.h - sheet.edge)
    p.endContour()
    p.endShape()
}

function drawRects(
    sheet,
    p: p5,
    { size = 0.9, size2 = 0.9, offset = false } = {}
) {
    let { gridx, gridy, nx, ny, edge } = sheet
    p.beginShape()
    drawOuter(sheet.w, sheet.h, p)

    let w = gridx * size
    let h = gridy * size2
    for (let xi = 0; xi <= nx; xi++) {
        for (let yi = 0; yi < ny; yi++) {
            // let dx = edge + (xi + 0.5) * gridx
            let dx =
                (offset && yi % 2 === 0 ? xi * gridx : (xi + 0.5) * gridx) +
                edge
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

    drawEdge(sheet, p)
}

function drawArcs2(sheet: Sheet, p: p5, { size = 0.9, size2 = 0.9 } = {}) {
    let { nx, ny, edge, gridx, gridy } = sheet

    let w = gridx * size
    let h = gridy * size2
    let diag = Math.sqrt(w * w + h * h)

    drawOuter(sheet.w, sheet.h, p, true)

    p.push()
    p.erase()
    for (let xi = -1; xi <= nx; xi++) {
        for (let yi = -1; yi <= ny; yi++) {
            let dx = xi * gridx + edge
            let dy = yi * gridy + edge

            p.arc(
                dx + gridx / 2,
                dy + gridy / 2,
                diag,
                diag,
                Math.PI * -0.25,
                Math.PI * 0.75
            )
        }
    }

    p.pop()

    drawEdge(sheet, p)
}

function drawArcs(
    sheet,
    p: p5,
    { offset = true, size = 0.9, size2 = 0.7 } = {}
) {
    const { gridx, gridy, nx, ny, edge } = sheet
    let w = gridx * size
    let h = gridy * size2

    p.beginShape()
    drawOuter(sheet.w, sheet.h, p)

    for (let xi = -1; xi <= nx; xi++) {
        for (let yi = 0; yi < ny; yi++) {
            let dx =
                (offset && yi % 2 === 0 ? (xi + 0.5) * gridx : xi * gridx) +
                edge

            dx += (gridx - w) / 2
            let dy = yi * gridy + edge
            dy += (gridy - h) / 2

            p.beginContour()
            p.vertex(dx + w, dy + h)
            p.bezierVertex(
                dx + w,
                dy + h * 0.5,
                dx + w * 0.75,
                dy,
                dx + w / 2,
                dy
            )
            p.bezierVertex(dx + w * 0.25, dy, dx, dy + h * 0.5, dx, dy + h)
            p.endContour()
        }
    }

    p.endShape()

    drawEdge(sheet, p)
    cleanEdges(sheet, p)
}

function drawArcsTilted(
    sheet,
    p: p5,
    { offset = true, size = 0.9, size2 = 0.7 } = {}
) {
    p.push()
    p.rotate(-Math.PI / 4)
    p.translate(-sheet.diagonal / 2, 0)
    let diagSheet = createSheet(p, {
        x: 0,
        y: 0,
        w: sheet.diagonal,
        h: sheet.diagonal,
        ny: sheet.ny,
        nx: sheet.nx,
    })

    drawArcs(diagSheet, p, { offset, size, size2 })
    p.pop()

    drawEdge(sheet, p)
    cleanEdges(sheet, p)
}

function drawCircles(sheet, p: p5, { size = 0.9, offset = false } = {}) {
    const { gridx, gridy, nx, ny, edge } = sheet
    let circumference = p.min(gridx, gridy) * size

    drawOuter(sheet.w, sheet.h, p, true)

    p.push()
    p.erase()
    for (let xi = 0; xi <= nx; xi++) {
        for (let yi = 0; yi < ny; yi++) {
            // let dx = edge + (xi + 0.5) * gridx
            let dx =
                (offset && yi % 2 === 0 ? xi * gridx : (xi + 0.5) * gridx) +
                edge
            let dy = edge + (yi + 0.5) * gridy
            p.ellipse(dx, dy, circumference, circumference)
        }
    }

    p.pop()

    drawEdge(sheet, p)
}

function drawPluses(
    sheet,
    p: p5,
    { size = 0.9, size2 = 0.35, offset = false } = {}
) {
    // size2 = thickness
    const { gridx, gridy, nx, ny, edge } = sheet

    let off = (1 - size) / 2
    let x1 = gridx * off
    let x2 = gridx * (1 - off)
    let y1 = gridy * off
    let y2 = gridy * (1 - off)

    drawOuter(sheet.w, sheet.h, p, true)

    p.push()
    p.erase()
    p.strokeWeight(gridx * size2 * 0.5)
    p.stroke(0)
    p.strokeCap(p.SQUARE)
    for (let xi = 0; xi <= nx; xi++) {
        for (let yi = 0; yi < ny; yi++) {
            let dx =
                (offset && yi % 2 === 0 ? (xi - 0.5) * gridx : xi * gridx) +
                edge
            let dy = edge + gridy * yi

            p.line(dx + x1, dy + gridy / 2, dx + x2, dy + gridy / 2)
            p.line(dx + gridx / 2, dy + y1, dx + gridx / 2, dy + y2)
        }
    }

    p.pop()
    drawEdge(sheet, p)
}

function drawRounded(
    sheet,
    p: p5,
    { size = 0.9, size2 = 0.7, offset = false } = {}
) {
    const { gridx, gridy, nx, ny, edge } = sheet
    let w = gridx * size
    let h = gridy * size2
    let offx = (gridx - w) / 2
    let offy = (gridy - h) / 2
    let br = p.min(w, h) * 0.5

    drawOuter(sheet.w, sheet.h, p, true)

    p.push()
    p.erase()
    for (let xi = 0; xi <= nx; xi++) {
        for (let yi = 0; yi < ny; yi++) {
            let dx =
                (offset && yi % 2 === 0 ? (xi - 0.5) * gridx : xi * gridx) +
                edge +
                offx
            let dy = yi * gridy + edge + offy
            p.rect(dx, dy, w, h, br)
        }
    }
    p.pop()

    drawEdge(sheet, p)
}

function drawZigZag(sheet, p: p5, { size = 0.9 } = {}) {
    const { gridx, gridy, nx, ny, edge } = sheet
    let thickness = gridx * size * 0.5

    // let ratio = ny / nx
    // let yoff = thickness * 0.6
    // if (ratio < 1) yoff = thickness * 0.8
    // if (ratio < 0.6) yoff = thickness * 1

    p.beginShape()
    drawOuter(sheet.w, sheet.h, p)
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
        for (let xi = 0; xi <= nx; xi++) {
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

    drawEdge(sheet, p)
}

export {
    drawArcs,
    drawArcsTilted,
    drawCircles,
    drawPluses,
    drawRounded,
    drawRects,
    drawZigZag,
    createSheet,
    drawArcs2,
}
