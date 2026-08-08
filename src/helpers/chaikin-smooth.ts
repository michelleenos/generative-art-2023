export function chaikinSmooth(pts: { x: number; y: number }[], times: number) {
    let prev: { x: number; y: number }[] = pts

    for (let t = 0; t < times; t++) {
        let next: { x: number; y: number }[] = []
        for (let i = 0; i < prev.length - 1; i++) {
            const a = prev[i]
            const b = prev[i + 1]

            next.push(
                {
                    x: a.x * 0.75 + b.x * 0.25,
                    y: a.y * 0.75 + b.y * 0.25,
                },
                {
                    x: a.x * 0.25 + b.x * 0.75,
                    y: a.y * 0.25 + b.y * 0.75,
                },
            )
        }
        prev = next
    }

    return prev
}
