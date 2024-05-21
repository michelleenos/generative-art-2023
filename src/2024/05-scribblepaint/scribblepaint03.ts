import '../../style.css'
import p5 from 'p5'
import { Lines } from './random-lines-p5'
import { DataView } from '~/helpers/debug/data-view'
import { GUI } from 'lil-gui'
import { snoise } from './glsl-snoise'
import { linesDebug } from './lines-debug'

// let palette = [
//     '#874286',
//     '#856596',
//     '#fc814a',
//     '#f9c8ce',
//     '#a8d7a8',
//     '#b6cccc',
//     '#8aadbc',
//     '#7a7eb8',
// ]
let palette = ['#f398c3', '#cf3895', '#a0d28d', '#06b4b0', '#fed000', '#FF8552']

let vert = /* glsl */ `
precision mediump float;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;
uniform float uTime;

void main() {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
}
`

let frag = /* glsl */ `
precision mediump float;
uniform sampler2D uTex;
uniform float uTime;
uniform vec2 uPixelSize;
varying vec2 vTexCoord;

void main() {
    vec2 st = vTexCoord;
    vec4 color = texture2D(uTex, st);
    gl_FragColor = color;
}
`

let dataView = new DataView()
let gui = new GUI()

let el = document.createElement('div')
el.style.position = 'fixed'
el.style.top = '10px'
el.style.left = '10px'
el.style.zIndex = '1000'
el.style.color = '#000'
document.body.appendChild(el)

new p5((p: p5) => {
    let theShader: p5.Shader
    let g: p5.Graphics
    let lines: Lines
    let lastTime = 0
    let m: number

    let circTimer = {
        duration: 10000,
        progress: 0,
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL)
        m = Math.min(p.width, p.height) * 0.9
        g = p.createGraphics(m * 0.7, m * 0.7)

        lines = new Lines(g, { palette, pd: p.pixelDensity() })

        lines.lineWidth = 4
        lines.len.minEnd = 50
        lines.len.minStart = 500
        lines.len.max = 800
        lines.len.minReduceBy = 1
        lines.stepMult = 2
        lines.stepRate = 5000
        lines.colors.sort = 'luminance'
        lines.colors.sortDir = '-'
        lines.colors.pattern = 'length'
        lines.wiggle.betweenLine = 0.1
        lines.wiggle.withinLine = 0.88
        lines.alphaThreshold = 250
        lines.wiggle.max = 1.62
        lines.wiggle.nLines = 5
        lines.failsUntil.moveLook = 100
        lines.failsUntil.forceMoveLook = 600
        lines.reset()

        theShader = p.createShader(vert, frag)
        theShader.setUniform('uTime', 0)
        theShader.setUniform('uTex', g)
        theShader.setUniform('uPixelSize', [1 / g.width, 1 / g.height])

        linesDebug(lines, gui, dataView, () => {
            p.clear()
            p.background(255)
        })

        p.background(255)
    }

    p.draw = function () {
        let ms = p.millis()

        let delta = ms - lastTime
        lastTime = ms
        circTimer.progress = Math.min(1, circTimer.progress + delta / circTimer.duration)

        if (!lines.done) {
            lines.update(delta)
        }

        theShader.setUniform('uTime', ms / 1000)
        theShader.setUniform('uTex', g)
        theShader.setUniform('uPixelSize', [1 / g.width, 1 / g.height])
        p.orbitControl()

        p.noStroke()
        p.shader(theShader)
        p.plane(m, m)

        dataView.update()
        // p.camera(camX, camY, camZ, 0, 0, 0, upX, 1, 0)
    }
}, document.getElementById('sketch') ?? undefined)
