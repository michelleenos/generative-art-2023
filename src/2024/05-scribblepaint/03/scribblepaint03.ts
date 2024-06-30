import { GUI } from 'lil-gui'
import p5 from 'p5'
import { DataView } from '~/helpers/debug/data-view'
import { noisyLines } from '../../05-backgrounds/05backgrounds'
import { snoise } from '../glsl-snoise'
import { linesDebug } from '../lines-debug'
import { Lines } from '../random-lines-p5'
import { Recorder } from '../recorder'

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

uniform float uTime;

void main() {
  vTexCoord = aTexCoord;
  vec3 pos = aPosition;
  vec4 positionVec4 = vec4(pos, 1.0);
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
uniform float uProgress;
varying vec2 vTexCoord;

mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}
void main() {
    vec2 st = vTexCoord;

    float t = uTime * (1.0 - uProgress);
    
    float angle = 1.9 * atan(st.y, st.x);
    float radius = snoise(vec3(st.x * 50.0 - t * 0.3, st.y * 7.3 , t * 0.3)) * 0.03;

    float distort = uProgress;
    st.x -= cos(angle) * radius * distort;
    st.y += sin(angle) * radius * distort;

    float n = snoise(vec3(st.x * 3.5, st.y * 39.3, t)) * 0.3;
    st.x += n;
    st.y += n * 0.3;
    vec4 tex = texture2D(uTex, st );
    gl_FragColor = tex;
}
`

let dataView = new DataView()
dataView.hide()
let gui = new GUI().close()

new p5((p: p5) => {
    let theShader: p5.Shader
    let g: p5.Graphics
    let lines: Lines
    let uTime = 0
    let rSize: number
    let gSize: number
    let timeCircle = 0
    let canvas: p5.Renderer
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
        canvas = p.createCanvas(min, min, p.WEBGL)
        rSize = Math.min(p.width, p.height) * 0.9
        gSize = Math.floor(rSize * 0.7)
        g = p.createGraphics(gSize, gSize)

        lines = new Lines(g, { palette, pd: p.pixelDensity() })
        lines.parallel = 3
        lines.stepRate = 1000
        lines.alphaThreshold = 2
        lines.lineWidth = 4
        lines.wiggle.withinLine = 1
        lines.wiggle.betweenLine = 1
        lines.wiggle.dir = 1
        lines.wiggle.nLines = 50
        lines.wiggle.max = 1.5

        lines.colors.move = 0.0004

        lines.len.minStart = 100
        lines.len.minEnd = 90
        lines.len.minReduceBy = 1
        lines.lookPointShare = true
        lines.newPixelRadius = 50
        lines.newPixelMethod = 'circle'
        lines.failsUntil.stop = 700
        lines.failsUntil.moveLook = 400
        lines.failsUntil.forceMoveLook = 500
        lines.failsUntil.reduceMinLen = 200

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
        lines.update(delta)
        let allDone = timeCircle >= 1 && lines.done
        if (!allDone) {
            timeCircle += delta / 10000
            uTime += delta
        }

        theShader.setUniform('uTime', uTime / 1000)
        theShader.setUniform('uTex', g)
        theShader.setUniform('uProgress', Math.min(timeCircle, 1))

        p.noStroke()
        p.shader(theShader)
        p.plane(rSize, rSize)

        dataView.update()

        if (lines.done && timeCircle >= 1) {
            return true
        }
        return false
    }

    p.draw = function () {}
}, document.getElementById('sketch') ?? undefined)
