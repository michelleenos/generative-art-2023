import { lerp } from '~/helpers/utils'
import { type ColorRGB, type ColorHSL } from '~/helpers/color-utils'

export const lerpRgb = (color1: ColorRGB, color2: ColorRGB, amt: number) => {
    return {
        r: lerp(color1.r, color2.r, amt),
        g: lerp(color1.g, color2.g, amt),
        b: lerp(color1.b, color2.b, amt),
    } as ColorRGB
}

export const isNotWhite = ({ r, g, b }: ColorRGB) => r < 255 || g < 255 || b < 255

export const getClosestColorInPalette = (hsl: ColorHSL, palette: ColorHSL[]) => {
    let closest = 0
    let closestDist = Infinity
    palette.forEach((paletteColor, i) => {
        let distance = Math.abs(hsl.h - paletteColor.h)
        if (distance < closestDist) {
            closest = i
            closestDist = distance
        }
    })
    return palette[closest]
}

export type NextCb = (x: number, y: number) => [number, number]
const nextCbRight: NextCb = (x, y) => [x + 1, y]
const nextCbLeft: NextCb = (x, y) => [x - 1, y]
const nextCbDown: NextCb = (x, y) => [x, y + 1]
const nextCbUp: NextCb = (x, y) => [x, y - 1]

export const nextCbMap = {
    right: nextCbRight,
    left: nextCbLeft,
    down: nextCbDown,
    up: nextCbUp,
}
