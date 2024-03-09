import '~/style.css'
import createCanvas from '~/helpers/canvas/createCanvas'
import loop from '~/helpers/loop'
import { map, random, shuffle } from '~/helpers/utils'
import easings from '~/helpers/easings'

const width = window.innerWidth
const height = window.innerHeight
const { ctx, canvas } = createCanvas(width, height)

// '#717ec3',
let palette = ['#fcab30', '#ff626a', '#4C1E4F', '#496ddb', '#FFC4EB']

palette = shuffle(palette)

type Rect = { x: number; y: number; size: number; progress: number; color: string; level: number }

const tile2 = ({
    iterations,
    minSize,
    rects,
    tileChance = 0.8,
    tileChanceMin = 0.5,
    currentLevel = 1,
}: {
    iterations: number
    rects: Rect[][]
    minSize: number
    tileChance?: number
    tileChanceMin?: number
    currentLevel?: number
}): Rect[][] => {
    if (iterations === 0) {
        return rects
    }
    let nextRects: Rect[] = []
    let lastRects = rects[rects.length - 1]

    lastRects.forEach(({ x, y, size }) => {
        let divide = random([2, 3, 4, 5])
        let step = size / divide
        if (step < minSize) return // min size
        if (random() < tileChance) {
            for (let yy = 0; yy < divide; yy++) {
                for (let xx = 0; xx < divide; xx++) {
                    nextRects.push({
                        x: x + xx * step,
                        y: y + yy * step,
                        size: step,
                        progress: 0,
                        color: palette[currentLevel % palette.length],
                        level: currentLevel,
                    })
                }
            }
        }
    })

    return tile2({
        iterations: iterations - 1,
        rects: [...rects, shuffle(nextRects)],
        minSize,
        tileChance: Math.max(tileChance - 0.1, tileChanceMin),
        currentLevel: currentLevel + 1,
    })
}

let gap = 3
let rects = tile2({
    iterations: 3,
    minSize: 10,
    rects: [[{ x: 0, y: 0, size: width, progress: 0, color: palette[0], level: 0 }]],
    tileChance: 1,
    // tileChanceMin: 0.7,
})
let levelIndex = 0
let rectsIndex = 0
let lastTime = 0
let lastAdd = 0
let speed = 10 // fps
let levelFinishedAdding = false
let levelFinishedGrowing = false
let allDone = false
let borderRadius = width * 0.003
let growing: Rect[] = []

const draw = (t: number) => {
    // ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.strokeStyle = '#000'

    let ms = 1000 / speed
    let elapsed = t - lastTime
    lastTime = t

    let elapsedSinceAdd = t - lastAdd

    if (!allDone && elapsedSinceAdd > ms) {
        lastAdd = t
        let toDraw = Math.round(elapsedSinceAdd / ms)

        for (let i = 0; i < toDraw; i++) {
            if (levelFinishedAdding && levelFinishedGrowing) {
                levelIndex++

                if (levelIndex > rects.length - 1) {
                    allDone = true
                }

                speed *= 3
                rectsIndex = 0
                levelFinishedAdding = false
                levelFinishedGrowing = false
            }

            if (rectsIndex > rects[levelIndex]?.length) {
                levelFinishedAdding = true
                continue
            }

            let rect = rects[levelIndex]?.[rectsIndex]
            if (rect) growing.push(rect)
            rectsIndex++
        }
    }

    let almostDone: Rect[] = []

    growing.forEach((rect) => {
        // let duration = rect.level < 2 ? 1000 : 800
        let duration = 1500
        rect.progress += elapsed / duration
        let size = rect.size - gap
        let cx = rect.x + size / 2
        let cy = rect.y + size / 2
        let scale = easings.inCubic(Math.min(rect.progress, 1))
        size *= scale
        let x = cx - size / 2
        let y = cy - size / 2

        let roundScale = rect.progress < 0.5 ? 0 : easings.inQuart(map(rect.progress, 0.5, 1, 0, 1))
        let roundedness = Math.max(map(roundScale, 0, 1, size / 2, borderRadius), borderRadius)

        ctx.fillStyle = rect.color
        ctx.beginPath()
        ctx.roundRect(x, y, size, size, roundedness)
        ctx.fill()

        if (rect.progress > 0.6) almostDone.push(rect)
    })

    growing = growing.filter((rect) => rect.progress < 1)

    // let almostDone = growing.filter((rect) => rect.progress > 0.6).length === growing.length
    if (levelFinishedAdding && almostDone.length === growing.length) levelFinishedGrowing = true

    if (allDone && growing.length === 0) loopInfo.stop()
}

let loopInfo = loop(draw)
