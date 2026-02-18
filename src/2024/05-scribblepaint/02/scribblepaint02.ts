import p5 from 'p5'
import { Lines } from '../random-lines-p5'
import { DataView } from '~/helpers/debug/data-view'
import { GUI } from 'lil-gui'
import { snoise } from '../glsl-snoise'
import { linesDebug } from '../lines-debug'
import { Recorder } from '../recorder'
import easing from '~/helpers/easings'
import { noisyLines } from '../../05-backgrounds/05backgrounds'

let palettes = {
    bright: ['#f9c80e', '#fa9161', '#ee5968', '#73d2de', '#e9d2f4', '#a160dd'],
    blues: ['#99dfff', '#60ebca', '#c4f5ed', '#b8ccfc', '#04996d', '#4467ab'],
    candy: ['#f398c3', '#cf3895', '#a0d28d', '#06b4b0', '#fed000', '#FF8552'],
    blumagenta: ['#f4bfdb', '#87425d', '#3c2e6b', '#1e588d', '#0081af'],
    autumn: [
        '#dc5132',
        '#a46589',
        '#7a82b8',
        '#8ad0a6',
        '#c4f0a8',
        '#a0bb07',
        '#ffcf33',
        '#ec9f05',
    ],
    rainbow: [
        '#533a71',
        '#454a96',
        '#6184d8',
        '#50c5b7',
        '#9cec5b',
        '#f0f465',
        '#ff4a1c',
        '#ed254e',
    ],
    gems: ['#87425d', '#3c2e6b', '#0081af', '#a7d6c3', '#285943', '#8a8fbd', '#9a79b8', '#fcee49'],
}
let params = {
    camShiftZ: 200,
    camShiftY: 0,
    upShiftX: 0.4,
}
let palette = palettes.blues

let vert = /* glsl */ `
${snoise}
precision mediump float;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uNoiseFreq1;

attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;
varying float vWave;

uniform float uTime;

void main() {
  vTexCoord = aTexCoord;

//   vec3 noisePos = vec3(aTexCoord.x * 50.0, aTexCoord.y * 234.0, uTime);
vec3 noisePos = vec3(aTexCoord.x * uNoiseFreq1.x, aTexCoord.y * uNoiseFreq1.y, uTime);
    // float noisePos = sin(aTexCoord.x * 50.0) * 0.5 + cos(aTexCoord.y * 234.0) * 0.5 + uTime;
    float wave = snoise(noisePos);
    vWave = wave;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
}
`

let frag = /* glsl */ `
precision mediump float;

${snoise}

float PI = 3.14159265359;

uniform sampler2D uTex;
uniform float uTime;
uniform float uStrokeWeight;
uniform vec2 uPixelSize;
uniform float uAngleMult;
uniform float uDistortion;
varying vec2 vTexCoord;
varying float vWave;

mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}
void main() {
    vec2 st = vTexCoord;

    vec2 st1 = st;
    float wave = vWave;
    float angle = uAngleMult * sin(st.x + uTime);
    // st *= (1.0 - 0.4 * uDistortion);
    float radius = snoise(vec3(st.x * 50.0 - uTime * 0.3, st.y * 7.3 - uTime * 0.6 , uTime * 0.3)) * 0.05;
    st.x += cos(angle) * radius * 0.2;
    st.y += sin(angle) * radius * 0.5;

    vec4 texColor = texture2D(uTex, st);
    gl_FragColor = texColor;
}
`

let dataView = new DataView()
let gui = new GUI()

