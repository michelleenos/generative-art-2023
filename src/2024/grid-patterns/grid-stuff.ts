import { random, shuffle } from '~/helpers/utils'
import {
    PatternCellTriangle,
    PatternCellCircle,
    PatternCellHalfCircle,
    PatternCellLeaf,
    PatternCellLines,
    PatternCellQuarterCircle,
    PatternCellQuarterCircleFill,
    PatternCellQuarterCircleLines,
    type PatternCell,
} from './cells/pattern-cell'
import { Easing } from '~/helpers/easings'
import { PatternCellProps } from './cells/cells-base'
import { createNoise2D } from 'simplex-noise'

export type CornersPattern = 'wave' | 'circle' | false
export type Corner = 'tl' | 'tr' | 'bl' | 'br'
export type Direction = 'up' | 'down' | 'left' | 'right'
export type CellsOrder = 'linear-x' | 'linear-y' | 'diag-tl' | 'diag-tr' | 'random' | 'circle'
export type PatternStyleOpts = {
    quarterCircleFill?: { innerRatio?: number; outerRatio?: number }
    quarterCircleLines?: {
        innerRatio?: number
        outerRatio?: number
        steps?: number
        each?: number
        lineWidth?: number
    }
    lines?: {
        steps?: number
        diagSteps?: number
        each?: number
        lineWidth?: number
        dirOptions?: ('h' | 'v' | 'd1' | 'd2')[]
    }
}

type PatternCreateOptions = {
    squareOptions?: PatternCell['style'][]
    rectOptions?: PatternCell['style'][]
    easing?: Easing
    duration?: number
    colors?: string[]
    styleOpts?: PatternStyleOpts
    rectChance?: number
    cornersPattern?: CornersPattern
    noisePattern?: boolean
}

let noise2d = createNoise2D()

export const indexToPoint = (index: number, sides: number) => {
    if (index < 0 || index >= sides * sides) return { x: -1, y: -1 }
    return { x: index % sides, y: Math.floor(index / sides) }
}

export const pointToIndex = (x: number, y: number, sides: number) => {
    if (x < 0 || x >= sides || y < 0 || y >= sides) return -1
    return y * sides + x
}

const getCorner = (
    nx: number,
    ny: number,
    w: number,
    h: number,
    pattern: CornersPattern
): Corner => {
    if (pattern === 'wave') {
        return nx % 2 === 0 ? (ny % 2 === 0 ? 'tl' : 'br') : ny % 2 === 0 ? 'tr' : 'bl'
    } else if (pattern === 'circle') {
        if (w > h) return ny % 2 === 0 ? random(['tl', 'tr']) : random(['bl', 'br'])
        if (h > h) return nx % 2 === 0 ? random(['tl', 'bl']) : random(['tr', 'br'])
        return nx % 2 === 0 ? (ny % 2 === 0 ? 'tl' : 'bl') : ny % 2 === 0 ? 'tr' : 'br'
    }

    return random(['tl', 'tr', 'bl', 'br'])
}

const getDirection = (
    nx: number,
    ny: number,
    w: number,
    h: number,
    pattern: CornersPattern
): Direction => {
    let dir: Direction | undefined

    if (pattern === 'wave') {
        dir = nx % 2 === 0 ? (ny % 2 === 0 ? 'up' : 'down') : ny % 2 === 0 ? 'left' : 'right'
    } else if (pattern === 'circle') {
        if (w > h) dir = ny % 2 === 0 ? 'up' : 'down'
        if (h > w) dir = nx % 2 === 0 ? 'left' : 'right'
    }

    if (dir) return dir

    return w > h ? random(['up', 'down']) : random(['left', 'right'])
}

const styleHasCorner = (style: PatternCell['style']) => {
    return [
        'quarterCircle',
        'triangle',
        'quarterCircleFill',
        'quarterCircleLines',
        'leaf',
    ].includes(style)
}

const styleHasDirection = (style: PatternCell['style']) => {
    // let styles: PatternCell['style'][] = ['halfCircle']
    return ['halfCircle'].includes(style)
}

const getCell = (opts: PatternCellProps, style: PatternCell['style']) => {
    switch (style) {
        case 'triangle':
            return new PatternCellTriangle(opts)
        case 'halfCircle':
            return new PatternCellHalfCircle(opts)
        case 'quarterCircle':
            return new PatternCellQuarterCircle(opts)
        case 'leaf':
            return new PatternCellLeaf(opts)
        case 'circle':
            return new PatternCellCircle(opts)
        case 'lines':
            return new PatternCellLines(opts)
        case 'quarterCircleFill':
            return new PatternCellQuarterCircleFill(opts)
        case 'quarterCircleLines':
            return new PatternCellQuarterCircleLines(opts)
    }
}

