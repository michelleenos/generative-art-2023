export const generateNoise = (width: number, height: number) => {
    const offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = width
    offscreenCanvas.height = height
    const ctx = offscreenCanvas.getContext('2d')!

    const iData = ctx.createImageData(width, height)
    const buffer32 = new Uint32Array(iData.data.buffer)
    const len = buffer32.length
    let subArrayLength = Math.ceil(len / 8)

    for (let i = 0; i < subArrayLength; i++) {
        if (Math.random() < 0.5) {
            buffer32[i] = 0x09ffffff
        }
    }

    buffer32.set(buffer32.subarray(0, subArrayLength), subArrayLength)
    buffer32.set(buffer32.subarray(0, subArrayLength * 2), subArrayLength * 2)
    buffer32.set(buffer32.subarray(0, subArrayLength * 4), len - subArrayLength * 4)

    ctx.putImageData(iData, 0, 0)

    return offscreenCanvas
}
