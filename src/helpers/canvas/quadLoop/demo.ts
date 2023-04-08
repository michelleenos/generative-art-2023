import '~/style.css'
import { getRandomPoints } from '~/0402/parts/points'
import createCanvas from '../createCanvas'
import quadLoop from '.'

let width = window.innerWidth
let height = window.innerHeight
let { canvas, ctx } = createCanvas(width, height)

let points = getRandomPoints(10, width, height)

ctx.translate(width / 2, height / 2)
ctx.strokeStyle = '#fff'
quadLoop(ctx, points)
ctx.stroke()
