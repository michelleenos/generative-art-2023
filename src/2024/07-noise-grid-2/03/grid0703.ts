import loop from '~/helpers/loop'
import { Rectangle } from '~/helpers/trig-shapes'
import '~/style.css'
import createCanvas from '../../../helpers/create-canvas'
import { NoiseOptions, Tree, TreeOptions } from '../tree-animation'
import { Sizes } from '~/helpers/sizes'
import { random, shuffle } from '~/helpers/utils'
import { AnimNode } from '../anim-node'
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

type AnimNodeData = { color?: string; randomVal: number }
class ColorTree extends TreePerf<AnimNodeData> {
    colorMix: chroma.InterpolationMode = 'rgb'
    colorRandomness = 0.2
    noiseOpts2: NoiseOptions = {
        key: 'colors',
        speed: 0.1,
        freq: 1,
    }
    _palette: string[]
    _colorSort: ColorSortOption | 'random'

    constructor(
        options: TreeOptions & {
            palette: string[]
            colorSort?: ColorSortOption
            colorRandomness?: number
            colorMix?: chroma.InterpolationMode
        }
    ) {
        super(options)
        this._palette = palette
        this._colorSort = options.colorSort || 'random'
        this.colorRandomness = options.colorRandomness || 0.2
        this.colorMix = options.colorMix || 'rgb'
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

    getLeafColor = (leaf: AnimNode<AnimNodeData>) => {
        let noise = this.getNoise(leaf, this.noiseOpts2)
        let colorVal = noise * 0.5 + 0.5

        let data = this.getLeafData(leaf)
        colorVal += data.randomVal
        colorVal *= this.palette.length

        let index1 = Math.floor(colorVal) % this.palette.length
        let index2 = (index1 + 1) % this.palette.length
        let fract = colorVal % 1

        let color = chroma
            .mix(this.palette[index1], this.palette[index2], fract, this.colorMix)
            .hex()

        return color
    }

    getLeafData = (leaf: AnimNode<AnimNodeData>) => {
        if (!leaf.data) {
            leaf.data = {
                randomVal: random(this.colorRandomness),
            }
        }
        return leaf.data
    }

    draw = (ctx: CanvasRenderingContext2D) => {
        ctx.save()
        this.leaves.forEach((leaf) => {
            let progress = leaf.progress

            let data = this.getLeafData(leaf)
            data.color = this.getLeafColor(leaf)

            ctx.save()
            ctx.translate(
                leaf.bounds.x + leaf.bounds.width / 2,
                leaf.bounds.y + leaf.bounds.height / 2
            )
            ctx.fillStyle = data.color
            ctx.beginPath()
            ctx.arc(0, 0, leaf.bounds.width * 0.5 * progress, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
        })
    }
}

let tree = new ColorTree({
    palette,
    bounds: new Rectangle((sizes.width - m) / 2, (sizes.height - m) / 2, m, m),
    maxDepth: 5,
    minDepth: 3,
    thresholdChange: 0.8,
    noiseOptions: {
        speed: 0.1,
        freq: 1,
    },
    minLifeSpan: 600,
    nodeDuration: 400,
    nodeEaseEnter: 'inQuad',
    nodeEaseLeave: 'inQuad',
    divideRule: 'quarters-grid',
    colorSort: 'hue',
    colorRandomness: 0.31,
    colorMix: 'rgb',
})

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
if (typeof tree.noiseOpts2.freq === 'object') {
    gui.add(tree.noiseOpts2.freq, 'x', 0, 5, 0.01).name('noise2 freq x')
    gui.add(tree.noiseOpts2.freq, 'y', 0, 5, 0.01).name('noise2 freq y')
} else {
    gui.add(tree.noiseOpts2, 'freq', 0, 5, 0.001).name('noise2 freq')
}
gui.add(tree.noiseOpts2, 'speed', 0, 2, 0.001).name('noise2 speed')
gui.add(tree, 'colorSort', [
    'hue',
    'luminance',
    'saturation',
    'temperature',
    'lightness',
    'lightness-saturation',
    'random',
])
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

gui.add(tree, 'initTree')

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
