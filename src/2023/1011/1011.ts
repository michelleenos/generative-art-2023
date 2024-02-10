import '../../style.css'
import * as Tone from 'tone'
import { random } from '~/helpers/utils'

const notes = ['C4', 'D4', 'E4', 'G4', 'A4']

const synth = new Tone.Synth().toDestination()
var pattern = new Tone.Pattern(
    function (time, note) {
        synth.triggerAttackRelease(note, 0.25)
    },
    ['C4', 'D4', 'E4', 'G4', 'A4'],
    'randomWalk'
)

pattern.start(0)
// const loop = new Tone.Loop((time) => {
//     synth.triggerAttackRelease(random(notes), '4n', time)
// }, '4n').start(0)

document.addEventListener('click', () => {
    Tone.Transport.toggle('+0.1')
})

// var pitches = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84] // A minor pentatonic scale
