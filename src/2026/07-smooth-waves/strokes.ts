import { makeRng } from '~/helpers/prng'
import { map, randomInt } from '~/helpers/utils'

export interface Stroke {
    start: number
    end: number
    amp: number
}

export interface GenerateStrokesParams {
    steps: number
    count: number
    amp: number
    rng: ReturnType<typeof makeRng>
}

export function generateStrokes({ steps, count, amp, rng }: GenerateStrokesParams): Stroke[] {
    const strokes: Stroke[] = []

    for (let j = 0; j < count; j++) {
        let start: number
        let end: number
        const strokeAmp = count === 1 ? amp : map(j, 0, count - 1, amp, amp * 0.25)

        // const span = Math.floor(rng(steps / 2, steps + 1))
        const span = randomInt(Math.floor(steps / 2), steps, rng)
        start = randomInt(0, steps - span, rng)
        end = start + span + 1
        strokes.push({ start, end, amp: strokeAmp })
    }

    return strokes
}