// @ts-ignore
const one = (lines: Lines) => {
    lines.stepRate = 320
    lines.stepMult = 3
    lines.alphaThreshold = 54
    lines.lineWidth = 5
    lines.longLineRatio = 0.05
    lines.newPixelRadius = 136
    lines.newPixelMethod = 'circle'
    lines.parallel = 20
    lines.lookPointShare = true
    lines.redraw = false
    lines.len.minStart = 217
    lines.len.minEnd = 30
    lines.len.minReduceBy = 1
    lines.len.max = 500
    lines.len.maxForColor = 500
    lines.colors.mixSpace = 'rgb'
    lines.colors.pattern = 'step'
    lines.colors.move = 0.00414
    lines.colors.sort = 'lightness-saturation'
    lines.colors.sortDir = '+'
    lines.colors.shadowAmt = 0
    lines.colors.shadowAlpha = 0
    lines.colors.shadowOffset[0] = 0
    lines.colors.shadowOffset[1] = 0
    lines.wiggle.withinLine = 0.95
    lines.wiggle.onLinePointFail = 0.95
    lines.wiggle.betweenLine = 1.5
    lines.wiggle.dir = -1
    lines.wiggle.nLines = 15
    lines.wiggle.max = 2
    lines.failsUntil.stop = 1000
    lines.failsUntil.moveLook = 100
    lines.failsUntil.forceMoveLook = 300
    lines.failsUntil.reduceMinLen = 200
    lines.tries.pixel = 10
    lines.tries.linePoint = 10
    lines.reset()
}

// @ts-ignore
const two = (lines: Lines) => {
    lines.lineWidth = 4
    lines.len.minEnd = 30
    lines.len.minStart = 217
    lines.len.max = 500
    lines.len.minReduceBy = 1
    lines.longLineRatio = 0.05
    lines.alphaThreshold = 120
    lines.stepMult = 3
    lines.lineWidth = 5
    lines.stepRate = 4500
    lines.newPixelMethod = 'circle'
    // lines.lookPointShare = true
    lines.newPixelRadius = 150
    lines.parallel = 22

    lines.colors.sort = 'lightness'
    // lines.colors.move = 0.0005
    lines.colors.move = 0.002
    lines.colors.sortDir = '+'
    lines.colors.pattern = 'step'
    lines.colors.mixSpace = 'rgb'

    lines.wiggle.max = 2
    lines.wiggle.withinLine = 0.95
    lines.wiggle.onLinePointFail = 0.95
    lines.wiggle.betweenLine = 1.5
    lines.wiggle.nLines = 15
    lines.wiggle.dir = -1

    lines.failsUntil.moveLook = 100
    lines.failsUntil.forceMoveLook = 300
    // lines.failsUntil.reduceMinLen = 400
    lines.parallel = 10
    lines.reset()
}

// @ts-ignore
const three = (lines: Lines) => {
    lines.stepRate = 320
    lines.stepMult = 3
    lines.alphaThreshold = 54
    lines.lineWidth = 5
    lines.longLineRatio = 0.05
    lines.newPixelRadius = 136
    lines.newPixelMethod = 'circle'
    lines.parallel = 20
    lines.lookPointShare = true
    lines.redraw = false
    lines.len.minStart = 217
    lines.len.minEnd = 30
    lines.len.minReduceBy = 1
    lines.len.max = 500
    lines.len.maxForColor = 500
    lines.colors.mixSpace = 'lab'
    lines.colors.pattern = 'step'
    lines.colors.move = 0.00414
    lines.colors.sort = 'hue'
    lines.colors.sortDir = '+'
    lines.colors.shadowAmt = 0
    lines.colors.shadowAlpha = 0
    lines.colors.shadowOffset[0] = 0
    lines.colors.shadowOffset[1] = 0
    lines.wiggle.withinLine = 0.95
    lines.wiggle.onLinePointFail = 0.95
    lines.wiggle.betweenLine = 1.5
    lines.wiggle.dir = -1
    lines.wiggle.nLines = 15
    lines.wiggle.max = 2
    lines.failsUntil.stop = 1000
    lines.failsUntil.moveLook = 100
    lines.failsUntil.forceMoveLook = 300
    lines.failsUntil.reduceMinLen = 200
    lines.tries.pixel = 10
    lines.tries.linePoint = 10
    lines.palette = palettes.blumagenta
}

