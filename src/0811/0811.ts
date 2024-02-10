import '../style.css'
import Voronoi, { VoronoiDiagram, Cell } from 'voronoi'
import { Particle, ParticleOpts } from '~/helpers/particles/particle'
import { throttle } from '../helpers/utils'
import { Pane } from 'tweakpane'

import p5 from 'p5'

let palettes = [
    ['#8ea604', '#afc2d5', '#ec9f05', '#d76a03', '#DD7804', '#003844'],
    ['#f9c80e', '#f86624', '#ea3546', '#662e9b', '#43bccd', '#232020'],
    ['#080708', '#3772ff', '#df2935', '#3ef071', '#fdca40', '#e6e8e6'],
]

let palette: string[]

let props = {
    numSites: 70,
    width: 500,
    height: 500,
    repelThreshold: 300,
    constAttract: 3,
    constRepel: 8,
    startEdge: 0.4,
    attractMaxDist: 250,
    repelMinDist: 1,
    repelMaxDist: 200,
    dragMult: 0.995,
    maxVel: 0.2,
    showParticles: false,
}
const voronoi = new Voronoi()
let bbox = {
    xl: props.width * -0.1,
    xr: props.width * 1.1,
    yb: props.height * 1.1,
    yt: props.height * -0.1,
}
let sites: ParticleWithColor[] = []
let diagram: VoronoiDiagram
let bg: string
let colorindex = 0

class ParticleWithColor extends Particle {
    color: string
    constructor(x: number, y: number, options: ParticleOpts) {
        super(x, y, options)
        this.color = ''
    }
}

const setSizes = () => {
    props.width = Math.min(window.innerWidth * 0.9, 800)
    props.height = Math.min(window.innerHeight * 0.9, 800)

    bbox = {
        xl: props.width * -0.1,
        xr: props.width * 1.1,
        yb: props.height * 1.1,
        yt: props.height * -0.1,
    }
}

function setPane() {
    let pane = new Pane()
    let folder = pane.addFolder({ title: 'settings' })
    folder.addInput(props, 'repelThreshold', { min: 1, max: 500, step: 1 })
    folder.addInput(props, 'constAttract', {
        min: 0,
        max: 10,
        step: 0.5,
    })
    folder.addInput(props, 'constRepel', { min: 0, max: 29, step: 0.5 })
    folder.addInput(props, 'attractMaxDist', { min: 1, max: 800, step: 1 })
    folder.addInput(props, 'repelMinDist', { min: 1, max: 800, step: 1 })
    folder.addInput(props, 'repelMaxDist', { min: 1, max: 800, step: 1 })
    folder.addInput(props, 'dragMult', { min: 0, max: 1, step: 0.001 })
    folder.addInput(props, 'maxVel', { min: 0, max: 1, step: 0.01 })
    folder.addInput(props, 'startEdge', { min: 0, max: 1, step: 0.01 })

    folder.addInput(props, 'showParticles')
}

const numSitesSpan = document.getElementById('numSites') as HTMLSpanElement

new p5((p: p5) => {
    let canvas: p5.Renderer
    function recolor() {
        for (let i = 0; i < sites.length; i++) {
            sites[i].color = palette[i % palette.length]
        }
    }
    function setSites(count?: number) {
        if (!count) count = sites.length ? sites.length : props.numSites
        sites = []
        for (let i = 0; i < count; i++) {
            // p.createVector(p.round(p.random(props.width)), p.round(p.random(props.width)))
            let site = new ParticleWithColor(
                p.random(props.width * props.startEdge, props.width * (1 - props.startEdge)),
                p.random(props.height * props.startEdge, props.height * (1 - props.startEdge)),
                {
                    edges: {
                        left: bbox.xl,
                        right: bbox.xr,
                        top: bbox.yt,
                        bottom: bbox.yb,
                    },
                }
            )

            site.color = palette[i % palette.length]
            sites.push(site)
        }
    }

    p.setup = () => {
        setSizes()
        canvas = p.createCanvas(props.width, props.height)

        palette = [...p.random(palettes)]
        palette = p.shuffle(palette)
        bg = palette.pop() ?? ''

        setSites()
        setPane()
    }

    p.draw = () => {
        p.background(bg)
        p.fill(0, 100)
        p.noStroke()

        let len = sites.length
        numSitesSpan.textContent = len.toString()

        for (let i = 0; i < len; i++) {
            const siteA = sites[i]

            for (let j = i + 1; j < len; j++) {
                const siteB = sites[j]
                let distance = siteA.dist(siteB)
                if (distance < props.repelThreshold) {
                    let repel = siteB.attract(siteA, {
                        min: props.repelMinDist,
                        max: props.repelMaxDist,
                        G: props.constRepel,
                    })
                    siteA.applyForce(repel.copy().mult(-1))
                    siteB.applyForce(repel)
                } else {
                    let force = siteB.attract(siteA, {
                        G: props.constAttract,
                        max: props.attractMaxDist,
                    })
                    siteA.applyForce(force)
                    siteB.applyForce(force.copy().mult(-1))
                }

                siteA.update()
                siteB.update()
            }
            siteA.checkEdges(-0.9)
            siteA.velocity.mult(props.dragMult)
            siteA.velocity.limit(props.maxVel)
        }

        voronoi.recycle(diagram)
        diagram = voronoi.compute(sites, bbox)
        if (p.frameCount === 1) console.log(diagram)

        p.noStroke()

        diagram.cells.forEach((cell, i) => {
            // @ts-ignore
            if (cell.site.color) p.fill(cell.site.color)
            drawCell(cell)
        })

        if (props.showParticles) {
            p.push()
            sites.forEach((site) => {
                p.fill('#fff')
                p.stroke('#000')
                p.circle(site.x, site.y, 5)
            })
            p.pop()
        }

        if (p.mouseIsPressed) {
            throttledMouse()
        }
    }

    function drawCell(cell: Cell) {
        p.push()

        p.translate(cell.site.x, cell.site.y)
        p.scale(0.9)
        p.translate(-cell.site.x, -cell.site.y)
        p.beginShape()

        let len = cell.halfedges.length

        for (let i = 0; i < len; i++) {
            const { x, y } = cell.halfedges[i].getStartpoint()
            p.vertex(x, y)
        }

        p.endShape(p.CLOSE)
        p.pop()
    }

    let throttledMouse = throttle(() => {
        let { mouseX, mouseY } = p
        if (mouseX < 0 || mouseX > props.width || mouseY < 0 || mouseY > props.height) return

        let newsite = new ParticleWithColor(mouseX, mouseY, {
            radius: 10,
            edges: {
                left: bbox.xl,
                right: bbox.xr,
                top: bbox.yt,
                bottom: bbox.yb,
            },
        })

        newsite.color = palette[++colorindex % palette.length]
        sites.push(newsite)
    }, 50)

    p.keyPressed = (e: KeyboardEvent) => {
        // console.log('key', p.key, e.target)
        if (e.target !== document.body) return
        if (p.key === ' ') {
            palette = [...p.random(palettes)]
            palette = p.shuffle(palette)
            bg = palette.pop() ?? ''
            // setSites()
            recolor()
        } else if (parseInt(p.key)) {
            setSites(parseInt(p.key) * 10)
        } else if (p.key === 'r') {
            setSites()
        }
    }
}, document.getElementById('sketch') ?? undefined)
