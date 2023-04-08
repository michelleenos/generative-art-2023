export default function loop(cb: FrameRequestCallback): { stop: () => void } {
    let id
    function animation(t: DOMHighResTimeStamp) {
        id = requestAnimationFrame(animation)
        cb(t)
    }
    id = requestAnimationFrame(animation)

    return {
        stop: () => cancelAnimationFrame(id),
    }
}