// @ts-ignore
const four = (lines: Lines) => {
    lines.stepRate = 320
    lines.stepMult = 3
    lines.alphaThreshold = 25
    lines.lineWidth = 5
    lines.longLineRatio = 0.05
    lines.newPixelRadius = 332
    lines.newPixelMethod = 'circle'
    lines.parallel = 20
    lines.lookPointShare = true
    lines.redraw = false
    lines.len.minStart = 220
    lines.len.minEnd = 30
    lines.len.minReduceBy = 1
    lines.len.max = 389
    lines.len.maxForColor = 500
    lines.colors.mixSpace = 'lab'
    lines.colors.pattern = 'step'
    lines.colors.move = 0.00414
    lines.colors.sort = 'hue'
    lines.colors.sortDir = '+'
    lines.colors.shadowAmt = 0
    lines.colors.shadowAlpha = 0
    lines.colors.shadowOffset[0] = 0
    lines.colors.shadowOffset[1] = 0
    lines.wiggle.withinLine = 0.053
    lines.wiggle.onLinePointFail = 1.189
    lines.wiggle.betweenLine = 0.206
    lines.wiggle.dir = -1
    lines.wiggle.nLines = 78
    lines.wiggle.max = 1
    lines.failsUntil.stop = 1643
    lines.failsUntil.moveLook = 904
    lines.failsUntil.forceMoveLook = 300
    lines.failsUntil.reduceMinLen = 200
    lines.tries.pixel = 10
    lines.tries.linePoint = 10
}

const five = (lines: Lines) => {
    lines.stepRate = 320
    lines.stepMult = 3
    lines.alphaThreshold = 54
    lines.lineWidth = 5
    lines.longLineRatio = 0.05
    lines.newPixelRadius = 136
    lines.newPixelMethod = 'circle'
    lines.parallel = 20
    lines.lookPointShare = true
    lines.redraw = false
    lines.len.minStart = 217
    lines.len.minEnd = 30
    lines.len.minReduceBy = 1
    lines.len.max = 500
    lines.len.maxForColor = 500
    lines.colors.mixSpace = 'hsv'
    lines.colors.pattern = 'step'
    lines.colors.move = 0.00414
    lines.colors.sort = 'hue'
    lines.colors.sortDir = '+'
    lines.colors.shadowAmt = 0
    lines.colors.shadowAlpha = 0
    lines.colors.shadowOffset[0] = 0
    lines.colors.shadowOffset[1] = 0
    lines.wiggle.withinLine = 0.95
    lines.wiggle.onLinePointFail = 0.95
    lines.wiggle.betweenLine = 1.5
    lines.wiggle.dir = -1
    lines.wiggle.nLines = 15
    lines.wiggle.max = 2
    lines.failsUntil.stop = 1000
    lines.failsUntil.moveLook = 100
    lines.failsUntil.forceMoveLook = 300
    lines.failsUntil.reduceMinLen = 200
    lines.tries.pixel = 10
    lines.tries.linePoint = 10
    lines.palette = palettes.blumagenta
}

const six = (lines: Lines) => {
    lines.stepRate = 320
    lines.stepMult = 3
    lines.alphaThreshold = 54
    lines.lineWidth = 5
    lines.longLineRatio = 0.05
    lines.newPixelRadius = 136
    lines.newPixelMethod = 'circle'
    lines.parallel = 20
    lines.lookPointShare = true
    lines.redraw = {
        rate: 50,
        maxMult: 2,
        after: 300,
    }
    lines.len.minStart = 217
    lines.len.minEnd = 30
    lines.len.minReduceBy = 1
    lines.len.max = 500
    lines.len.maxForColor = 500
    lines.colors.mixSpace = 'hsv'
    lines.colors.pattern = 'step'
    lines.colors.move = 0.001865
    lines.colors.sort = 'hue'
    lines.colors.sortDir = '+'
    lines.colors.shadowAmt = 0
    lines.colors.shadowAlpha = 0
    lines.colors.shadowOffset[0] = 0
    lines.colors.shadowOffset[1] = 0
    lines.wiggle.withinLine = 0
    lines.wiggle.onLinePointFail = 0.145
    lines.wiggle.betweenLine = 0
    lines.wiggle.dir = -1
    lines.wiggle.nLines = 15
    lines.wiggle.max = 2.17
    lines.failsUntil.stop = 1000
    lines.failsUntil.moveLook = 100
    lines.failsUntil.forceMoveLook = 300
    lines.failsUntil.reduceMinLen = 200
    lines.tries.pixel = 10
    lines.tries.linePoint = 10
}

