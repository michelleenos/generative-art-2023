type CanvasStuff = {
    ctx: CanvasRenderingContext2D
    canvas: HTMLCanvasElement
    resizeCanvas: (width: number, height: number) => void
}

export function createCanvas(
    initialWidth: number,
    initialHeight: number,
    pixelRatio: number,
    append: boolean
): CanvasStuff
export function createCanvas(
    initialWidth: number,
    initialHeight: number,
    scale: boolean,
    append: boolean
): CanvasStuff
export default function createCanvas(
    initialWidth: number,
    initialHeight: number,
    scaleOrRatio: boolean | number = true,
    append: boolean = true
) {
    const canvas = document.createElement('canvas')

    let ctx = canvas.getContext('2d')!

    let width = initialWidth
    let height = initialHeight

    const resizeCanvas = (width: number, height: number) => {
        let resolution = 1
        if (typeof scaleOrRatio === 'number') {
            resolution = scaleOrRatio
        } else if (scaleOrRatio === true) {
            resolution = Math.min(window.devicePixelRatio, 2)
        }
        canvas.width = width * resolution
        canvas.height = height * resolution
        ctx.scale(resolution, resolution)
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'
    }

    resizeCanvas(width, height)

    if (append) {
        let container = document.getElementById('canvas-container')
        container ? container.appendChild(canvas) : document.body.appendChild(canvas)
    }

    return { canvas, ctx, width, height, resizeCanvas }
}
