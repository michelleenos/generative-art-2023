import { Particle } from './particle'

export function howMuchIsPointingAwayFrom(particle: Particle, point: Particle) {
    let particleToPoint = point.copy().sub(particle).heading()
    let particleVelocityHeading = particle.velocity.heading()
    let difference = Math.abs(particleToPoint - particleVelocityHeading)
    if (difference > Math.PI) {
        difference = Math.PI * 2 - difference
    }

    return difference
}
