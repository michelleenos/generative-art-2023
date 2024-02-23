import { type ColorRGB, type ColorHSL, rgbToHsl, hslToRgb } from '~/helpers/color-utils'
import { PixelWalker, Pixels, type PixelsOpts, type PixelWalkerOpts } from './pixel-walk'
import { nextCbMap, lerpRgb, isNotWhite, getClosestColorInPalette } from './utils'

export class PixelBlur extends PixelWalker {
    blurDirections: [number, number][]

    constructor(opts: PixelWalkerOpts & { blurDirections?: [number, number][] }) {
        super(opts)
        this.blurDirections = opts.blurDirections || [[2, -2]]
        this.blurDirections = this.blurDirections.map(([x, y]) => [
            x * this.pixelDensity,
            y * this.pixelDensity,
        ])
    }

    updateColor = (imageData: ImageData, x: number, y: number) => {
        let i = (x + y * imageData.width) * 4
        let colors: ColorRGB[] = [
            { r: imageData.data[i], g: imageData.data[i + 1], b: imageData.data[i + 2] },
        ]

        this.blurDirections.forEach(([dx, dy]) => {
            const [x1, y1] = [x + dx, y + dy]
            if (!this.isOutOfBounds(x1, y1)) {
                const i1 = (x1 + y1 * imageData.width) * 4
                colors.push({
                    r: imageData.data[i1],
                    g: imageData.data[i1 + 1],
                    b: imageData.data[i1 + 2],
                })
            }
        })

        let average = {
            r: colors.reduce((added, { r }) => added + r, 0) / colors.length,
            g: colors.reduce((added, { g }) => added + g, 0) / colors.length,
            b: colors.reduce((added, { b }) => added + b, 0) / colors.length,
        }

        return lerpRgb(this.currentColor, average, 0.5)
    }
}

export class Blur extends Pixels<'blur'> {
    blurDirections: [number, number][]

    constructor(opts: PixelsOpts & { blurDirections?: [number, number][] }) {
        super({ ...opts, type: 'blur' })
        this.blurDirections = opts.blurDirections || [
            [1, 0],
            [10, 10],
            [-10, 0],
            [0, -10],
        ]
    }

    createPixel = (x: number, y: number) => {
        return new PixelBlur({
            x,
            y,
            pixelDensity: this.pixelDensity,
            width: this.width * this.pixelDensity,
            height: this.height * this.pixelDensity,
            nextCb: nextCbMap[this.direction],
            blurDirections: this.blurDirections,
        })
    }
}

export class PixelSmudge extends PixelWalker {
    palette: ColorRGB[]
    paletteHSL: ColorHSL[]

    constructor(opts: PixelWalkerOpts & { palette: ColorRGB[] }) {
        super(opts)
        this.palette = opts.palette
        this.paletteHSL = this.palette.map(rgbToHsl)
    }

    updateColor = (imageData: ImageData, x: number, y: number) => {
        let i = (x + y * imageData.width) * 4
        let pix = {
            r: imageData.data[i],
            g: imageData.data[i + 1],
            b: imageData.data[i + 2],
        }

        return isNotWhite(pix)
            ? hslToRgb(getClosestColorInPalette(rgbToHsl(pix), this.paletteHSL))
            : lerpRgb(this.currentColor, { r: 255, g: 255, b: 255 }, 0.01 / this.pixelDensity)
    }
}

export class Smudge extends Pixels<'smudge'> {
    palette: ColorRGB[]

    constructor(opts: PixelsOpts & { palette: ColorRGB[] }) {
        super({ ...opts, type: 'smudge' })
        this.palette = opts.palette
    }

    createPixel = (x: number, y: number) => {
        let pix = new PixelSmudge({
            x,
            y,
            palette: this.palette,
            pixelDensity: this.pixelDensity,
            width: this.width * this.pixelDensity,
            height: this.height * this.pixelDensity,
            nextCb: nextCbMap[this.direction],
        })
        pix.currentColor = this.palette[0]
        return pix
    }
}
