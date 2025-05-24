import { Line } from './Lines'
export type Pt = [number, number]

export type TwoPtEnvProps = {
    // horizon: number
    // vxa: number
    // vxb: number
    vpa: Pt
    vpb: Pt
}

export type TwoPtShapeProps = {
    xa: number
    xb: number
    xc: number
    y1: number
    y2: number
}

export type TwoPtSide = {
    y1: number
    y2: number
    x: number

    vla1: Line
    vla2: Line
    vlb1: Line
    vlb2: Line
}
export type TwoPtSidesBox = {
    a: TwoPtSide
    b: TwoPtSide
    c: TwoPtSide
    d: TwoPtSide
}
