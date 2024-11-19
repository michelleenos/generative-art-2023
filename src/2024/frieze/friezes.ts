type FriezeNames = {
    conway: string
    orbifold: string
    crystal: string
    contains: string
}
type Frieze = 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7'

export const friezeNames: Record<Frieze, FriezeNames> = {
    f1: {
        conway: 'hop',
        orbifold: '∞∞',
        crystal: 'p1',
        contains: 'T',
    },
    f2: {
        conway: 'step',
        orbifold: '∞×',
        crystal: 'p11g',
        contains: 'TG',
    },
    f3: {
        conway: 'sidle',
        orbifold: '*∞∞',
        crystal: 'p1m1',
        contains: 'TV',
    },
    f4: {
        conway: 'spinning hop',
        orbifold: '22∞',
        crystal: 'p2',
        contains: 'TR',
    },
    f5: {
        conway: 'spinning sidle',
        orbifold: '2*∞',
        crystal: 'p2mg',
        contains: 'TRVG',
    },
    f6: {
        conway: 'jump',
        orbifold: '∞*',
        crystal: 'p11m',
        contains: 'THG',
    },
    f7: {
        conway: 'spinning jump',
        orbifold: '*22∞',
        crystal: 'p2mm',
        contains: 'TRHVG',
    },
}

type F1Options = {
    translate: number
    width: number
}
export const f1 = (
    ctx: CanvasRenderingContext2D,
    { translate, width }: F1Options,
    cb: () => void
) => {
    let steps = Math.ceil(width / translate)

    for (let i = Math.floor(-steps * 0.3); i < steps; i++) {
        ctx.save()
        ctx.translate(i * translate, 0)
        cb()
        ctx.restore()
    }
}

type F2options = {
    /*
     * Translate X as a ratio of the width of the tile
     */
    tx?: number
    glideAmount?: number
    fullWidth: number
    tileWidth: number
    tileHeight: number
}
export const f2 = (
    ctx: CanvasRenderingContext2D,
    { tx = 1, glideAmount = 0.5, tileWidth, fullWidth, tileHeight }: F2options,
    cb: () => void
) => {
    let steps = Math.ceil(fullWidth / (tileWidth * tx))

    for (let i = Math.floor(-steps * 0.3); i < steps; i++) {
        ctx.save()
        ctx.translate(i * tileWidth * tx, 0)
        cb()
        ctx.translate(tileWidth * glideAmount, 0)
        ctx.translate(0, tileHeight)
        ctx.scale(1, -1)
        ctx.translate(0, -tileHeight)
        cb()
        ctx.restore()
    }
}
