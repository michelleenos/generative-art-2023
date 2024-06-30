import p5 from 'p5'

export class Vec2 {
    x: number
    y: number

    constructor(x: number = 0, y: number = 0) {
        this.x = x
        this.y = y
    }

    add(n: number, n2?: number): this
    add(point: Vec2 | p5.Vector): this
    add(point: Vec2 | p5.Vector | number, n2?: number) {
        if (typeof point === 'number') {
            this.x += point
            this.y += typeof n2 === 'number' ? n2 : point
            return this
        }
        this.x += point.x
        this.y += point.y
        return this
    }

    sub(n: number, n2?: number): this
    sub(point: Vec2 | p5.Vector): this
    sub(point: Vec2 | p5.Vector | number, n2?: number) {
        if (typeof point === 'number') {
            this.x -= point
            this.y -= typeof n2 === 'number' ? n2 : point
            return this
        }
        this.x -= point.x
        this.y -= point.y
        return this
    }

    mult(n: number | Vec2 | p5.Vector) {
        if (n instanceof Vec2 || n instanceof p5.Vector) {
            this.x *= n.x
            this.y *= n.y
            return this
        }
        this.x *= n
        this.y *= n
        return this
    }

    div(n: number | Vec2 | p5.Vector) {
        if (n instanceof Vec2 || n instanceof p5.Vector) {
            if (n.x === 0 || n.y === 0) return this
            this.x /= n.x
            this.y /= n.y
            return this
        }
        if (n === 0) return this
        this.x /= n
        this.y /= n
        return this
    }

    magSq() {
        return this.x * this.x + this.y * this.y
    }

    mag() {
        return Math.sqrt(this.magSq())
    }

    copy() {
        return new Vec2(this.x, this.y)
    }

    setMag(mag: number) {
        this.normalize().mult(mag)
        return this
    }

    normalize() {
        let m = this.mag()
        if (m !== 0) this.mult(1 / m)
        return this
    }

    limit(n: number) {
        let mSq = this.magSq()
        if (mSq > n * n) {
            let m = Math.sqrt(mSq)
            this.div(m).mult(n)
        }
        return this
    }

    lerp(target: Vec2, amount: number) {
        this.x += (target.x - this.x) * amount
        this.y += (target.y - this.y) * amount
        return this
    }
}

export class Rectangle {
    constructor(public x: number, public y: number, public width: number, public height: number) {}

    contains(x: number, y: number): boolean
    contains(point: Vec2 | [number, number]): boolean
    contains(param1: number | Vec2 | [number, number], y?: number) {
        if (param1 instanceof Vec2) {
            return this.contains(param1.x, param1.y)
        } else if (Array.isArray(param1)) {
            let [x, y] = param1
            return (
                x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height
            )
        } else if (typeof y === 'number' && typeof param1 === 'number') {
            let x = param1
            return (
                x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height
            )
        }
        console.warn('Invalid arguments to Rectangle.contains()')
        return false
    }

    intersects(range: Rectangle | Circle) {
        if (range instanceof Rectangle) {
            return (
                this.x < range.x + range.width &&
                this.x + this.width > range.x &&
                this.y < range.y + range.height &&
                this.y + this.height > range.y
            )
        }

        return range.intersectsRect(this)
    }

    getRandom(integer = true): [number, number] {
        let x = Math.random() * (this.width - this.x) + this.x
        let y = Math.random() * (this.height - this.y) + this.y
        return integer ? [Math.floor(x), Math.floor(y)] : [x, y]
    }
}

export class Circle extends Vec2 {
    _r: number
    rSquared: number

    constructor(x: number, y: number, r: number) {
        super(x, y)
        this._r = r
        this.rSquared = r * r
    }

    get radius() {
        return this._r
    }

    set radius(value: number) {
        this._r = value
        this.rSquared = value * value
    }

    distanceFromEdge(x: number, y: number) {
        let magsq = this.copy().sub(x, y).magSq()
        return magsq > this.rSquared ? Math.sqrt(magsq) - this._r : 0
    }

    contains(x: number, y: number) {
        let distSq = Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2)
        return distSq <= this.rSquared
    }

    // one implementation here: https://editor.p5js.org/codingtrain/sketches/CDMjU0GIK
    // another option is find the closest corner to the center, then use contains() method with that corner
    intersectsRect(rect: Rectangle) {
        let xDist = Math.abs(this.x - rect.x - rect.width / 2)
        let yDist = Math.abs(this.y - rect.y - rect.height / 2)

        if (xDist > rect.width / 2 + this._r) return false
        if (yDist > rect.height / 2 + this._r) return false

        if (xDist <= rect.width / 2) return true
        if (yDist <= rect.height / 2) return true

        let dx = xDist - rect.width / 2
        let dy = yDist - rect.height / 2
        return dx * dx + dy * dy <= this.rSquared
    }

    getRandom() {
        let angle = Math.random() * Math.PI * 2
        let radius = Math.random() * this._r
        let x = this.x + Math.cos(angle) * radius
        let y = this.y + Math.sin(angle) * radius
        return [x, y]
    }
}
