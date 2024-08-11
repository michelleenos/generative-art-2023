import { Easing, Group, Tween } from '@tweenjs/tween.js'
import chroma from 'chroma-js'
import GUI from 'lil-gui'
import { createNoise3D } from 'simplex-noise'
import createCanvas from '~/helpers/canvas/createCanvas'
import loop from '~/helpers/loop'
import { Sizes } from '~/helpers/sizes'
import { ColorSortOption } from '~/helpers/sort-colors'
import { Rectangle } from '~/helpers/trig-shapes'
import { clamp, map, random, randomBias } from '~/helpers/utils'
import { Node } from '../07-noise-grid-2/node'
import { getBounds } from './helpful-stuff'
import Alea from 'alea'
import '~/style.css'

let prng = Alea('seed')

const sizes = new Sizes()
let { ctx, resizeCanvas } = createCanvas(sizes.width, sizes.height)
sizes.on('resize', resizeCanvas)
let cellCount = 0
let isStopped = false

/**
 * Utilities
 */

const multBy = <T extends Record<string, number>>(obj: T, mult: number): T => {
    let newObj: T = { ...obj }

    Object.keys(obj).forEach((keyname: keyof T) => {
        if (typeof obj[keyname] === 'number') {
            newObj[keyname] = (obj[keyname] * mult) as T[keyof T]
        }
    })
    return newObj
}

function getItems<T, K extends keyof T>(obj: T, keys: K[]): { [key in K]: T[key] } {
    let newObj = { ...obj }
    for (let key of keys) {
        newObj[key] = obj[key]
    }
    return newObj
}

/**
 * Cell Type
 */

interface Cell {
    stage: 'in' | 'out' | 'childrenOut' | 'willBeRemoved' | 'idle'
    parent?: Cell
    children: Cell[]
    vals: number[]
    tweens: Group | null
    depth: number
    bounds: Rectangle
    birthday: number
    randomVal: number
    delay?: number
    cellId: number
}

/**
 * Params
 */

const params = {
    minDepth: 1,
    maxDepth: 3,
    delayMin: 50,
    delayMax: 400,
    durationIn: 500,
    durationOut: 500,
    noiseFreqDiv: 2,
    noiseSpeedDiv: 0.8,
    noiseFreqColor: 1,
    noiseSpeedColor: 0.1,
    noiseFreqAngle: 0.1,
    noiseSpeedAngle: 0.1,
    rootSize: 200,
    innerRadiusAmt: 0.5,
    colorSort: 'hue' as ColorSortOption,
    layers: 2,
    colorsDist: 0.2,
    threshold: 0.75,
    minAge: 500,
    randomness: 0.2,
    bounds: 'window' as 'window' | 'square',
    lastTime: 0,
    easeIn: Easing.Linear.In,
    easeOut: Easing.Linear.Out,
}

const options = {
    restart: () => {
        rootCell = createCells()
        cells = getLeaves(rootCell)
    },
    togglePlay: () => {
        if (isStopped) {
            isStopped = false
        } else {
            isStopped = true
        }
    },
}

/**
 * GUI
 */

let gui = new GUI()
gui.add(params, 'minDepth', 1, 5, 1)
gui.add(params, 'maxDepth', 1, 5, 1)
gui.add(params, 'delayMin', 0, 3000, 10)
gui.add(params, 'delayMax', 0, 3000, 10)
gui.add(params, 'durationIn', 0, 5000, 10)
gui.add(params, 'durationOut', 0, 5000, 10)
gui.add(params, 'threshold', 0, 1, 0.01)
gui.add(params, 'minAge', 0, 3000, 10)
gui.add(params, 'noiseFreqColor', 0, 2, 0.0001)
gui.add(params, 'noiseSpeedColor', 0, 1, 0.0001)
gui.add(params, 'noiseFreqDiv', 0, 2, 0.0001)
gui.add(params, 'noiseSpeedDiv', 0, 1, 0.0001)
gui.add(params, 'lastTime').listen()
gui.add(params, 'randomness', 0, 1, 0.01).onChange(() => {
    flattenCells(rootCell).forEach((cell) => {
        cell.randomVal = random(-params.randomness / 2, params.randomness / 2)
    })
})
gui.add(options, 'restart')
gui.add(options, 'togglePlay')

/**
 * Create Cells
 */

