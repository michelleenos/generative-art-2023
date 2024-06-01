import p5 from 'p5'
import { Lines } from '../random-lines-p5'
import { DataView } from '~/helpers/debug/data-view'
import { GUI } from 'lil-gui'
import { snoise } from '../glsl-snoise'
import { linesDebug } from '../lines-debug'
import { Recorder } from '../recorder'
import easing from '~/helpers/easings'
import { noisyLines } from '../../05-backgrounds/05backgrounds'

// let palette = ['#f398c3', '#cf3895', '#a0d28d', '#06b4b0', '#fed000', '#FF8552']
let palette = ['#f9c80e', '#fa9161', '#ee5968', '#73d2de', '#e9d2f4', '#a160dd']

let vert = /* glsl */ `
${snoise}
precision mediump float;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;
varying float vWave;

uniform float uTime;

void main() {
  vTexCoord = aTexCoord;

  vec3 noisePos = vec3(aTexCoord.x * 50.0, aTexCoord.y * 234.0, uTime);
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
    float angle = 1.9 * sin(st.x + uTime);
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

new p5((p: p5) => {
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

        lines.lineWidth = 4
        lines.len.minEnd = 30
        lines.len.minStart = 217
        lines.len.max = 500
        lines.len.minReduceBy = 1

        lines.longLineRatio = 0.05
        lines.stepMult = 1
        lines.stepRate = 1000
        lines.newPixelMethod = 'circle'
        lines.lookPointShare = true
        lines.newPixelRadius = 80

        lines.colors.sort = 'saturation'
        lines.colors.move = 0.0005
        lines.colors.sortDir = '-'
        lines.colors.pattern = 'step'

        lines.alphaThreshold = 20
        lines.wiggle.max = 1
        lines.wiggle.withinLine = 0.4
        lines.wiggle.onLinePointFail = 0.5
        lines.wiggle.betweenLine = 0.5
        lines.wiggle.nLines = 15
        lines.wiggle.dir = 1

        lines.failsUntil.moveLook = 100
        lines.failsUntil.forceMoveLook = 300
        // lines.failsUntil.reduceMinLen = 400
        lines.parallel = 10
        lines.reset()

        theShader = p.createShader(vert, frag)
        theShader.setUniform('uTime', 0)
        theShader.setUniform('uTex', g)
        theShader.setUniform('uPixelSize', [1 / g.width, 1 / g.height])

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
        let camZ = 850 + cx * 200
        let upX = cx * 0.4

        p.camera(0, 0, camZ, 0, 0, 0, upX, 1, 0)
        dataView.update()

        if (lines.done && timeCircle >= 1) {
            return true
        }
        return false
    }

    p.draw = function () {}
}, document.getElementById('sketch') ?? undefined)
