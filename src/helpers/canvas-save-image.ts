export function saveCanvasImage(
    canvas: HTMLCanvasElement,
    fileName = 'canvas',
    type: 'png' | 'jpeg' | 'webp' = 'png',
    quality?: number,
) {
    const dataUrl = canvas.toDataURL(`image/${type}`, quality)
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${fileName}.${type}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
