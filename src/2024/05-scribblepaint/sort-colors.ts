import chroma from 'chroma-js'

type ColorSortOption =
    | 'hue'
    | 'luminance'
    | 'saturation'
    | 'temperature'
    | 'lightness'
    | 'lightness-saturation'
export const sortPalette = (
    colors: string[],
    sort: ColorSortOption,
    dir: 'asc' | '+' | 'desc' | '-' = 'asc'
) => {
    let palette = [...colors]

    if (sort === 'temperature') {
        palette.sort((a, b) => chroma(a).temperature() - chroma(b).temperature())
    } else if (sort === 'lightness-saturation') {
        palette.sort((a, b) => {
            let aHSL = chroma(a).hsl()
            let bHSL = chroma(b).hsl()
            return aHSL[2] - bHSL[2] || aHSL[1] - bHSL[1]
        })
    } else if (sort === 'luminance') {
        palette.sort((a, b) => chroma(a).luminance() - chroma(b).luminance())
    } else {
        let key = sort === 'hue' ? 'hsl.h' : sort === 'saturation' ? 'hsl.s' : 'hsl.l'
        palette.sort((a, b) => chroma(a).get(key) - chroma(b).get(key))
    }

    if (dir === 'desc' || dir === '-') {
        palette.reverse()
    }

    return palette
}
