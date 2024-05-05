import { createElement } from '../dom'
import './data-view.css'

const numToString = (num: number, dec = 2, pad = 7) => num.toFixed(dec).padStart(pad, '\xa0')

type DataViewValue = number | [number, number] | boolean | string
const isDataViewValue = (val: any): val is DataViewValue => {
    return (
        typeof val === 'number' ||
        (Array.isArray(val) && val.length === 2 && val.every((v) => typeof v === 'number')) ||
        typeof val === 'string' ||
        typeof val === 'boolean'
    )
}

const writeValue = (value: DataViewValue, decimals = 2) => {
    if (typeof value === 'number') {
        return numToString(value, decimals)
    } else if (typeof value === 'boolean') {
        return value ? 'true' : 'false'
    } else if (typeof value === 'string') {
        return value
    } else {
        return value.map((v) => numToString(v, decimals)).join(' ')
    }
}

interface DataViewItem {
    el: HTMLElement
    titleEl: Element
    object: { [key: string | number]: any }
    key: string | number
    decimals?: number
}

class DataViewSection {
    el: Element
    dataEl: Element
    values: DataViewItem[] = []
    parent: DataView
    title?: string

    constructor(parent: DataView, title?: string) {
        this.parent = parent
        this.el = createElement('div', { class: 'dataview__section' })
        this.dataEl = createElement('div', { class: 'dataview__vals' })
        if (title) {
            this.title = title
            let titleEl = createElement('h2', {}, title)
            this.el.appendChild(titleEl)
        }
        this.el.appendChild(this.dataEl)
    }

    add<O extends { [key: string]: any }, K extends keyof O & string>(
        object: O,
        key: K,
        decimals = 2,
        name?: string
    ) {
        let value = object[key]
        if (!isDataViewValue(value)) {
            console.error('invalid value', value)
            return
        }
        let titleEl = createElement('div', { class: 'dataview__value-title' }, name ?? key)
        let valueEl = createElement(
            'div',
            { class: 'dataview__value' },
            writeValue(value, decimals)
        ) as HTMLElement
        this.dataEl.append(titleEl, valueEl)
        this.values.push({ el: valueEl, titleEl, object, key, decimals })
        let index = this.values.length - 1
        return index
    }

    signalTriggerAtIndex = (index: number, color?: string) => {
        let item = this.values[index]
        if (color) {
            item.el.style.setProperty('--signal-color', color)
        }
        item.el.classList.remove('dataview__value--triggered')
        item.el.classList.remove('dataview__value--triggered-out')
        item.el.classList.add('dataview__value--triggered')
        setTimeout(() => {
            item.el.classList.add('dataview__value--triggered-out')
            item.el.classList.remove('dataview__value--triggered')
        })
    }

    update = () => {
        this.values.forEach((v) => {
            v.el.innerHTML = writeValue(v.object[v.key], v.decimals)
        })
    }
}

export class DataViewSectionCustom {
    el: Element
    values: DataViewItem[] = []
    parent: DataView
    title?: string
    onUpdate: () => void

    constructor(parent: DataView, customEl: HTMLElement, onUpdate: () => void, title?: string) {
        this.parent = parent
        this.el = createElement('div', { class: 'dataview__section dataview__section--custom' })
        if (title) {
            this.title = title
            let titleEl = createElement('h2', {}, title)
            this.el.appendChild(titleEl)
        }
        this.el.appendChild(customEl)
        this.onUpdate = onUpdate
    }

    update = () => {
        this.onUpdate()
    }
}

export class DataView {
    el: Element
    sections: (DataViewSection | DataViewSectionCustom)[] = []
    toggle: Element
    _visible: boolean = true

    constructor() {
        this.toggle = createElement('button', { class: 'dataview__toggle' }, 'hide data')

        this.el = createElement('div', { class: 'dataview' }, [this.toggle])
        document.body.appendChild(this.el)

        this.toggle.addEventListener('click', this.onToggle)
    }

    show = () => {
        this.toggle.innerHTML = 'hide data'
        this.el.classList.remove('hidden')
        this._visible = true
        return this
    }

    hide = () => {
        this.toggle.innerHTML = 'show data'
        this.el.classList.add('hidden')
        this._visible = false
        return this
    }

    onToggle = () => {
        if (this._visible) {
            this.hide()
        } else {
            this.show()
        }
    }

    createSection(title?: string) {
        let section = new DataViewSection(this, title)
        this.sections.push(section)
        this.el.appendChild(section.el)
        return section
    }

    createCustomSection(customEl: HTMLElement, onUpdate: () => void, title?: string) {
        let section = new DataViewSectionCustom(this, customEl, onUpdate, title)
        this.sections.push(section)
        this.el.appendChild(section.el)
        return section
    }

    update = () => {
        if (!this._visible) return
        this.sections.forEach((s) => s.update())
    }
}
