import { Rng } from './prng'

export function randomSample1d(count: number, min: number, max: number, n: number, rng: Rng) {
    const results: number[] = []

    while (results.length < count) {
        // generate n random candidates between min and max

        let candidates: number[] = []
        for (let i = 0; i < n; i++) {
            candidates.push(rng(min, max))
        }
        // for each candidate, find the distance between it and existing results
        // take the closest distance
        // select the candidate with the largest closest distance and add to results
        candidates = candidates.sort((a, b) => {
            let closestA = Infinity
            let closestB = Infinity
            results.forEach((r) => {
                closestA = Math.min(closestA, Math.abs(r - a))
                closestB = Math.min(closestB, Math.abs(r - b))
            })
            return closestB - closestA
        })
        results.push(candidates[0])
    }

    return results
}
