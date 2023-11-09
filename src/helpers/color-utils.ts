export type ColorHSL = { h: number; s: number; l: number }
export type ColorRGB = { r: number; g: number; b: number }
export type ColorHSB = { h: number; s: number; b: number }

export function hslToHex(hsl: ColorHSL): string {
    const { h, s, l } = hsl

    const hDecimal = l / 100
    const a = (s * Math.min(hDecimal, 1 - hDecimal)) / 100
    const f = (n: number) => {
        const k = (n + h / 30) % 12
        const color = hDecimal - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)

        // Convert to Hex and prefix with "0" if required
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
}

export function hexToHsl(hex: string): ColorHSL {
    let { r, g, b } = hexToRgb(hex)

    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)

    let h = (max + min) / 2
    let s = h
    let l = h

    if (max === min) {
        // Achromatic
        return { h: 0, s: 0, l }
    }

    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
        case r:
            h = (g - b) / d + (g < b ? 6 : 0)
            break
        case g:
            h = (b - r) / d + 2
            break
        case b:
            h = (r - g) / d + 4
            break
    }
    h /= 6

    s = s * 100
    s = Math.round(s)
    l = l * 100
    l = Math.round(l)
    h = Math.round(360 * h)

    return { h, s, l }
}

export function rgbToHsb(rgb: ColorRGB): ColorHSB {
    let { r, g, b } = rgb
    r /= 255
    g /= 255
    b /= 255

    var max = Math.max(r, g, b),
        min = Math.min(r, g, b)

    let h = 0,
        s = 0,
        v = max

    var d = max - min
    s = max == 0 ? 0 : d / max

    if (max == min) {
        h = 0 // achromatic
    } else {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0)
                break
            case g:
                h = (b - r) / d + 2
                break
            case b:
                h = (r - g) / d + 4
                break
        }

        h /= 6
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        b: Math.round(v * 100),
    }
}

export function hsbToRgb(hsb: ColorHSB): ColorRGB {
    let { h, s, b: v } = hsb
    h /= 360
    s /= 100
    v /= 100

    let r: number
    let g: number
    let b: number

    if (s == 0) {
        // achromatic (grey)
        r = g = b = v
        return { r, g, b }
    }

    let i = Math.floor(h * 6)
    let f = h * 6 - i
    let p = v * (1 - s)
    let q = v * (1 - f * s)
    let t = v * (1 - s * (1 - f))

    switch (i) {
        case 0:
            ;(r = v), (g = t), (b = p)
            break
        case 1:
            ;(r = q), (g = v), (b = p)
            break
        case 2:
            ;(r = p), (g = v), (b = t)
            break
        case 3:
            ;(r = p), (g = q), (b = v)
            break
        case 4:
            ;(r = t), (g = p), (b = v)
            break
        default:
            ;(r = v), (g = p), (b = q)
            break
    }

    return { r: r * 255, g: g * 255, b: b * 255 }
}

export function hexToRgb(hex: string): ColorRGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

    if (!result) {
        throw new Error('Could not parse Hex Color')
    }

    const rHex = parseInt(result[1], 16)
    const gHex = parseInt(result[2], 16)
    const bHex = parseInt(result[3], 16)

    return {
        r: +rHex.toFixed(2),
        g: +gHex.toFixed(2),
        b: +bHex.toFixed(2),
    }
}

export function rgbToHex(rgb: ColorRGB): string {
    let { r, g, b } = rgb
    r = Math.round(r)
    g = Math.round(g)
    b = Math.round(b)

    const rHex = r.toString(16).padStart(2, '0')
    const gHex = g.toString(16).padStart(2, '0')
    const bHex = b.toString(16).padStart(2, '0')

    return `#${rHex}${gHex}${bHex}`
}

export function hexToHsb(hex: string): ColorHSB {
    return rgbToHsb(hexToRgb(hex))
}

export function hsbToHex(hsb: ColorHSB): string {
    return rgbToHex(hsbToRgb(hsb))
}

const colorUtils = {
    hslToHex,
    hexToHsl,
    rgbToHsb,
    hsbToRgb,
    hexToRgb,
    rgbToHex,
    hexToHsb,
    hsbToHex,
}

export default colorUtils
