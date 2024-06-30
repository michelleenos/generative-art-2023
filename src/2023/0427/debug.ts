import { round } from '../../helpers/utils.js'

type Params = {
    bubblesMult: number
    mouseMass: number
    mouseDiffMult: number
    viscosity: number
    bubbleRadius: number
    mouseRadius: number
}

export function debugBubbles(PARAMS: Params, ctx: CanvasRenderingContext2D) {
    let stored = JSON.parse(window.localStorage.getItem('locparams') ?? '{}')
    let paramNames = Object.keys(PARAMS) as (keyof Params)[]
    paramNames.forEach((param) => {
        PARAMS[param] = stored[param] ?? PARAMS[param]
    })

    const drawParams = () => {
        ctx.fillStyle = '#fff'
        ctx.font = '12px monospace'
        ctx.textAlign = 'left'

        ctx.fillText(`bubblesMult   (x, z): ${PARAMS.bubblesMult}`, 10, 20)
        ctx.fillText(`mouseMass     (n, m): ${PARAMS.mouseMass}`, 10, 40)
        ctx.fillText(`mouseDiffMult (v, b): ${PARAMS.mouseDiffMult}`, 10, 60)
        ctx.fillText(`viscosity     (g, h): ${PARAMS.viscosity}`, 10, 80)
        ctx.fillText(`bubbleRadius  (w, e): ${PARAMS.bubbleRadius}`, 10, 100)
        ctx.fillText(`mouseRadius   (r, t): ${PARAMS.mouseRadius}`, 10, 120)
    }

    function adjust(param: keyof Params, amount: number, places = 2) {
        PARAMS[param] = round(PARAMS[param] + amount, places)
    }

    window.addEventListener('keypress', (e) => {
        switch (e.key) {
            case 'x':
                adjust('bubblesMult', -0.05)
                break
            case 'z':
                adjust('bubblesMult', 0.05)
                break
            case 'n':
                adjust('mouseMass', -1, 1)
                break
            case 'm':
                adjust('mouseMass', 1, 1)
                break
            case 'b':
                adjust('mouseDiffMult', 0.05)
                break
            case 'v':
                adjust('mouseDiffMult', -0.05)
                break
            case 'g':
                adjust('viscosity', -0.001, 3)
                break
            case 'h':
                adjust('viscosity', 0.001, 3)
                break
            case 'w':
                adjust('bubbleRadius', -1, 1)
                break
            case 'e':
                adjust('bubbleRadius', 1, 1)
                break
            case 'r':
                adjust('mouseRadius', -1, 1)
                break
            case 't':
                adjust('mouseRadius', 1, 1)
                break
            default:
                break
        }

        window.localStorage.setItem('locparams', JSON.stringify(PARAMS))
    })

    return drawParams
}
