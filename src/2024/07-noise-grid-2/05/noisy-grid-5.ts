import loop from '~/helpers/loop'
import { Rectangle } from '~/helpers/trig-shapes'
import '~/style.css'
import createCanvas from '../../../helpers/canvas/createCanvas'
import { NoiseOptions, Tree, TreeOptions } from '../tree-animation'
import { Sizes } from '~/helpers/sizes'
import { clamp, map, random, shuffle } from '~/helpers/utils'
import { AnimNode, AnimNodeOptions } from '../anim-node'
import chroma from 'chroma-js'
import GUI from 'lil-gui'
import { ColorSortOption, sortPalette } from '~/helpers/sort-colors'
import { TreePerf } from '../tree-animation-perf'
import { DataView } from '~/helpers/debug/data-view'

const sizes = new Sizes()
let { ctx, resizeCanvas } = createCanvas(sizes.width, sizes.height)
sizes.on('resize', resizeCanvas)
let m = Math.min(sizes.width, sizes.height) * 0.9
let palettes = [
    ['#081232', '#bba0ca', '#fff8e8', '#fcd581', '#d52941', '#990d35'],
    ['#fefaec', '#f398c3', '#cf3895', '#a0d28d', '#06b4b0', '#fed000', '#FF8552'],
    ['#002e2d', '#06b4b0', '#cf3895', '#fff8e8', '#f398c3', '#a0d28d', '#ffd930', '#FF8552'],
    ['#331c25', '#3c2e6b', '#0081af', '#a7d6c3', '#285943', '#8a8fbd', '#9a79b8', '#fcee49'],
]

const getPalette = (index: number) => {
    let palette = [...palettes[index]]
    palette = shuffle(palette)
    let bg = palette.shift()!
    return { bg, palette: [...palette] }
}

let options = {
    getPalette,
    paletteIndex: Math.floor(random(palettes.length)),
}

let { bg, palette } = options.getPalette(options.paletteIndex)

type AnimNodeData = {
    colorIndex: number
    randomVal: number
    angle: number
}

class AnimNodeBlobs extends AnimNode<AnimNodeData> {
    constructor(bounds: Rectangle, opts: AnimNodeOptions<AnimNodeData>) {
        super(bounds, opts)
    }
}

class ColorTree extends TreePerf<AnimNodeData> {
    colorRandomness = 0.2
    circleNum: number
    noiseOptsColor: NoiseOptions = {
        key: 'colors',
        speed: 0.1,
        freq: 1,
    }

    circleStep = 2
    colorMix: chroma.InterpolationMode = 'rgb'
    _palette: string[]
    _colorSort: ColorSortOption | 'random'

    constructor(
        options: TreeOptions & {
            palette: string[]
            colorSort?: ColorSortOption
            colorRandomness?: number
            colorMix?: chroma.InterpolationMode
            circleNum?: number
        }
    ) {
        super(options)
        this._palette = palette
        this._colorSort = options.colorSort || 'random'
        this.colorRandomness = options.colorRandomness || 0.2
        this.colorMix = options.colorMix || 'rgb'
        this.circleNum = options.circleNum || 3
    }

    get colorSort() {
        return this._colorSort
    }

    set colorSort(val: ColorSortOption | 'random') {
        this._colorSort = val
        this.sortPalette()
    }

    set palette(palette: string[]) {
        this._palette = palette
        this.sortPalette()
    }

    get palette() {
        return this._palette
    }

    sortPalette = () => {
        if (this._colorSort === 'random') {
            this._palette = shuffle(this._palette)
        } else {
            this._palette = sortPalette(this._palette, this._colorSort)
        }
    }

