import p5 from 'p5'

// function arrow(p: p5, len: number) {
//     p.line(0, 0, 0, len)
//     p.line(0, 0, -5, 5)
//     p.line(0, 0, 5, 5)
// }

function point(p: p5, x: number, y: number, text: string = '') {
    p.push()
    p.translate(x, y)
    p.stroke(0, 200, 200)
    p.strokeWeight(5)
    p.point(0, 0)
    p.noStroke()
    p.fill(0)
    p.textSize(10)
    p.textAlign(p.CENTER)
    p.text(text, 0, 12)
    p.pop()
}

export const petalBezierDebug = (p: p5, size: number) => {
    let offset = 0.2
    let cx = 0.8
    let cy = 1.33

    let a1 = [size * -offset, 0]
    let a2 = [size * offset, 0]
    let cp1 = [size * -cx, size * cy]
    let cp2 = [size * cx, size * cy]

    p.push()

    p.fill(255, 0, 100)
    p.noStroke()
    p.beginShape()
    p.vertex(a1[0], a1[1])
    p.bezierVertex(cp1[0], cp1[1], cp2[0], cp2[1], a2[0], a2[1])
    p.endShape()

    point(p, cp1[0], cp1[1], 'cp1')
    point(p, cp2[0], cp2[1], 'cp2')
    p.stroke(0, 200, 200)
    p.line(a1[0], a1[1], cp1[0], cp1[1])
    p.line(a2[0], a2[1], cp2[0], cp2[1])

    p.stroke(0)
    p.strokeWeight(1)
    p.line(0, 0, 0, size)

    p.pop()
}

export const petalBezier2Debug = (
    p: p5,
    size: number,
    offset = 0.25,
    cx1 = 0.3,
    cx2 = 0.3,
    cy1 = 0.3,
    cy2 = 0.8
) => {
    let a1 = [size * -offset, 0]
    let a2 = [size * offset, 0]
    let top = [0, size]
    let cpl1 = [size * -cx1, size * cy1]
    let cpl2 = [size * -cx2, size * cy2]

    let cpr1 = [size * cx1, size * cy1]
    let cpr2 = [size * cx2, size * cy2]

    p.push()

    p.fill(255, 0, 100)
    p.noStroke()
    p.beginShape()
    p.vertex(a1[0], a1[1])
    p.bezierVertex(cpl1[0], cpl1[1], cpl2[0], cpl2[1], top[0], top[1])
    p.bezierVertex(cpr2[0], cpr2[1], cpr1[0], cpr1[1], a2[0], a2[1])
    p.endShape()

    point(p, cpl1[0], cpl1[1], 'cpl1')
    point(p, cpl2[0], cpl2[1], 'cpl2')
    point(p, cpr1[0], cpr1[1], 'cpr1')
    point(p, cpr2[0], cpr2[1], 'cpr2')
    p.stroke(0, 200, 200)
    p.line(a1[0], a1[1], cpl1[0], cpl1[1])
    p.line(top[0], top[1], cpl2[0], cpl2[1])
    p.line(top[0], top[1], cpr2[0], cpr2[1])
    p.line(a2[0], a2[1], cpr1[0], cpr1[1])

    p.pop()
}
