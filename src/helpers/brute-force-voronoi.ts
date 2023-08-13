import p5 from 'p5'

export const bruteForceVoronoi = (p: p5, points: p5.Vector[]) => {
    let { width, height } = p

    p.fill(0)
    p.noStroke()
    points.forEach((point) => {
        p.ellipse(point.x, point.y, 10, 10)
    })

    p.loadPixels()
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let minDistance = Infinity
            let minIndex = 0

            points.forEach((point, index) => {
                let distance = p.dist(x, y, point.x, point.y)
                if (distance < minDistance) {
                    minDistance = distance
                    minIndex = index
                }
            })

            let c = p.color((minIndex / points.length) * 255)
            p.set(x, y, c)
        }
    }

    p.updatePixels()
}