const createCells = () => {
    let { bounds, countX, countY } = getBounds(sizes.width, sizes.height, params.rootSize)
    let root = createCell(bounds)

    for (let x = 0; x < countX; x++) {
        for (let y = 0; y < countY; y++) {
            let cellBounds = new Rectangle(
                bounds.x + x * params.rootSize,
                bounds.y + y * params.rootSize,
                params.rootSize,
                params.rootSize
            )
            let cell = createCell(cellBounds, root)
            root.children.push(cell)
        }
    }

    let minDepthCount = getLeaves(root)
        .map((cell) => cell.depth)
        .filter((depth) => depth < params.minDepth).length

    let biasX = random(bounds.width * 0.25, bounds.width * 0.75) + bounds.x
    let biasY = random(bounds.width * 0.25, bounds.height * 0.75) + bounds.y

    while (minDepthCount > 4) {
        let x = randomBias(bounds.x, bounds.x + bounds.width, biasX, 0.6)
        let y = randomBias(bounds.y, bounds.y + bounds.height, biasY, 0.6)
        let cell = findCell(root, x, y)
        if (cell && cell.depth < params.maxDepth) {
            divideCell(cell)
        }

        let minDepthArr = getLeaves(root).filter((cell) => cell.depth < params.minDepth)
        minDepthCount = minDepthArr.length
    }

    return root
}

const createCell = (bounds: Rectangle, parent?: Cell, delay = 0): Cell => {
    let vals: number[] = new Array(params.layers + 1).fill(0)
    // let tweens = getCellTweens(vals, 'in', delay, () => {
    //     cell.stage = 'idle'
    //     cell.birthday = Date.now()
    // })

    let cell: Cell = {
        delay,
        stage: 'in',
        randomVal: random(-params.randomness / 2, params.randomness / 2),
        birthday: -1,
        parent,
        children: [],
        bounds,
        vals,
        depth: parent ? parent.depth + 1 : 0,
        tweens: null,
        cellId: ++cellCount,
    }

    return cell
}

const getCellTweens = (
    vals: Cell['vals'],
    dir: 'in' | 'out',
    delay = 0,
    onComplete?: () => void
) => {
    let group = new Group()

    let dur = dir === 'in' ? params.durationIn : params.durationOut
    let to = dir === 'in' ? 1 : 0
    let from = dir === 'in' ? 0 : 1
    let ease = dir === 'in' ? params.easeIn : params.easeOut
    for (let i = 0; i <= params.layers; i++) {
        vals[i] = from
        let tween = new Tween(vals)
            .to({ [i]: to }, dur)
            .easing(ease)
            .delay(dur * (i / params.layers) + delay)
        if (i === params.layers && onComplete) {
            tween.onComplete(onComplete)
        }
        group.add(tween)
        tween.start()
    }

    return group
}

const getDelay = (i?: number) => {
    if (i === undefined) {
        return random(params.delayMin, params.delayMax)
    }
    return map(i, 0, params.layers, params.delayMin, params.delayMax)
}

const divideCell = (cell: Cell) => {
    if (cell.children.length > 0) return false
    let { bounds, children } = cell
    let { x, y, width, height } = bounds
    let hw = width / 2
    let hh = height / 2

    cell.stage = 'idle'

    children.push(
        createCell(new Rectangle(x, y, hw, hh), cell, getDelay()),
        createCell(new Rectangle(x + hw, y, hw, hh), cell, getDelay()),
        createCell(new Rectangle(x, y + hh, hw, hh), cell, getDelay()),
        createCell(new Rectangle(x + hw, y + hh, hw, hh), cell, getDelay())
    )

    updateCells()

    return cell
}

const findCell = (cell: Cell, x: number, y: number): Cell | false => {
    if (cell.bounds.contains(x, y)) {
        for (let child of cell.children) {
            let found = findCell(child, x, y)
            if (found) return found
        }
        return cell
    } else {
        return false
    }
}

const flattenCells = (root: Cell): Cell[] => {
    let cells = [root]
    for (let child of root.children) {
        cells.push(...flattenCells(child))
    }
    return cells
}

const getLeaves = (root: Cell): Cell[] => {
    if (root.children.length === 0) return [root]
    let cells: Cell[] = []
    for (let child of root.children) {
        cells.push(...getLeaves(child))
    }
    return cells
}

const setCellDivide = (cell: Cell) => {
    if (cell.stage !== 'idle' || cell.children.length > 0) return false
    cell.stage = 'out'
    cell.tweens = getCellTweens(cell.vals, 'out', 0, () => {
        cell.stage = 'idle'
        removeTween(cell)
        divideCell(cell)
    })
    return true
}

const setCellCollapse = (cell: Cell, delay = 0): Promise<void> | false => {
    let cannotCollapse = cell.children.some((child) => {
        return child.stage !== 'idle' || child.children.length > 0
    })

    if (cannotCollapse) return false
    if (cell.children.length === 0) {
        return new Promise<void>((resolve) => {
            cell.stage = 'out'
            cell.tweens = getCellTweens(cell.vals, 'out', delay, () => {
                cell.stage = 'willBeRemoved'
                cell.vals = cell.vals.map(() => 0)
                resolve()
            })
        })
    } else {
        let promises: Promise<void>[] = []
        for (let i = 0; i < cell.children.length; i++) {
            let child = cell.children[i]
            let promiseOrFalse = setCellCollapse(child, getDelay())
            if (!promiseOrFalse) return false
            promises.push(promiseOrFalse)
        }

        cell.stage = 'childrenOut'
        removeTween(cell)
        cell.vals = cell.vals.map(() => 1)
        // cell.tweens.getAll().forEach((tween) => tween.stop())
        return Promise.all(promises).then(() => {
            collapseCell(cell)
        })
    }
}

