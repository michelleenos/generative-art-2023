import '../../style.css'
import p5 from 'p5'
import { Lines } from './random-lines-p5'
import { DataView } from '~/helpers/debug/data-view'
import { GUI } from 'lil-gui'
import { snoise } from './glsl-snoise'
import { linesDebug } from './lines-debug'

// vec2 st1 = st + uPixelSize * vec2(1.0, 1.0) * 1.7;
// vec2 st2 = st + uPixelSize * vec2(1.0, 0.0) * 1.7;
// vec2 st3 = st + uPixelSize * vec2(1.0, -1.0) * 1.7;
// vec2 st4 = st + uPixelSize * vec2(-1.0, 1.0) * 1.7;
// vec2 st5 = st + uPixelSize * vec2(-1.0, 0.0) * 1.7;
// vec2 st6 = st + uPixelSize * vec2(-1.0, -1.0) * 1.7;
// vec2 st7 = st + uPixelSize * vec2(0.0, 1.0) * 1.7;
// vec2 st8 = st + uPixelSize * vec2(0.0, -1.0) * 1.7;

// vec4 c1 = texture2D(uTex, st1);
// vec4 c2 = texture2D(uTex, st2);
// vec4 c3 = texture2D(uTex, st3);
// vec4 c4 = texture2D(uTex, st4);
// vec4 c5 = texture2D(uTex, st5);
// vec4 c6 = texture2D(uTex, st6);
// vec4 c7 = texture2D(uTex, st7);
// vec4 c8 = texture2D(uTex, st8);
// vec4 co = texture2D(uTex, st);
// vec4 cn = texture2D(uTex, st + n);

// float amt = 0.1;
// float amtoff = (1.0 - amt) / 8.0;
// vec4 color = co * amt + c1 * amtoff + c2 * amtoff + c3 * amtoff + c4 * amtoff + c5 * amtoff + c6 * amtoff + c7 * amtoff + c8 * amtoff;

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
    // st1.x *= PI * 1.0;
    // st1.y *= PI * 2.0;
    // st.x = abs(sin(st1.x));
    // st.y = abs(sin(st1.y));
    float wave = vWave;
    float angle = 1.9 * sin(wave + st.x + uTime);
    float radius = snoise(vec3(st.x * 50.0 - uTime * 0.3, st.y * 18.0 - uTime * 0.3 , uTime * 0.1)) * 0.05;
    st.x -= cos(angle) * radius * 0.2;
    st.y += sin(angle) * radius * 0.5;
    // st.x = abs(sin(uTime - st.y * 30.0)) + st.x;

    // st -= 0.5;
    // st *= 0.5;
    // st *= rotate2d(uTime * 0.1);
    // st += 0.5;
    // st *= vec2(2.0, 8.0);

    // st = fract(st);
    // float r = texture2D(uTex, (vec2(st.x - wave * 0.1, st.y + ipos.x))).r;
    // float g = texture2D(uTex, (vec2(st.x - sin(ipos.y * 3.0) + wave * 0.1, st.y + ipos.x))).g;
    // // g *= g;
    // float b = texture2D(uTex, (vec2(st.x + wave * -0.15, st.y + wave * -0.2))).b;
    // color.r += sin(b * 20.0 + st.x * 9.0 - cos(uTime) + st.y);

    vec4 texColor = texture2D(uTex, st);
    gl_FragColor = texColor;

    // vec4 c = texture2D(uTex, st);
    // float n2 = abs(snoise(vec3(c.r * 1.0, c.b, uTime) ));
    // st += n2 * 0.1;
    // vec4 c2 = texture2D(uTex, st);
    // c = c2;
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

    let circTimer = {
        duration: 10000,
        progress: 0,
    }

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL)
        g = p.createGraphics(500, 500)
        // camera = p.createCamera()

        lines = new Lines(g, { palette, pd: p.pixelDensity() })

        lines.lineWidth = 4
        lines.len.minEnd = 10
        lines.len.minStart = 100
        lines.len.max = 300
        lines.len.minReduceBy = 1
        lines.stepMult = 1
        lines.stepRate = 5000
        lines.colors.sort = 'luminance'
        lines.colors.sortDir = '-'
        lines.colors.pattern = 'length'
        lines.wiggle.betweenLine = 0.1
        lines.wiggle.withinLine = 0.88
        lines.alphaThreshold = 200
        lines.wiggle.max = 1.62
        lines.wiggle.nLines = 2
        lines.failsUntil.moveLook = 100
        lines.failsUntil.forceMoveLook = 300
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
            // p.camera(0, 0, 700, 0, 0, 0, 0, 1, 0)
            lines.update(delta)
        }

        theShader.setUniform('uTime', ms / 1000)
        theShader.setUniform('uTex', g)
        theShader.setUniform('uPixelSize', [1 / g.width, 1 / g.height])
        p.orbitControl()

        p.noStroke()
        p.shader(theShader)
        p.circle(0, 0, 500)

        let mx = p.map(p.mouseX, 0, p.width, 0, 1)
        let my = p.map(p.mouseY, 0, p.height, 0, 1)
        let camX = 0
        let camY = 0
        // let camX = Math.sin(mx * Math.PI * 2) * -200
        // let camY = Math.sin(my * Math.PI) * 200
        // let camZ = Math.max(600, 700 - ms * 0.01)
        let camZ = 700 - circTimer.progress * 100
        let upX = circTimer.progress * 0.3
        p.camera(camX, camY, camZ, 0, 0, 0, upX, 1, 0)
        // if (lines.done) {
        //     endTimer.tick(delta)
        //     let camX = Math.sin(endTimer.progress * Math.PI * 2) * -200
        //     let camY = Math.sin(endTimer.progress * Math.PI) * 100
        //     let upX = endTimer.progress * 0.3
        //     p.camera(camX, camY, 700, 0, 0, 0, upX, 1, 0)
        // }

        p.fill(0)
        p.stroke(0)
        // el.innerHTML = `
        // ${camera.eyeX.toFixed(2)} ${camera.eyeY.toFixed(2)} ${camera.eyeZ.toFixed(2)}
        // ${camera.centerX.toFixed(2)} ${camera.centerY.toFixed(2)} ${camera.centerZ.toFixed(2)},
        // ${camera.upX.toFixed(2)} ${camera.upY.toFixed(2)} ${camera.upZ.toFixed(2)},
        // `
    }
}, document.getElementById('sketch') ?? undefined)
