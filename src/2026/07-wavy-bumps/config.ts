export const C = {
    bumps: {
        highMin: 90,
        highMax: 150,
        lowMin: 30,
        lowMax: 50,
        peakMin: 2,
        peakMax: 5,
        peakWidth: 150,
        chaikinTimes: 4,
    },
    field: {
        density: { x: 7, y: 10 },
        noiseScale: { x: 0.156, y: 0.076 },
        moveAmtBot: { x: 28, y: 12 },
        moveAmtTop: { x: 0, y: 0 },
    },
    strokePath: {
        steps: 4,
        stepLen: 10,
        blendAngleAmt: 1,
        flattenAngle: 0,
    },
    strokeRibbon: {
        width: 10,
        taper: 0.4,
        taperLen: 25,
    },
    spacing: 100,
    alpha: 0.3,
    overlap: true,
}

export type WavyBumpsConfig = typeof C
