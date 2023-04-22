import p5 from 'p5'

const getFriction = (velocity: p5.Vector, µ = 0.01, N = 1) => {
    // µ mu = coefficient of friction (depends on material)
    // N = normal force (force perpendicular to surface... based on gravitational force)

    // friction = -1 * µ * N * v
    return velocity
        .copy()
        .mult(-1)
        .normalize()
        .mult(µ * N)
}

const getDrag = (velocity: p5.Vector, Cd = 0.1) => {
    // drag = -0.5 * ϱ * v^2 * A * Cd * v
    // rho ϱ = density of fluid  // we ignore this here
    // v^2 = speed of the object = magnitude of velocity vector
    // A = frontal area of object pushing through the liquid
    // for our purposes we consider the object is a sphere and ignore this
    // Cd = drag coefficient (like coefficient of friction)
    // v = velocity (normalized vector)
    let mag = velocity.copy().magSq() * Cd
    let drag = velocity.copy()
    drag.mult(-0.5).normalize().mult(mag)
    return drag
}

export { getFriction, getDrag }
