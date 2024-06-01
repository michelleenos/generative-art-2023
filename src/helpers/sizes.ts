import { EventEmitter } from 'tseep'

export class Sizes extends EventEmitter<{ resize: (width: number, height: number) => void }> {
    width = window.innerWidth
    height = window.innerHeight
    pixelRatio = Math.min(window.devicePixelRatio, 2)

    constructor() {
        super()
        window.addEventListener('resize', this.resize.bind(this))
    }

    resize() {
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.emit('resize', this.width, this.height)
    }

    destroy() {
        window.removeEventListener('resize', this.resize)
    }
}
