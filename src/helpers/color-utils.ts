export type ColorHSL = { h: number; s: number; l: number }
export type ColorRGB = { r: number; g: number; b: number }
export type ColorHSB = { h: number; s: number; b: number }

function hslToHex(hsl: ColorHSL): string {
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

function hslToRgb(hsl: ColorHSL): ColorRGB {
    let { h, s, l } = hsl
    s /= 100
    l /= 100

    const k = (n: number) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) }
}

function hexToHsl(hex: string): ColorHSL {
    return rgbToHsl(hexToRgb(hex))
}

function rgbToHsl(rgb: ColorRGB): ColorHSL {
    let { r, g, b } = rgb
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
        return { h: 0, s: 0, l: Math.round(l * 100) }
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

function rgbToHsb(rgb: ColorRGB): ColorHSB {
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

function hsbToRgb(hsb: ColorHSB): ColorRGB {
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
        return { r: r * 255, g: g * 255, b: b * 255 }
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

function hexToRgb(hex: string): ColorRGB {
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

function rgbToHex(rgb: ColorRGB): string {
    let { r, g, b } = rgb
    r = Math.round(r)
    g = Math.round(g)
    b = Math.round(b)

    const rHex = r.toString(16).padStart(2, '0')
    const gHex = g.toString(16).padStart(2, '0')
    const bHex = b.toString(16).padStart(2, '0')

    return `#${rHex}${gHex}${bHex}`
}

function hexToHsb(hex: string): ColorHSB {
    return rgbToHsb(hexToRgb(hex))
}

function hsbToHex(hsb: ColorHSB): string {
    return rgbToHex(hsbToRgb(hsb))
}

function blendScreen(a: ColorRGB, b: ColorRGB): ColorRGB {
    return {
        r: 255 - ((255 - a.r) * (255 - b.r)) / 255,
        g: 255 - ((255 - a.g) * (255 - b.g)) / 255,
        b: 255 - ((255 - a.b) * (255 - b.b)) / 255,
    }
}

function overlay(a: number, b: number) {
    let a1 = a / 255
    let b1 = b / 255
    if (a1 < 0.5) {
        return 2 * a1 * b1 * 255
    } else {
        return (1 - 2 * (1 - a1) * (1 - b1)) * 255
    }
}

function difference(a: number, b: number) {
    return Math.abs(a / 255 - b / 255) * 255
}

function exclusion(a: number, b: number) {
    let a1 = a / 255
    let b1 = b / 255
    return (b1 + a1 - 2 * b1 * a1) * 255
}

function blendOverlay(a: ColorRGB, b: ColorRGB) {
    return {
        r: overlay(a.r, b.r),
        g: overlay(a.g, b.g),
        b: overlay(a.b, b.b),
    }
}

function blendDifference(a: ColorRGB, b: ColorRGB) {
    return {
        r: difference(a.r, b.r),
        g: difference(a.g, b.g),
        b: difference(a.b, b.b),
    }
}

function blendExclusion(a: ColorRGB, b: ColorRGB) {
    return {
        r: exclusion(a.r, b.r),
        g: exclusion(a.g, b.g),
        b: exclusion(a.b, b.b),
    }
}

const colorUtils = {
    hslToHex,
    hslToRgb,
    hexToHsl,
    rgbToHsb,
    rgbToHsl,
    hsbToRgb,
    hexToRgb,
    rgbToHex,
    hexToHsb,
    hsbToHex,
}

export {
    colorUtils as default,
    hslToHex,
    hslToRgb,
    hexToHsl,
    rgbToHsb,
    rgbToHsl,
    hsbToRgb,
    hexToRgb,
    rgbToHex,
    hexToHsb,
    hsbToHex,
    blendScreen,
    blendOverlay,
    blendDifference,
    blendExclusion,
}
