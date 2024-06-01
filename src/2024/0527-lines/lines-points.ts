import { random } from '~/helpers/utils'

let directions = [
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, 0],
]

type Points = ([number, number] | false)[]

type PointsParams = {
    innerGrid: number
    symmetry?: 'horizontal' | 'vertical' | 'rotate' | 'reflect'
    edgesAttempts: number
    edgesMax: number
    edgesBreak: number
    startPoint?: [number, number]
}

export const getPoints = ({
    innerGrid,
    startPoint = [0, 0],
    symmetry = 'reflect',
    edgesAttempts,
    edgesMax,
    edgesBreak,
}: PointsParams) => {
    let [x, y] = startPoint
    let points: Points = [[x, y]]
    let edges: { [key: string]: [number, number][] } = {}
    let xMax = innerGrid
    let yMax = innerGrid
    if (symmetry === 'horizontal') xMax *= 2
    if (symmetry === 'vertical') yMax *= 2

    const getEdges = (x: number, y: number) => {
        let key = `${x}-${y}`
        if (!edges[key]) {
            edges[key] = []
        }
        return edges[key]
    }

    let i = 0
    let pointsCount = 0
    let needToPushPoint1 = false
    while (i < edgesAttempts && pointsCount < edgesMax) {
        let visited = getEdges(x, y)
        let options = [...directions].filter(([xd, yd]) => {
            if (x + xd < 0 || x + xd > xMax) return false
            if (y + yd < 0 || y + yd > yMax) return false
            if (visited.find(([vx, vy]) => vx === x + xd && vy === y + yd)) return false
            return true
        })

        if (options.length === 0) {
            x = Math.floor(Math.random() * (xMax + 1))
            y = Math.floor(Math.random() * (yMax + 1))
            i++
            points.push(false)
            points.push([x, y])
            continue
        }

        if (needToPushPoint1) {
            points.push([x, y])
            needToPushPoint1 = false
            pointsCount++
        }
        let prevX = x
        let prevY = y

        let dir = random(options)
        x += dir[0]
        y += dir[1]
        visited.push([x, y])
        getEdges(x, y).push([prevX, prevY])
        points.push([x, y])
        pointsCount++
        i++

        if (i % edgesBreak === 0) {
            points.push(false)
            x = Math.floor(Math.random() * (xMax + 1))
            y = Math.floor(Math.random() * (yMax + 1))
            needToPushPoint1 = true
        }
    }

    return { points, edges, attempts: i, pointsCount }
}

type Node = {
    x: number
    y: number
    visited: boolean
    right: string | null
    left: string | null
    up: string | null
    down: string | null
}

export const getFaces = (edges: { [key: string]: [number, number][] }, gridSize: number) => {
    let map: { [key: string]: Node } = {}

    for (let xi = 0; xi < gridSize; xi++) {
        for (let yi = 0; yi < gridSize; yi++) {
            let key = `${xi}-${yi}`
            let edgestl = edges[`${xi}-${yi}`]
            let edgestr = edges[`${xi + 1}-${yi}`]
            let edgesbl = edges[`${xi}-${yi + 1}`]

            map[key] = {
                x: xi,
                y: yi,
                visited: false,
                right: null,
                left: null,
                up: null,
                down: null,
            }

            // find line above
            let aboveLine = edgestl?.find(([x, y]) => x === xi + 1 && y === yi)
            if (!aboveLine) {
                map[key].up = `${xi}-${yi - 1}`
            }

            let leftLine = edgestl?.find(([x, y]) => x === xi && y === yi + 1)
            if (!leftLine) {
                map[key].left = `${xi - 1}-${yi}`
            }

            // find line right
            let rightLine = edgestr?.find(([x, y]) => x === xi + 1 && y === yi + 1)
            if (!rightLine) {
                map[key].right = `${xi + 1}-${yi}`
            }

            // find line bottom
            let bottomLine = edgesbl?.find(([x, y]) => x === xi + 1 && y === yi + 1)
            if (!bottomLine) {
                map[key].down = `${xi}-${yi + 1}`
            }
        }
    }

    let x = 0
    let y = 0
    let queue = [`${x}-${y}`]
    let currentFace: string[] = []
    let faces: { cells: string[]; enclosed: boolean }[] = []
    let currentEnclosed = true

    console.log(edges, map)

    while (queue.length > 0) {
        let current = queue.shift()!
        let node = map[current]

        if (node && !node.visited) {
            currentFace.push(current)

            if (node.right && map[node.right] && !map[node.right].visited) {
                queue.push(node.right)
            }
            if (node.left && map[node.left] && !map[node.left].visited) {
                queue.push(node.left)
            }
            if (node.up && map[node.up] && !map[node.up].visited) {
                queue.push(node.up)
            }
            if (node.down && map[node.down] && !map[node.down].visited) {
                queue.push(node.down)
            }

            if (node.y === gridSize - 1 && node.down) {
                currentEnclosed = false
            }

            if (node.x === gridSize - 1 && node.right) {
                currentEnclosed = false
            }

            node.visited = true
        }

        if (queue.length === 0) {
            if (currentFace.length) {
                faces.push({ cells: currentFace, enclosed: currentEnclosed })
            }
            currentEnclosed = true
            currentFace = []
            if (x < gridSize - 1) {
                x++
                queue.push(`${x}-${y}`)
            } else if (y < gridSize - 1) {
                y++
                x = 0
                queue.push(`${x}-${y}`)
            }
        }
    }

    return faces
}
