import p5 from 'p5'

export class Vec2 {
    x: number
    y: number

    constructor(x: number = 0, y: number = 0) {
        this.x = x
        this.y = y
    }

    add(n: number): this
    add(point: Vec2 | p5.Vector): this
    add(point: Vec2 | p5.Vector | number) {
        if (typeof point === 'number') {
            this.x += point
            this.y += point
            return this
        }
        this.x += point.x
        this.y += point.y
        return this
    }

    sub(n: number): this
    sub(point: Vec2 | p5.Vector): this
    sub(point: Vec2 | p5.Vector | number) {
        if (typeof point === 'number') {
            this.x -= point
            this.y -= point
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
            // this.x = (this.x / m) * n
            // this.y = (this.y / m) * n
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

    contains(x: number, y: number) {
        return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height
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
}
