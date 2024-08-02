import { NoiseOptions, Tree, TreeOptions } from './tree-animation'
import { type PatternFn } from './patterns'
import { random } from '~/helpers/utils'
import { AnimNode } from './anim-node'

type AnimNodeData = { color1: string; color2: string; pattern: PatternFn }

export class TreePattern extends Tree<AnimNodeData> {
    patterns: { [key: string]: PatternFn }
    palette: string[]
    noiseOptsPattern: NoiseOptions

    constructor(
        options: TreeOptions & {
            palette: string[]
            patterns: { [key: string]: PatternFn }
            noiseOptsPattern?: Partial<NoiseOptions>
        }
    ) {
        super(options)
        this.noiseOptsPattern = {
            key: 'pattern',
            freq: 0.64,
            speed: 1.6,
            amp: 1,
            ...options.noiseOptsPattern,
        }
        this.palette = options.palette
        this.patterns = options.patterns
    }

    getLeafData = (leaf: AnimNode<AnimNodeData>): AnimNodeData => {
        let noise = this.getNoise(leaf)
        let colorVal = noise * 0.5 + 0.5
        colorVal += random(0.8) + leaf.depth

        let c1 = Math.floor(colorVal) % this.palette.length
        let c2 = (c1 + 1) % this.palette.length

        let patternVal = noise * 0.5 + 0.5
        let patternKeys = Object.keys(this.patterns)
        let key = patternKeys[Math.floor(patternKeys.length * patternVal)]
        let pattern = this.patterns[key]

        return {
            color1: this.palette[c1],
            color2: this.palette[c2],
            pattern,
        }
    }

    draw = (ctx: CanvasRenderingContext2D) => {
        ctx.save()
        this.leaves.forEach((leaf) => {
            let progress = leaf.progress
            if (!leaf.data) leaf.data = this.getLeafData(leaf)

            leaf.data.pattern(ctx, {
                bounds: leaf.bounds,
                c1: leaf.data.color1,
                c2: leaf.data.color2,
                progress,
            })
        })
    }
}
