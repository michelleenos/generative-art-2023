import { NoiseFunction2D } from 'simplex-noise'
import { WavyBumpsConfig } from './config'
import { Rng } from '~/helpers/prng'
import { Ribbon } from './_wavy-bumps-ribbon'

export type Sizes = { width: number; height: number }

export type BumpsCtx = {
    config: WavyBumpsConfig
    rng: Rng
    noise: NoiseFunction2D
}

export type BumpsScene = BumpsCtx & {
    layout: BumpsLayout
    palette: BumpsPalette
}

export type BumpsStroke = {
    color: string
    ribbon: Ribbon
    rowY: number
    rowIndex: number
    x: number
    y: number
}

export type BumpsPalette = {
    bgColor: chroma.Color
    rowColors: chroma.Color[]
}

export type BumpsLayout = {
    sizes: Sizes
    rowsBelow: number
    bounds: {
        xStart: number
        xEnd: number
        peakXStart: number
        peakXEnd: number
    }
    overlapY: number
    fieldStepX: number
    fieldStepY: number
    rowCount: number
}

export type WavyBumpsStrokes = {
    density: { x: number; y: number }
    noiseScale: { x: number; y: number }
    moveAmtBot: { x: number; y: number }
    moveAmtTop: { x: number; y: number }
    steps: number
    stepLen: number
    blendAngleAmt: number
    flattenAngle: number
    taper: number
    taperLen: number
    taperType: 'symmetric' | 'end'
}

export type WavyBumpsWave = {
    spacing: number
    highMin: number
    highMax: number
    lowMin: number
    lowMax: number
    peakMin: number
    peakMax: number
    peakWidth: number
    chaikinTimes: number
}

export type WavyBumpsColors = {
    hue: number
    addHue: number
    lessSaturated: boolean
}

export type WavyBumpsInputs = {
    colorShift: 1 | 2 | 3 | 'random'
    bumpsTendency: 'flat' | 'bumpy' | 'random'
    fieldType: 'scribbly' | 'tight' | 'pointillism' | 'random'
}
