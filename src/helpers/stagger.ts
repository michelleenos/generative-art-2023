import { clamp } from '~/helpers/utils'

export const getStagger = ({
    durationTotal,
    durationEach,
    steps,
}: {
    durationTotal: number
    durationEach: number
    steps: number
}) => {
    let stagger = durationTotal - durationEach
    let decEach = durationEach / durationTotal
    if (stagger < 0) stagger = 0

    let vals: { progressDelay: number; delay: number }[] = []

    for (let i = 0; i < steps; i++) {
        let t = i / (steps - 1)
        let delay = stagger * t
        let progressDelay = delay / durationTotal
        // let progressDelay = ease ? easing[ease](progressDelayLin) : progressDelayLin

        vals.push({ progressDelay, delay })
    }

    const getProgress = (progress: number, i: number) => {
        let { progressDelay } = vals[i]
        let p = (progress - progressDelay) / decEach
        return clamp(p, 0, 1)
    }

    return { vals, getProgress }
}
