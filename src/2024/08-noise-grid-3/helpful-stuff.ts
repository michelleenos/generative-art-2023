import { Rectangle } from '~/helpers/trig-shapes'

export const getBounds = (width: number, height: number, rootSize?: number) => {
    if (!rootSize || rootSize <= 0) {
        let size = Math.min(width, height)
        return {
            bounds: new Rectangle((width - size) / 2, (height - size) / 2, size, size),
            countX: 1,
            countY: 1,
        }
    }

    let bounds = new Rectangle(0, 0, width, height)
    let countX = Math.ceil(bounds.width / rootSize)
    let countY = Math.ceil(bounds.height / rootSize)
    bounds.width = countX * rootSize
    bounds.height = countY * rootSize

    let translateX = (width - bounds.width) / 2
    let translateY = (height - bounds.height) / 2
    bounds.x = translateX
    bounds.y = translateY

    return { bounds, countX, countY }
}

/**
 * Utilities
 */

export const multBy = <T extends Record<string, number>>(obj: T, mult: number): T => {
    let newObj: T = { ...obj }

    Object.keys(obj).forEach((keyname: keyof T) => {
        if (typeof obj[keyname] === 'number') {
            newObj[keyname] = (obj[keyname] * mult) as T[keyof T]
        }
    })
    return newObj
}

export function getItems<T, K extends keyof T>(obj: T, keys: K[]): { [key in K]: T[key] } {
    let newObj = { ...obj }
    for (let key of keys) {
        newObj[key] = obj[key]
    }
    return newObj
}

// export const makeInitialGrid = (width: number, height: number, rootSize: number) => {
//     let { bounds, countX, countY } = getBounds(width, height, rootSize)

// }