new p5(
    (p: p5) => {
        let theShader: p5.Shader
        let g: p5.Graphics
        let lines: Lines
        let uTime = 0
        let rSize: number
        let gSize: number
        let timeCircle = 0
        // let bg: HTMLImageElement

        function makeBg() {
            p.camera()
            p.push()
            p.resetShader()
            p.noStroke()
            let bgGraphic = p.createGraphics(p.width, p.height)
            let bgCanvas = noisyLines(rSize, '#fcf5ff')
            bgGraphic.drawingContext.drawImage(bgCanvas, 0, 0, p.width, p.height)
            p.image(bgGraphic, -p.width / 2, -p.height / 2, p.width, p.height)
            p.pop()
        }

        function reset() {
            lines.reset()
            uTime = 0
            timeCircle = 0
            p.clear()
            // p.background(255)
            makeBg()
        }

        p.setup = function () {
            let min = Math.min(window.innerWidth, window.innerHeight)
            let canvas = p.createCanvas(min, min, p.WEBGL)
            rSize = Math.min(p.width, p.height) * 0.9
            gSize = Math.floor(rSize * 0.7)
            g = p.createGraphics(gSize, gSize)
            // // camera = p.createCamera()

            lines = new Lines(g, { palette, pd: p.pixelDensity() })

            theShader = p.createShader(vert, frag)
            theShader.setUniform('uTime', 0)
            theShader.setUniform('uTex', g)
            theShader.setUniform('uPixelSize', [1 / g.width, 1 / g.height])
            theShader.setUniform('uNoiseFreq1', [50, 234])
            theShader.setUniform('uAngleMult', 1.9)

            const debg = {
                uNoiseFreq1: [50, 234],
                uAngleMult: 1.9,
            }
            const u = gui.addFolder('shader')
            u.add(debg.uNoiseFreq1, 0, 0, 1).name('uNoiseFreq1.x')
            u.add(debg.uNoiseFreq1, 1, 0, 1).name('uNoiseFreq1.y')
            u.add(debg, 'uAngleMult', 0, 10, 0.1)
            u.onChange(() => {
                theShader.setUniform('uNoiseFreq1', debg.uNoiseFreq1)
                theShader.setUniform('uAngleMult', debg.uAngleMult)
            })

            new Recorder({
                canvas: canvas.elt,
                fns: {
                    drawRecord: drawRecord,
                    draw: draw,
                    reset: reset,
                },
                gui,
            })

            makeBg()

            gui.add(lines, 'palette', palettes)
            gui.add(params, 'camShiftZ', -500, 500)
            gui.add(params, 'camShiftY', -500, 500)
            gui.add(params, 'upShiftX', -1, 1)
            // gui.add(theShader)
            five(lines)
            lines.reset()
            linesDebug(lines, gui, dataView, reset)
        }

        function drawRecord(_: number) {
            return draw(20)
        }

        function draw(delta: number) {
            // circTimer.progress = Math.min(1, circTimer.progress + delta / circTimer.duration)
            if (!lines.done) {
                lines.update(delta)
            }

            let allDone = timeCircle >= 1 && lines.done
            if (!allDone) {
                timeCircle += delta / 10000
                uTime += delta
            }

            // if (!lines.done || timeCircle < 1) {
            //     uTime += delta
            // }
            theShader.setUniform('uTime', uTime / 1000)
            theShader.setUniform('uTex', g)
            theShader.setUniform('uDistortion', timeCircle)
            theShader.setUniform('uPixelSize', [1 / g.width, 1 / g.height])

            p.noStroke()
            p.shader(theShader)
            p.circle(0, 0, rSize)

            let cx = easing.outSine(Math.min(timeCircle, 1))
            let camZ = 850 + cx * params.camShiftZ
            let camY = 0 + cx * params.camShiftY
            let upX = cx * params.upShiftX

            p.camera(0, camY, camZ, 0, 0, 0, upX, 1, 0)
            dataView.update()

            if (lines.done && timeCircle >= 1) {
                return true
            }
            return false
        }

        p.draw = function () {}
    },
    document.getElementById('sketch') ?? undefined,
)