export const createPattern = (sides: number, opts: PatternCreateOptions) => {
    const map: (PatternCell | null)[] = Array.from({ length: sides * sides }, () => null)
    let ind = 0
    const cells: PatternCell[] = []

    while (ind < map.length) {
        if (map[ind]) {
            ind++
            continue
        }
        let point = indexToPoint(ind, sides)
        if (point.x < 0 || point.y < 0) break
        let { x, y } = point

        let canRectX = x < sides - 1 && map[ind + 1] === null
        let canRectY = y < sides - 1 && map[ind + sides] === null

        let cell = createPatternCell(x, y, { ...opts, canRectX, canRectY })

        cells.push(cell)

        map[ind] = cell
        if (cell.w > cell.h) map[ind + 1] = cell
        if (cell.h > cell.w) map[ind + sides] = cell
    }

    return { cells, map }
}

const defaultSquareOptions: PatternCell['style'][] = [
    'triangle',
    'lines',
    'quarterCircle',
    'circle',
    'leaf',
]

const defaultRectOptions: PatternCell['style'][] = ['halfCircle', 'quarterCircle']

export const createPatternCell = (
    nx: number,
    ny: number,
    opts: PatternCreateOptions & {
        canRectX?: boolean
        canRectY?: boolean
        shape?: 'horiz' | 'vert' | 'square'
    }
) => {
    let {
        cornersPattern = false,
        canRectX = false,
        canRectY = false,
        rectChance = 0.5,
        squareOptions = defaultSquareOptions,
        rectOptions = defaultRectOptions,
    } = opts

    let shape: 'horiz' | 'vert' | 'square'
    if (cornersPattern === 'circle') {
        if (nx % 2 !== 0 || ny % 2 !== 0) {
            canRectX = false
            canRectY = false
        }
    }
    if (opts.shape) {
        shape = opts.shape
    } else {
        let isRect = (canRectX || canRectY) && Math.random() < rectChance
        if (isRect) {
            shape = canRectX && canRectY ? random(['horiz', 'vert']) : canRectX ? 'horiz' : 'vert'
        } else {
            shape = 'square'
        }
    }

    let style: PatternCell['style']
    if (opts.noisePattern) {
        style = getCellStyleNoise(nx, ny, shape === 'square' ? squareOptions : rectOptions)
    } else {
        style = shape === 'square' ? random(squareOptions) : random(rectOptions)
    }

    let [w, h] = [shape === 'horiz' ? 2 : 1, shape === 'vert' ? 2 : 1]

    let cellOpts = {
        nx,
        ny,
        w,
        h,
        easing: opts.easing,
        duration: opts.duration,
        corner: styleHasCorner(style) ? getCorner(nx, ny, w, h, cornersPattern) : undefined,
        direction: styleHasDirection(style)
            ? getDirection(nx, ny, w, h, cornersPattern)
            : undefined,
        color: opts.colors ? random(opts.colors) : '#fff',
    }

    if (style === 'quarterCircleFill' || style === 'quarterCircleLines' || style === 'lines') {
        if (opts.styleOpts && opts.styleOpts[style]) {
            cellOpts = { ...cellOpts, ...opts.styleOpts[style] }
        }
    }

    let cell = getCell(cellOpts, style)

    return cell
}

export const getCellStyleNoise = (nx: number, ny: number, options: PatternCell['style'][]) => {
    let len = options.length
    let div = 100
    let noiseVal = Math.abs(noise2d((nx + 900) / div, (ny - 1200) / div)) * len * 2
    noiseVal = Math.floor(noiseVal)
    return options[noiseVal % len]
}

export const orderCells = (cells: PatternCell[], order: CellsOrder, sides: number) => {
    let map: number[] = Array.from({ length: sides * sides }, () => -1)
    if (order === 'linear-x') {
        cells.sort((a, b) => {
            const diffY = a.ny - b.ny
            if (diffY !== 0) return diffY
            return Math.random() > 0.5 ? a.nx - b.nx : b.nx - a.nx
        })
    } else if (order === 'linear-y') {
        cells.sort((a, b) => {
            const diffX = a.nx - b.nx
            if (diffX !== 0) return diffX
            return Math.random() > 0.5 ? a.ny - b.ny : b.ny - a.ny
        })
    } else if (order === 'random') {
        cells = shuffle(cells)
    } else if (order === 'circle') {
        // order in groups making up circles - each circle is made of 4 cells
        cells.sort((a, b) => {
            const diffY = Math.floor(a.ny / 2) - Math.floor(b.ny / 2)
            if (diffY !== 0) return diffY
            return Math.floor(a.nx / 2) - Math.floor(b.nx / 2)
        })
    } else if (order === 'diag-tl') {
        cells.sort((a, b) => {
            const diff = a.ny + a.nx - (b.ny + b.nx)
            return diff
        })
    } else if (order === 'diag-tr') {
        cells.sort((a, b) => {
            const diff = a.ny + (sides - a.nx) - (b.ny + (sides - b.nx))
            return diff
        })
    }

    cells.forEach((cell, i) => {
        let index = pointToIndex(cell.nx, cell.ny, sides)
        if (index >= 0) {
            map[index] = i
            if (cell.w > 1) map[index + 1] = i
            if (cell.h > 1) map[index + sides] = i
        }
    })

    return { cells, map }
}
