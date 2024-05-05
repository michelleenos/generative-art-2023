export default function loop(cb: FrameRequestCallback) {
    let id: number
    let isStopped: boolean = false
    let isLooping: boolean = true
    function animation(t: DOMHighResTimeStamp) {
        id = requestAnimationFrame(animation)
        cb(t)
    }
    id = requestAnimationFrame(animation)

    return {
        stop: () => {
            cancelAnimationFrame(id)
            isStopped = true
            isLooping = false
        },
        isLooping: () => isLooping,
        isStopped: () => isStopped,
    }
}
