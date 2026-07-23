import type GUI from 'lil-gui'

type Pal = { bg: string; colors: string[]; name: string }
export function makePalettesGui<T extends Pal>(
    gui: GUI,
    current: T,
    options: T[],
    onUpdate: (pal: T) => void,
) {
    const palsByName = Object.fromEntries(options.map((p) => [p.name, p]))
    const paletteProxy = {
        paletteIndex: options.indexOf(current),
        palette: current,
    }

    const select = gui.add(paletteProxy, 'palette', palsByName).onChange((pal: T) => {
        setPalette(pal, options.indexOf(pal))
        slider.updateDisplay()
    })

    const slider = gui
        .add(paletteProxy, 'paletteIndex', 0, options.length - 1, 1)
        .onChange((i: number) => {
            let palette = options[i]
            setPalette(options[i], i)
            select.updateDisplay()
        })

    const setPalette = (p: T, idx: number) => {
        paletteProxy.palette = p
        paletteProxy.paletteIndex = idx
        onUpdate(p)
    }
}