    getLeafColors = (leaf: AnimNode<AnimNodeData>) => {
        let noise = this.getNoise(leaf, this.noiseOptsColor)
        let colorVal = noise * 0.5 + 0.5

        let data = this.getLeafData(leaf)
        colorVal += data.randomVal
        colorVal *= this.palette.length
        let colorsOne: string[] = []

        for (let i = 0; i < this.circleNum; i++) {
            let ind = Math.floor(colorVal + i) % this.palette.length
            colorsOne.push(this.palette[ind])
        }

        let colorsFinal: string[] = []
        colorsFinal.push(this.palette[data.colorIndex])
        for (let i = 0; i < colorsOne.length - 1; i++) {
            let c1 = colorsOne[i]
            let c2 = colorsOne[(i + 1) % colorsOne.length]
            let c = chroma.mix(c1, c2, colorVal % 1, this.colorMix).hex()
            colorsFinal.push(c)
        }

        return colorsFinal
    }

    // getLeafMovement = (leaf: AnimNode<AnimNodeData>, i: number) => {
    //     if (leaf.data?.center) {
    //         return leaf.data.center
    //     }

    //     // let durWait = 4
    //     // let durMove = 1
    //     // let t = this.lastTime / 1000 / (durWait + durMove)
    //     // let tInt = Math.floor(t)
    //     // let tFract = t % 1

    //     // let decWait = durWait / (durWait + durMove)
    //     // if (tFract > decWait) {
    //     //     t = tInt + easing.inOutQuad(map(tFract, decWait, 1, 0, 1))
    //     // } else {
    //     //     t = tInt
    //     // }

    //     let cx = (leaf.bounds.x + leaf.bounds.width) * 0.005
    //     let cy = (leaf.bounds.y + leaf.bounds.height) * 0.005
    //     let nx = this.noise(cx, cy, this.lastTime * 0.001)
    //     let ny = this.noise(cx, cy, -this.lastTime * 0.001)

    //     let data = this.getLeafData(leaf)
    //     data.center = [nx, ny]
    //     return [nx, ny]
    // }

    getLeafDist = (leaf: AnimNode<AnimNodeData>) => {
        let noise = this.getNoise(leaf, this.noiseOptsColor)
        return noise * 0.5 + 0.5
    }

    getLeafData = (leaf: AnimNode<AnimNodeData>) => {
        if (!leaf.data) {
            let r = random(this.colorRandomness)
            let noise = this.getNoise(leaf, this.noiseOptsColor)
            let colorVal = noise * 0.5 + 0.5
            colorVal += r
            colorVal *= this.palette.length
            let index1 = Math.floor(colorVal) % this.palette.length
            leaf.data = {
                angle: noise * Math.PI * 2,
                colorIndex: index1,
                randomVal: random(this.colorRandomness),
            }
        }
        return leaf.data
    }

    draw = (ctx: CanvasRenderingContext2D) => {
        ctx.save()
        this.leaves.forEach((leaf, i) => {
            // let progress = leaf.state === 'waitingToCollapse' ? 1 : leaf.progress
            let progress = leaf.progress

            let colors = this.getLeafColors(leaf)

            // let mvt = this.getLeafMovement(leaf, i)
            let angle = this.getLeafData(leaf).angle

            ctx.save()
            ctx.translate(
                leaf.bounds.x + leaf.bounds.width / 2,
                leaf.bounds.y + leaf.bounds.height / 2
            )

            let len = colors.length
            let prevRadius: number
            colors.forEach((color, i) => {
                let radius = leaf.bounds.width * (1 - i / (len + this.circleStep)) * progress * 0.5
                let translateMax: number
                if (prevRadius === undefined) {
                    translateMax = 0
                } else {
                    translateMax = prevRadius - radius
                }

                prevRadius = radius

                if (i > 0) {
                    let tx = Math.cos(angle) * translateMax * (1 - leaf.progress)
                    let ty = Math.sin(angle) * translateMax * (1 - leaf.progress)
                    ctx.translate(tx, ty)
                }
                ctx.fillStyle = color
                ctx.beginPath()
                ctx.arc(0, 0, radius, 0, Math.PI * 2)
                ctx.fill()
            })
            ctx.restore()
        })
    }
}

