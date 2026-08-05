import GUI, { Controller } from 'lil-gui'

interface Vec3Like {
    x: number
    y: number
    z: number
}

interface Vec2Like {
    x: number
    y: number
}

interface GuiExtraItemsInt {
    listen: () => ThisType<GuiExtraItemsInt>
    decimals: (decimals: number) => ThisType<GuiExtraItemsInt>
    enable: () => ThisType<GuiExtraItemsInt>
    disable: () => ThisType<GuiExtraItemsInt>
    controllers: Controller[]
}

function isVec3Like(obj: unknown): obj is Vec3Like {
    if (typeof obj !== 'object' || obj === null) return false
    let t = obj as Vec3Like
    if (typeof t.x !== 'number') return false
    if (typeof t.y !== 'number') return false
    if (typeof t.z !== 'number') return false
    return true
}

function isVec2Like(obj: unknown): obj is Vec2Like {
    if (typeof obj !== 'object' || obj === null) return false
    let t = obj as Vec2Like
    if (typeof t.x !== 'number') return false
    if (typeof t.y !== 'number') return false
    return true
}

export class GuiExtra extends GUI {
    updateAll() {
        this.controllersRecursive().forEach((c) => c.updateDisplay())
    }

    destroyChildren() {
        this.foldersRecursive().forEach((f) => f.destroy())
        this.controllersRecursive().forEach((c) => c.destroy())
    }

    override addFolder(title: string) {
        const newFolder = new GuiExtra({ title, parent: this })
        return newFolder
    }

    forEach(cb: (c: Controller) => void) {
        this.controllersRecursive().forEach(cb)
        return this
    }

    disable() {
        this.controllersRecursive().forEach((ctrl) => ctrl.disable())
        return this
    }

    enable() {
        this.controllersRecursive().forEach((ctrl) => ctrl.enable())
        return this
    }

    listen() {
        this.controllersRecursive().forEach((c) => c.listen())
        return this
    }

    decimals(decimals: number) {
        this.controllersRecursive().forEach((c) => c.decimals(decimals))
        return this
    }

    name(title: string) {
        this.title(title)
        return this
    }

    addVec3<T>(object: T, property: keyof T, min?: number, max?: number, step?: number): GuiExtra {
        const val = object[property]
        if (!isVec3Like(val)) {
            throw new Error(`cannot add vec3 with property ${property.toString()}`)
        }

        const fold = this.addFolder(property.toString())
        fold.add(val, 'x', min, max, step)
        fold.add(val, 'y', min, max, step)
        fold.add(val, 'z', min, max, step)
        return fold
    }

    addVec2<T>(object: T, property: keyof T, min?: number, max?: number, step?: number): GuiExtra {
        const val = object[property]
        if (!isVec2Like(val)) {
            throw new Error(`cannot add vec2 with property ${property.toString()}`)
        }

        const fold = this.addFolder(property.toString())
        fold.add(val, 'x', min, max, step)
        fold.add(val, 'y', min, max, step)
        return fold
    }

    addVec2Items<T>(
        object: T,
        property: keyof T,
        min?: number,
        max?: number,
        step?: number,
    ): GuiExtraItems {
        const val = object[property]
        const strProp = property.toString()
        if (!isVec2Like(val)) {
            throw new Error(`cannot add vec2 with property ${strProp}`)
        }

        const controllers = [
            this.add(val, 'x', min, max, step).name(`${strProp}.x`),
            this.add(val, 'y', min, max, step).name(`${strProp}.y`),
        ]
        return new GuiExtraItems(controllers)
    }
}

class GuiExtraItems implements GuiExtraItemsInt {
    controllers: Controller[]
    constructor(controllers: Controller[]) {
        this.controllers = controllers
    }

    listen = () => {
        this.controllers.forEach((c) => c.listen())
        return this
    }

    decimals = (n: number) => {
        this.controllers.forEach((c) => c.decimals(n))
        return this
    }

    enable = () => {
        this.controllers.forEach((c) => c.enable())
        return this
    }

    disable = () => {
        this.controllers.forEach((c) => c.disable())
        return this
    }
}
