import { clamp, map } from '~/helpers/utils'
import easing, { Easing } from './easings'

type StaggerOpts = {
    total: number
    steps: number
    each: number
    start?: number
    ease?: Easing
}

export type StaggerVals = {
    start: number
    end: number
    duration: number
    normStart: number
    // delay: number
}[]

export const getStagger = ({ total, each, start = 0, ease, steps }: StaggerOpts) => {
    let space = total - each
    let stagger = total - each
    let normEach = each / total
    if (stagger < 0) stagger = 0

    let vals: StaggerVals = []

    for (let i = 0; i < steps; i++) {
        let t = i / (steps - 1)
        if (ease) t = easing[ease](t)

        let startVal = space * t + start
        let end = startVal + each
        // let delay = space * t + start
        let normStart = startVal / total

        vals.push({ start: startVal, end, duration: each, normStart })
        // let progressDelay = ease ? easing[ease](progressDelayLin) : progressDelayLin

        // vals.push({ progressDelay, delay })
    }

    const getProgress = (progress: number, i: number) => {
        let { normStart } = vals[i]
        // return map(clamp(progress, start, end), start, end, 0, 1)
        // let { progressDelay } = vals[i]
        let p = (progress - normStart) / normEach
        return clamp(p, 0, 1)
    }

    return { vals, getProgress }
}
