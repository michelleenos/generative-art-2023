type MouseTrackerOpts = {
    move?: boolean
    overout?: boolean
    drag?: (e: MouseEvent) => void
}

export function mouseTracker(
    el: HTMLElement | Window = window,
    { move = true, overout = false, drag }: MouseTrackerOpts = {}
) {
    let mouse: { x: number; y: number; over?: boolean; down?: boolean } = {
        x: -1,
        y: -1,
    }
    if (overout) mouse.over = false
    if (drag) mouse.down = false

    if (move) {
        el.addEventListener('mousemove', (e: MouseEvent) => {
            mouse.x = e.clientX
            mouse.y = e.clientY
            if (drag && mouse.down) drag(e)
        })
    }

    if (drag) {
        el.addEventListener('mousedown', () => (mouse.down = true))
        el.addEventListener('mouseup', () => (mouse.down = false))
    }

    if (overout) {
        el.addEventListener('mouseleave', () => {
            mouse.over = false
            if (drag) mouse.down = false
        })
        el.addEventListener('mouseenter', () => (mouse.over = true))
    }

    return mouse
}
