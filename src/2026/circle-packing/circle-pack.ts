import createCanvas from '~/helpers/create-canvas'
import { Circle } from '~/helpers/trig-shapes'
import { clamp, lerp, map, random } from '~/helpers/utils'
import '~/style.css'

let width = 800
let height = 800
const cnvs = createCanvas(width, height)
const { ctx } = cnvs

function circlePack(radius: number, maxAttempts = 100, existing?: Circle[]) {
    let circles: Circle[] = existing || []
    let attempts = 0
    let c = 0

    while (attempts < maxAttempts) {
        c++
        let circle = new Circle(
            random(radius, width - radius),
            random(radius, height - radius),
            radius,
        )
        let valid = true

        for (let i = 0; i < circles.length; i++) {
            if (circle.intersectsCircle(circles[i])) {
                valid = false
                break
            }
        }

        if (valid) {
            circles.push(circle)
            attempts = 0
        } else {
            attempts++
        }
    }

    console.log(`found ${circles.length} circles with ${c} iterations`)

    return circles
}

interface GrowCircleOpts {
    maxAttempts?: number
    newRadiusMin?: number
    newRadiusMax?: number
    minPadding?: number
}

function growFromCircle(
    circle: Circle,
    existing: Circle[],
    { maxAttempts = 10, ...opts }: GrowCircleOpts,
) {
    let newChildren: Circle[] = []
    let attempts = 0
    let c = 0

    let newRadiusMin = opts.newRadiusMin || circle.radius * 0.85
    let newRadiusMax = opts.newRadiusMax || circle.radius * 0.85

    let minPadding = opts.minPadding || 0

    while (attempts < maxAttempts) {
        c++
        let angle = random(0, Math.PI * 2)
        let newRadius = random(newRadiusMin, newRadiusMax)
        let dist = circle.radius + newRadius + random(2, 10)
        let node = new Circle(
            circle.x + Math.cos(angle) * dist,
            circle.y + Math.sin(angle) * dist,
            newRadius,
        )
        let valid = true

        if (
            node.x - node.radius < 0 ||
            node.x + node.radius > width ||
            node.y - node.radius < 0 ||
            node.y + node.radius > height
        ) {
            valid = false
        }

        if (valid) {
            let nodesToCheck = [circle, ...newChildren, ...existing]
            for (let i = 0; i < nodesToCheck.length; i++) {
                if (node.intersectsCircle(nodesToCheck[i], minPadding)) {
                    valid = false
                    break
                }
            }
        }

        if (valid) {
            newChildren.push(node)
            attempts = 0
        } else {
            attempts++
        }
    }
    console.log(`found ${newChildren.length} new circles in ${c} attempts`)
    return { circles: newChildren, c }
}

function circlePackGrow() {
    // starts with one circle and 'grows' outward with smaller circles around it
    let radius = 100
    let circles: Circle[] = []
    let c = 0

    let current: Circle[] = [
        new Circle(random(width * 0.3, width * 0.7), random(height * 0.3, height * 0.7), radius),
    ]

    // for calculating size of children... the decrease in size is larger if the current circle radius is larger
    // higher value of k = lower ratio
    const getRatio = (radius: number, k = 0.004) => 1 - k * radius

    while (current.length > 0) {
        let circle = current.shift()!
        let newCircles: Circle[] = []
        let shouldGrow = circle.radius >= 15

        if (shouldGrow) {
            let ratioMin = getRatio(circle.radius, 0.004)
            let ratioMax = getRatio(circle.radius, 0.004)
            // nice result but takes longer:
            // let ratioMin = getRatio(circle.radius, 0.008)
            // let ratioMax = getRatio(circle.radius, 0.004)

            let radiusMin = circle.radius * ratioMin
            let radiusMax = circle.radius * ratioMax

            let growResult = growFromCircle(circle, [...circles, ...current], {
                maxAttempts: 10000, // more attempts makes a smoother result
                newRadiusMin: radiusMin,
                newRadiusMax: radiusMax,
                minPadding: 2,
            })
            c += growResult.c
            newCircles = growResult.circles
        }
        current.push(...newCircles)
        circles.push(circle)
    }

    console.log(`total attempts: ${c}`)

    return [...circles, ...current]
}

function draw() {
    ctx.fillStyle = '#f3f3f3'
    ctx.fillRect(0, 0, width, height)

    // let circles = circlePack(50, 100)
    // circles = circlePack(30, 400, circles)
    // circles = circlePack(15, 700, circles)
    // circles = circlePack(10, 1000, circles)
    // circles = circlePack(5, 2500, circles)

    let circles = circlePackGrow()

    ctx.fillStyle = '#6d3fdf'
    circles.forEach((c) => {
        ctx.beginPath()
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2)
        ctx.fill()
    })
}

draw()
