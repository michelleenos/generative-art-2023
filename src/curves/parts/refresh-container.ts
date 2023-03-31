import { Pane } from 'tweakpane'

export default class RefreshContainer {
    private readonly pane: Pane
    private refreshing_ = false

    constructor(pane: Pane) {
        this.pane = pane
    }

    get refreshing(): boolean {
        return this.refreshing_
    }

    public refresh(): void {
        this.refreshing_ = true
        this.pane.refresh()
        this.refreshing_ = false
    }
}
