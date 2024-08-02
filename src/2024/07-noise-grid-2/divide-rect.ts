import { Rectangle } from '~/helpers/trig-shapes'
import { random } from '~/helpers/utils'

export type DivideRectRule =
    | 'half'
    | 'two-random'
    | 'two-thirds'
    | 'thirds-row'
    | 'quarters-grid'
    | 'four-random'

type RectDivide = (rect: Rectangle, rule: DivideRectRule) => Rectangle[]

export const divideRect: RectDivide = (rect, rule) => {
    switch (rule) {
        case 'half':
            return divideHalf(rect)
        case 'two-random':
            return divideTwoRandom(rect)
        case 'two-thirds':
            return divideTwoThirds(rect)
        case 'thirds-row':
            return divideThirdsRow(rect)
        case 'quarters-grid':
            return divideQuartersGrid(rect)
        case 'four-random':
            return divideFourRandom(rect)
    }
}

const divideHalf = (rect: Rectangle) => {
    let { x, y, width, height } = rect
    if (width > height) {
        return [
            new Rectangle(x, y, width / 2, height),
            new Rectangle(x + width / 2, y, width / 2, height),
        ]
    } else {
        return [
            new Rectangle(x, y, width, height / 2),
            new Rectangle(x, y + height / 2, width, height / 2),
        ]
    }
}

const divideTwoRandom = (rect: Rectangle) => {
    let { x, y, width, height } = rect

    if (width > height) {
        let x2 = random(x + width * 0.25, x + width - width * 0.25)
        return [new Rectangle(x, y, x2 - x, height), new Rectangle(x2, y, x + width - x2, height)]
    } else {
        let y2 = random(y + height * 0.25, y + height - height * 0.25)
        return [new Rectangle(x, y, width, y2 - y), new Rectangle(x, y2, width, y + height - y2)]
    }
}

const divideTwoThirds = (rect: Rectangle) => {
    let { x, y, width, height } = rect
    if (width > height) {
        let w1 = width * (1 / 3)
        let w2 = width - w1
        return [new Rectangle(x, y, w1, height), new Rectangle(x + w1, y, w2, height)]
    } else {
        let h1 = height * (1 / 3)
        let h2 = height - h1
        return [new Rectangle(x, y, width, h1), new Rectangle(x, y + h1, width, h2)]
    }
}

const divideThirdsRow = (rect: Rectangle) => {
    let { x, y, width, height } = rect
    if (width > height) {
        let w = width / 3
        return [
            new Rectangle(x, y, w, height),
            new Rectangle(x + w, y, w, height),
            new Rectangle(x + 2 * w, y, w, height),
        ]
    } else {
        let h = height / 3
        return [
            new Rectangle(x, y, width, h),
            new Rectangle(x, y + h, width, h),
            new Rectangle(x, y + 2 * h, width, h),
        ]
    }
}

const divideQuartersGrid = (rect: Rectangle) => {
    let { x, y, width, height } = rect
    let w = width / 2
    let h = height / 2
    return [
        new Rectangle(x, y, w, h),
        new Rectangle(x + w, y, w, h),
        new Rectangle(x, y + h, w, h),
        new Rectangle(x + w, y + h, w, h),
    ]
}

const divideFourRandom = (rect: Rectangle) => {
    let { x, y, width, height } = rect
    let point = [
        random(x + width * 0.25, x + width - width * 0.25),
        random(y + height * 0.25, y + height - height * 0.25),
    ]

    let x2 = point[0]
    let y2 = point[1]

    return [
        new Rectangle(x, y, x2 - x, y2 - y),
        new Rectangle(x2, y, x + width - x2, y2 - y),
        new Rectangle(x, y2, x2 - x, y + height - y2),
        new Rectangle(x2, y2, x + width - x2, y + height - y2),
    ]
}