const removeTween = (cell: Cell) => {
    let tweens = cell.tweens
    if (!tweens) return
    tweens.getAll().forEach((tween) => tween.stop())
    cell.tweens = null
}

const collapseCell = (cell: Cell) => {
    cell.children = []
    cell.birthday = -1
    cell.stage = 'in'

    cell.tweens = getCellTweens(cell.vals, 'in', 0, () => {
        cell.stage = 'idle'
        cell.birthday = performance.now()
        removeTween(cell)
    })

    updateCells()
}

/**
 * Cell Update Fn
 */

function updateCells() {
    cells = getLeaves(rootCell)

    cells.forEach((cell) => {
        if (!cell.tweens && cell.stage === 'in') {
            cell.tweens = getCellTweens(cell.vals, 'in', cell.delay, () => {
                cell.stage = 'idle'
                cell.birthday = performance.now()
                removeTween(cell)
            })
        }
    })
}

let noise = createNoise3D(prng)
let rootCell = createCells()
let cells: Cell[]
updateCells()

// let palette = ['#7051b5', '#006e96', '#06b4b0', '#006e96', '#7051b5']
let palette = ['#7051b5', '#cf3895', '#fed000', '#ff8552']
let scale = chroma.scale(palette).mode('rgb')

const draw = (ms: number) => {
    // params.lastTime = ms
    if (isStopped) return
    ctx.fillStyle = '#f6eec7'
    ctx.fillRect(0, 0, sizes.width, sizes.height)
    let { layers, colorsDist, threshold, minDepth, maxDepth, minAge } = params
    let items = getItems(params, [
        'noiseFreqColor',
        'noiseSpeedDiv',
        'noiseFreqDiv',
        'noiseSpeedColor',
        'noiseFreqAngle',
        'noiseSpeedAngle',
    ])
    let {
        noiseFreqDiv,
        noiseFreqColor,
        noiseSpeedDiv,
        noiseSpeedColor,
        noiseSpeedAngle,
        noiseFreqAngle,
    } = multBy(items, 0.001)

    cells.forEach((cell) => {
        if (cell.tweens) cell.tweens.update()
        if (
            cell.stage !== 'idle' ||
            cell.birthday === -1 ||
            performance.now() - cell.birthday < minAge
        )
            return

        let cx = cell.bounds.x + cell.bounds.width / 2
        let cy = cell.bounds.y + cell.bounds.height / 2

        let n = noise(cx * noiseFreqDiv, cy * noiseFreqDiv, ms * noiseSpeedDiv)
        if (n > threshold && cell.depth < maxDepth) {
            setCellDivide(cell)
        } else if (n < -threshold && cell.depth > minDepth) {
            let parent = cell.parent
            if (parent) {
                setCellCollapse(parent)
            }
        }
    })

    cells.forEach((cell) => {
        let progress = cell.vals[0]

        if (progress === 0) return
        let radius = (cell.bounds.width / 2) * progress
        let cx = cell.bounds.x + cell.bounds.width / 2
        let cy = cell.bounds.y + cell.bounds.height / 2

        let angle =
            noise(cx * noiseFreqAngle, cy * noiseFreqAngle, ms * noiseSpeedAngle) * Math.PI * 2
        let ci = noise(cx * noiseFreqColor, cy * noiseFreqColor, ms * noiseSpeedColor) * 0.5 + 0.5
        ci = map(ci, 0, 1, params.randomness, 1 - params.randomness - colorsDist)
        ci += cell.randomVal

        ctx.fillStyle = scale(ci).hex()
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fill()

        let radiusInner = radius * params.innerRadiusAmt

        for (let i = 0; i < layers; i++) {
            let mult = i / layers
            mult = 1 - mult
            let ri = radiusInner * mult
            let p = cell.vals[i]
            let translateAmt = map(p, 0, 1, ri, radius - ri)
            ri *= p
            let x = cx + Math.cos(angle) * translateAmt
            let y = cy + Math.sin(angle) * translateAmt
            let c = scale(ci + ((i + 1) / layers) * colorsDist).hex()
            ctx.fillStyle = c
            ctx.beginPath()
            ctx.arc(x, y, ri, 0, Math.PI * 2)
            ctx.fill()
        }

        // ctx.fillStyle = '#000'
        // ctx.fillText(`${cell.cellId}`, cx, cy)
    })
}

loop(draw)

//@ts-ignore
window.cells = cells
