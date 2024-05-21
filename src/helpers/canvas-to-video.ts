function canvasToVideo(canvas: HTMLCanvasElement) {
    const chunks: Blob[] = []
    const stream = canvas.captureStream(30) // fps

    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8' })

    mediaRecorder.ondataavailable = (e) => {
        console.log(e)
        chunks.push(e.data)
    }

    mediaRecorder.start()

    mediaRecorder.onstop = () => {
        onStop(chunks)
    }

    const onStop = (chunks: Blob[]) => {
        console.log('onstop')
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'video.webm'
        document.body.appendChild(a)
        a.click()
        console.log(a)

        setTimeout(() => {
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        })
    }

    return mediaRecorder
}

export default canvasToVideo
