export default function createCanvas(
    initialWidth: number,
    initialHeight: number,
    scale: boolean = true,
    append: boolean = true
) {
    const canvas = document.createElement('canvas')

    let ctx = canvas.getContext('2d')!

    let width = initialWidth
    let height = initialHeight

    const resizeCanvas = (width: number, height: number) => {
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
    }

    resizeCanvas(width, height)

    if (append) {
        let container = document.getElementById('canvas-container')
        container ? container.appendChild(canvas) : document.body.appendChild(canvas)
    }

    return { canvas, ctx, width, height, resizeCanvas }
}
