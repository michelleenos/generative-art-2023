export const C = {
    waves: {
        alpha: 0.3,
        overlap: true,
    },
    bumps: {
        spacing: 100,
        highMin: 90,
        highMax: 150,
        lowMin: 30,
        lowMax: 50,
        peakMin: 2,
        peakMax: 5,
        peakWidth: 150,
        chaikinTimes: 4,
        regenerate: true,
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
    animation: {
        animated: false,
        jitterRatio: 3,
        clumpAmt: 150,
        clumpScale: 0.15,
        strokesPerFrame: 10,
        rowStagger: 0.25,
        direction: 'up' as 'up' | 'down',
    },
    colors: {
        hue: 250,
        addHue: 180,
        lessSaturated: false,
        regenerate: true,
    },
}

export type WavyBumpsConfig = typeof C
