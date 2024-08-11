import GUI, { Controller } from 'lil-gui'
import makeImages from '~/helpers/canvas-images'

type RecorderOpts = {
    canvas: HTMLCanvasElement
    gui: GUI
    useTime?: boolean
    fns: {
        draw: ((t: number) => void) | ((t: number) => boolean)
        drawRecord: (frame: number) => boolean
        reset?: () => void
    }
}

export class Recorder {
    recording = false
    imgs: ReturnType<typeof makeImages>
    needsFreshZip = false
    framesCount = 0
    maxFrames = 4000
    canvas: HTMLCanvasElement
    gui: GUI
    guiBtnRecord: Controller
    guiBtnLoop: Controller
    guiBtnReset: Controller
    looping = false
    lastTime: number | null = null
    zipsDownloaded = 0
    imgsPerZip = 700
    rafId?: number | null = null
    currentId: string
    name = 'img'
    useTime = false
    fns: {
        draw: (t: number) => void
        drawRecord: (frame: number) => boolean
        reset?: () => void
    }

    constructor({ canvas, gui, fns, useTime = false }: RecorderOpts) {
        this.canvas = canvas
        let d = new Date()
        this.currentId = `${this.name}-${d.getHours()}${d.getMinutes()}`
        this.imgs = makeImages(canvas, this.currentId)
        this.gui = gui.addFolder('controls')
        this.useTime = useTime
        this.fns = {
            draw: fns.draw,
            drawRecord: fns.drawRecord,
            reset: fns.reset,
        }

        this.gui.add(this, 'framesCount').listen().disable()
        this.gui.add(this, 'maxFrames', 10, 1500, 1).name('max frames')
        this.guiBtnRecord = this.gui.add(this, 'toggleRecord').name('startRecording')
        this.guiBtnLoop = this.gui.add(this, 'toggleLoop').name('loop')
        this.guiBtnReset = this.gui.add(this, 'reset').name('reset')

        // this.rafId = requestAnimationFrame(this.raf)
    }

    reset = () => {
        if (this.fns.reset) this.fns.reset()
        this.framesCount = 0
        this.lastTime = null
        this.needsFreshZip = true
    }

    rafRecord = () => {
        if (!this.recording) return

        this.imgs.getImage(`${this.name}-${this.framesCount}`).then(() => {
            let done = this.fns.drawRecord(this.framesCount)
            this.framesCount++
            if (this.framesCount >= this.maxFrames || done) {
                this.imgs.downloadZip()
            } else if (this.framesCount > (this.zipsDownloaded + 1) * this.imgsPerZip) {
                this.imgs.zipStream().then(() => {
                    this.zipsDownloaded++
                    this.lastTime = null
                    this.imgs = makeImages(this.canvas, `${this.currentId}-${this.zipsDownloaded}`)
                    requestAnimationFrame(this.rafRecord)
                })
            } else {
                requestAnimationFrame(this.rafRecord)
            }
        })
    }

    raf = () => {
        let time = performance.now()
        if (!this.lastTime) this.lastTime = time
        let delta = time - this.lastTime
        this.lastTime = time
        this.fns.draw(this.useTime ? time : delta)
        this.rafId = requestAnimationFrame(this.raf)
    }

    toggleRecord = () => {
        if (this.recording) {
            this.recording = false
            this.needsFreshZip = true
            this.guiBtnRecord.name('startRecording')
        } else {
            if (this.fns.reset) this.fns.reset()
            this.framesCount = 0
            this.recording = true
            this.looping = false
            if (this.rafId) cancelAnimationFrame(this.rafId)
            this.rafId = null
            if (this.needsFreshZip) {
                this.imgs = makeImages(this.canvas)
                this.needsFreshZip = false
            }
            this.rafRecord()
            this.guiBtnRecord.name('stopRecording')
        }
    }

    toggleLoop = () => {
        if (this.looping) {
            this.guiBtnLoop.name('loop')
            this.looping = false
            if (this.rafId) cancelAnimationFrame(this.rafId)
            this.rafId = null
            this.lastTime = null
        } else {
            this.guiBtnLoop.name('noLoop')
            this.rafId = requestAnimationFrame(this.raf)
            this.looping = true
        }
    }
}
