type Rng = {
    (max: number): number
    (min: number, max: number): number
    <T>(array: readonly T[]): T
}

export function shuffle<T>(array: T[], rng: Rng): T[] {
    let currentIndex = array.length
    let randomIndex: number
    const out = [...array]

    while (0 !== currentIndex) {
        randomIndex = Math.floor(rng(currentIndex))
        currentIndex -= 1
        ;[out[currentIndex], out[randomIndex]] = [out[randomIndex], out[currentIndex]]
    }

    return out
}

export function pickColors(count: number, colors: string[], rng: Rng): string[] {
    let lastColor: string | null = null
    const pickedColors: string[] = []

    let indices = new Array(count).fill(0).map((_, i) => i)
    indices = shuffle(indices, rng)

    for (let i = 0; i < Math.min(indices.length, colors.length); i++) {
        let index = indices[i]
        let color = colors[i]
        pickedColors[index] = color
    }

    for (let i = 0; i < count; i++) {
        if (pickedColors[i] !== undefined) {
            lastColor = pickedColors[i]
            continue
        }
        let color = rng(colors)
        if (colors.length >= 3) {
            let nextColor = i < count ? pickedColors[i + 1] : undefined
            while (color === lastColor || color === nextColor) {
                color = rng(colors)
            }
        }
        pickedColors[i] = color
        lastColor = color
    }
    return pickedColors
}
