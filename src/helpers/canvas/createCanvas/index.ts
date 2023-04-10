export default function createCanvas(
    width: number,
    height: number,
    scale: boolean = true,
    append: boolean = true
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; width: number; height: number } {
    const canvas = document.createElement('canvas')

    let ctx = canvas.getContext('2d')!

    if (scale) {
        let resolution = window.devicePixelRatio
        canvas.width = width * resolution
        canvas.height = height * resolution
        ctx.scale(resolution, resolution)
    } else {
        canvas.width = width
        canvas.height = height
    }
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    // canvas.style.position = 'absolute'
    if (append) {
        let container = document.getElementById('canvas-container')
        container ? container.appendChild(canvas) : document.body.appendChild(canvas)
    }

    return { canvas, ctx, width: canvas.width, height: canvas.height }
}
