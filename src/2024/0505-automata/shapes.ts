import p5 from 'p5'

export class Vec2 {
    x: number
    y: number

    constructor(x: number = 0, y: number = 0) {
        this.x = x
        this.y = y
    }

    add(point: Vec2 | p5.Vector) {
        this.x += point.x
        this.y += point.y
        return this
    }

    sub(point: Vec2 | p5.Vector) {
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
            this.x /= n.x
            this.y /= n.y
            return this
        }
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

    distance(point: Vec2) {
        return Math.sqrt(Math.pow(this.x - point.x, 2) + Math.pow(this.y - point.y, 2))
    }

    // limit(n: number) {
    //     // let mSq = this.x * this.x + this.y * this.y
    //     // if (mSq > n * n) {
    //     //     let m = Math.sqrt(mSq)
    //     //     this.x = (this.x / m) * n
    //     //     this.y = (this.y / m) * n
    //     // }
    // }
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

export class Circle {
    cx: number
    cy: number
    _r: number
    _rSquared: number

    constructor(cx: number, cy: number, r: number) {
        this.cx = cx
        this.cy = cy
        this._r = r
        this._rSquared = r * r
    }

    get radius() {
        return this._r
    }

    set radius(value: number) {
        this._r = value
        this._rSquared = value * value
    }

    contains(vec: Vec2): boolean
    contains(x: number, y: number): boolean
    contains(...args: [Vec2] | [number, number]) {
        if (args[0] instanceof Vec2) {
            return this.contains(args[0].x, args[0].y)
        } else {
            let distance = Math.pow(this.cx - args[0], 2) + Math.pow(this.cy - args[1], 2)
            return distance <= this._rSquared
        }
    }

    // one implementation here: https://editor.p5js.org/codingtrain/sketches/CDMjU0GIK
    // another option is find the closest corner to the center, then use contains() method with that corner
    intersectsRect(range: Rectangle) {
        let xDist = Math.abs(range.x - this.cx)
        let yDist = Math.abs(range.y - this.cy)
        if (xDist > this._r + range.width || yDist > this._r + range.height) return false
        if (xDist <= range.width || yDist <= range.height) return true
        let cornerDistance = Math.pow(xDist - range.width, 2) + Math.pow(yDist - range.height, 2)
        return cornerDistance <= this._rSquared
    }
}
