type TextOrElement = string | Element
type ElContent = TextOrElement | TextOrElement[]
type ElAtts = Record<string, string | number>

export const append = (el: Element, child: TextOrElement) => {
    if (typeof child === 'string') {
        el.innerHTML += child
    } else {
        el.appendChild(child)
    }
}

export const atts = (el: Element, props: ElAtts) => {
    Object.entries(props).forEach(([key, value]) => {
        el.setAttribute(key, value.toString())
    })
}

const isAtts = (item?: ElAtts | ElContent): item is ElAtts => {
    if (!item) return false
    return typeof item === 'object' && !Array.isArray(item) && !(item instanceof Element)
}

const isContent = (item?: ElAtts | ElContent): item is ElContent => {
    if (!item) return false
    return typeof item === 'string' || Array.isArray(item) || item instanceof Element
}

export function createElement(tag?: string): Element
// export function createElement(tag?: string, content?: ElContent): Element
export function createElement(tag?: string, atts?: ElAtts, content?: ElContent): Element
export function createElement(tag?: string, content?: ElContent, atts?: ElAtts): Element
export function createElement(
    tag: string = 'div',
    param1?: ElAtts | ElContent,
    param2?: ElAtts | ElContent
) {
    const el = document.createElement(tag)

    let attributes: ElAtts | undefined
    let content: ElContent | undefined

    if (isContent(param1)) {
        content = param1
    } else if (isAtts(param1)) {
        attributes = param1
    }

    if (isContent(param2)) {
        content = param2
    } else if (isAtts(param2)) {
        attributes = param2
    }

    if (attributes) {
        atts(el, attributes)
    }

    console.log({ attributes, content })

    if (content) {
        if (Array.isArray(content)) {
            content.forEach((c) => append(el, c))
        } else {
            append(el, content)
        }
    }

    return el
}
