import { random } from '~/helpers/utils'

export type CrazyTilesProps = {
    x: number
    y: number
    w: number
    h: number
    iterations?: number
    fn: (x: number, y: number, w: number, h: number) => void
    minSize?: number
    divisions?: '2s' | '2s-3s' | 'random'
}

export function crazyTiles({
    x,
    y,
    w,
    h,
    iterations = 6,
    fn,
    minSize = -1,
    divisions = '2s',
}: CrazyTilesProps) {
    iterations--

    if (iterations === 0 || w < minSize || h < minSize) {
        fn(x, y, w, h)
        return
    }

    if (w > h) {
        let w1, w2

        if (divisions === '2s') {
            w1 = w / random([2, 4])
        } else if (divisions === '2s-3s') {
            w1 = w / random([2, 3, 4])
        } else {
            w1 = w * random(0.2, 0.8)
        }

        if (random() < 0.5) {
            w2 = w - w1
        } else {
            w2 = w1
            w1 = w - w2
        }

        let x1 = x - w / 2 + w1 / 2
        let x2 = x + w / 2 - w2 / 2

        crazyTiles({ x: x1, y, w: w1, h, iterations, fn, minSize, divisions })
        crazyTiles({ x: x2, y, w: w2, h, iterations, fn, minSize, divisions })
    } else {
        let h1, h2
        if (divisions === '2s') {
            h1 = h / random([2, 4])
        } else if (divisions === '2s-3s') {
            h1 = h / random([2, 3, 4])
        } else {
            h1 = h * random(0.2, 0.8)
        }

        if (random() < 0.5) {
            h2 = h - h1
        } else {
            h2 = h1
            h1 = h - h2
        }
        let y1 = y - h / 2 + h1 / 2
        let y2 = y + h / 2 - h2 / 2

        crazyTiles({ x, y: y1, w, h: h1, iterations, fn, minSize, divisions })
        crazyTiles({ x, y: y2, w, h: h2, iterations, fn, minSize, divisions })
    }
}
