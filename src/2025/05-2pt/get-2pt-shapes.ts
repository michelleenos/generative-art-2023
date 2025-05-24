import type { TwoPtShapeProps, TwoPtEnvProps, TwoPtSide, Pt } from './types'
import { Line } from './Lines'

export function getNextSide({
    fromSide,
    vpa,
    vpb,
    useVp,
    x,
}: {
    fromSide: TwoPtSide
    x: number
    vpa: Pt
    vpb: Pt
    useVp: 'a' | 'b'
}): TwoPtSide {
    if (useVp === 'a') {
        let y1 = fromSide.vla1.y(x)
        let y2 = fromSide.vla2.y(x)

        let vla1 = fromSide.vla1
        let vla2 = fromSide.vla2
        let vlb1 = new Line(vpb, [x, y1])
        let vlb2 = new Line(vpb, [x, y2])

        return { y1, y2, x, vla1, vla2, vlb1, vlb2 }
    } else {
        let y1 = fromSide.vlb1.y(x)
        let y2 = fromSide.vlb2.y(x)

        let vla1 = new Line(vpa, [x, y1])
        let vla2 = new Line(vpa, [x, y2])
        let vlb1 = fromSide.vlb1
        let vlb2 = fromSide.vlb2

        return { y1, y2, x, vla1, vla2, vlb1, vlb2 }
    }
}

export function getJoinSide({ side1, side2 }: { side1: TwoPtSide; side2: TwoPtSide }): TwoPtSide {
    let c = side1
    let b = side2
    let int1 = c.vla1.getIntersection(b.vlb1)
    let int2 = c.vla2.getIntersection(b.vlb2)

    if (Math.abs(int1[0] - int2[0]) > 1) {
        console.log('something is up!', int1[0], int2[0])
    }

    let x = int1 ? int1[0] : int2 ? int2[0] : c.x
    let y1 = int1 ? int1[1] : c.y1
    let y2 = int2 ? int2[1] : c.y2

    return {
        x,
        y1,
        y2,
        vla1: c.vla1,
        vla2: c.vla2,
        vlb1: b.vlb1,
        vlb2: b.vlb2,
    }
}

export function twoPointPerspective(shape: TwoPtShapeProps, env: TwoPtEnvProps) {
    const { vpa, vpb } = env
    const { xa, xb, xc, y1, y2 } = shape

    let sidea: TwoPtSide = {
        x: xa,
        y1,
        y2,
        vla1: new Line(vpa, [xa, y1]),
        vla2: new Line(vpa, [xa, y2]),
        vlb1: new Line(vpb, [xa, y1]),
        vlb2: new Line(vpb, [xa, y2]),
    }

    let sideb = getNextSide({
        fromSide: sidea,
        vpa: vpa,
        vpb: vpb,
        useVp: 'a',
        x: xb,
    })

    let sidec = getNextSide({
        fromSide: sidea,
        vpa: vpa,
        vpb: vpb,
        useVp: 'b',
        x: xc,
    })

    let sided = getJoinSide({
        side1: sidec,
        side2: sideb,
    })

    return { a: sidea, b: sideb, c: sidec, d: sided }
}
