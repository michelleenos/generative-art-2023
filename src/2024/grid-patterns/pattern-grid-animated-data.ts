import { AnimatedPattern } from './pattern-grid-animated'
import { DataView } from '~/helpers/debug/data-view'

export class PatternDataView extends DataView {
    pattern: AnimatedPattern

    constructor(pattern: AnimatedPattern) {
        super()
        this.pattern = pattern

        this.setup()
    }

    setup() {
        let patternData = this.createSection('pattern')
        patternData.add(this.pattern, 'addPerSecond')
        patternData.add(this.pattern, '_addDuration')
        patternData.add(this.pattern, 'animation')

        let stepsData = this.createSection('steps')
        stepsData.add(this.pattern._steps, 'lastAdd', 0)
        stepsData.add(this.pattern._steps, 'lastLeave', 0)
        stepsData.add(this.pattern._steps, 'shouldLeave')
        stepsData.add(this.pattern._steps, 'shouldEnter')
        stepsData.add(this.pattern._steps, 'shouldWait')

        let timerData = this.createSection('timer')
        timerData.add(this.pattern.timer, 'linearProgress')
        timerData.add(this.pattern.timer, 'progress')
        timerData.add(this.pattern.timer, 'easing')
        timerData.add(this.pattern.timer, 'duration')
    }
}