let tree = new ColorTree({
    palette,
    bounds: new Rectangle((sizes.width - m) / 2, (sizes.height - m) / 2, m, m),
    maxDepth: 4,
    minDepth: 2,
    thresholdChange: 0.6,
    noiseOptions: {
        speed: 0.2,
        freq: 1,
    },
    minLifeSpan: 600,
    nodeDuration: 400,
    nodeEaseEnter: 'inQuad',
    nodeEaseLeave: 'inQuad',
    divideRule: 'quarters-grid',
    colorSort: 'hue',
    colorRandomness: 0.31,
    delayFn: (index, count) => random(),
})

// window.addEventListener('mousedown', (e: MouseEvent) => {
//     let x = e.clientX
//     let y = e.clientY

//     let rect = tree.bounds

//     let node = tree.node.findNode(x, y)
//     if (node) {
//         tree.collapse(node)
//     }

//     // looping.stop()
//     // setTimeout(() => {
//     //     ctx.fillStyle = 'red'
//     //     ctx.arc(x, y, 10, 0, Math.PI * 2)
//     //     ctx.fill()
//     // })
// })

const gui = new GUI()

gui.add(tree, 'maxDepth', 1, 8, 1)
gui.add(tree, 'minDepth', 1, 8, 1)
gui.add(tree, 'thresholdChange', 0, 1, 0.01)
if (typeof tree.noiseOptions.freq === 'object') {
    gui.add(tree.noiseOptions.freq, 'x', 0, 5, 0.01).name('noise freq x')
    gui.add(tree.noiseOptions.freq, 'y', 0, 5, 0.01).name('noise freq y')
} else {
    gui.add(tree.noiseOptions, 'freq', 0, 5, 0.01).name('noise freq')
}
gui.add(tree.noiseOptions, 'speed', 0, 2, 0.01).name('noise speed')
if (typeof tree.noiseOptsColor.freq === 'object') {
    gui.add(tree.noiseOptsColor.freq, 'x', 0, 5, 0.01).name('noise2 freq x')
    gui.add(tree.noiseOptsColor.freq, 'y', 0, 5, 0.01).name('noise2 freq y')
} else {
    gui.add(tree.noiseOptsColor, 'freq', 0, 5, 0.001).name('noise2 freq')
}
gui.add(tree.noiseOptsColor, 'speed', 0, 2, 0.001).name('noise2 speed')
gui.add(tree, 'circleStep', 0, 5, 0.1)
gui.add(tree, 'circleNum', 0, 10, 1)

gui.add(tree, 'colorSort', [
    'hue',
    'luminance',
    'saturation',
    'temperature',
    'lightness',
    'lightness-saturation',
    'random',
])
gui.add(tree, 'divideRule', ['quarters-grid', 'half', 'two-random', 'two-thirds', 'thirds-row'])
gui.add(tree, 'colorRandomness', 0, 1, 0.01)
gui.add(tree, 'colorMix', ['rgb', 'lab', 'hsv', 'hsl', 'hsi'])
gui.add(
    options,
    'paletteIndex',
    palettes.map((_, i) => i)
).onChange((val: number) => {
    let { bg: newBg, palette } = options.getPalette(val)
    tree.palette = palette
    bg = newBg
})

gui.add(tree, 'nodeDuration', 0, 2000, 1)

gui.add(tree, 'initTree')
gui.close()

let dv = new DataView().createSection('Tree')
dv.add(tree, 'tickCalculationsAvg', 1)
dv.add(tree, 'leavesCountsAvg', 1)

tree.initTree()

function draw(ms: number) {
    ctx.clearRect(0, 0, sizes.width, sizes.height)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, sizes.width, sizes.height)

    tree.tick(ms, ctx)
    dv.update()
}

loop(draw)
