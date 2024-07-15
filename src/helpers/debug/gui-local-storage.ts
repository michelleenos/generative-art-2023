import GUI, { type Controller } from 'lil-gui'

type GuiAddParams = [
    Parameters<typeof GUI.prototype.add>[2]?,
    Parameters<typeof GUI.prototype.add>[3]?,
    Parameters<typeof GUI.prototype.add>[4]?
]

export class GuiWithLocalStorage {
    gui: GUI
    storedVals: Record<string, any> = {}
    storageKey: string
    children: GuiWithLocalStorage[] = []
    defaultVals: Record<string, any> = {}

    constructor(storageKey: string, gui?: GUI) {
        this.gui = gui || new GUI()
        this.storageKey = storageKey
        this.storedVals = localStorage.getItem(storageKey)
            ? JSON.parse(localStorage.getItem(storageKey)!)
            : {}

        this.gui.onChange((e) => {
            let parent = e.controller.parent
            if (parent === this.gui) {
                let lsKey = e.controller.domElement.getAttribute('data-ls-key')
                if (lsKey) {
                    this.storedVals[lsKey] = e.value
                    this.setStorage()
                }
            }
        })

        this.setExpandCollapse()
    }

    setExpandCollapse = () => {
        if (this.storedVals['expanded']) {
            this.gui.open()
        } else {
            this.gui.close()
        }

        this.gui.onOpenClose(() => {
            console.log('openclose')
            this.storedVals['expanded'] = !this.gui._closed
            this.setStorage()
        })
    }

    add = (
        obj: { [key: string]: any },
        key: string,
        params: GuiAddParams = [],
        lsKey: string = key,
        useStored = true
    ): Controller => {
        if (useStored && this.storedVals.hasOwnProperty(lsKey)) {
            this.defaultVals[key] = obj[key]
            obj[key] = this.storedVals[lsKey]
        } else {
            this.storedVals[lsKey] = obj[key]
            this.setStorage()
        }

        let controller = this.gui.add(obj, key, ...params).name(lsKey)
        controller.domElement.setAttribute('data-ls-key', lsKey)

        return controller
    }

    //    addColor = (obj: { [key: string]: any }, key: string, lsKey: string = key) => {
    //       if (this.storedVals.hasOwnProperty(lsKey)) {
    //          obj[key] = new THREE.Color(this.storedVals[lsKey])
    //       } else {
    //          this.storedVals[lsKey] = `#${obj[key].getHexString()}`
    //          this.setStorage()
    //       }

    //       let debg = {
    //          [key]: obj[key].getHexString(),
    //       }
    //       let controller = this.gui
    //          .addColor(debg, key)
    //          .name(lsKey)
    //          .onChange((v: string) => {
    //             obj[key] = new THREE.Color(v)
    //          })
    //       controller.domElement.setAttribute('data-ls-key', lsKey)
    //       return controller
    //    }

    addFolder = (title: string) => {
        let folder = this.gui.addFolder(title)
        let folderGui = new GuiWithLocalStorage(`${this.storageKey}-${title}`, folder)
        this.children.push(folderGui)
        return folderGui
    }

    setStorage = () => {
        localStorage.setItem(this.storageKey, JSON.stringify(this.storedVals))
    }

    resetVals = (reload = true) => {
        this.storedVals = {}
        this.setStorage()
        this.children.forEach((child) => child.resetVals(false))
        // if (reload) window.location.reload()
        this.gui.controllersRecursive().forEach((c) => {
            if (this.defaultVals.hasOwnProperty(c.property)) {
                let parent = c.parent
                if (parent === this.gui) {
                    let lsKey = c.domElement.getAttribute('data-ls-key')
                    if (lsKey) {
                        c.setValue(this.defaultVals[c.property])
                    }
                }
            }
        })
    }

    exportVals = () => {
        let d = new Date()
        let dateTime = `${d.getMonth() + 1}${d.getDate()}${d.getHours()}${d.getMinutes()}`
        let saved = this.gui.save()
        let str = JSON.stringify(saved, null, 2)
        let blob = new Blob([str], { type: 'application/json' })
        let url = URL.createObjectURL(blob)
        let a = document.createElement('a')
        a.href = url
        a.download = `${this.storageKey}-${dateTime}.json`
        a.click()
    }
}
