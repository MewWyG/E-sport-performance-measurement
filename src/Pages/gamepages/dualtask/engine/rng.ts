export type Rng = () => number

export function createRng(seed: number): Rng {
  let state = seed >>> 0

  return function rng() {
    state += 0x6d2b79f5

    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function randomInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function randomFloat(rng: Rng, min: number, max: number): number {
  return rng() * (max - min) + min
}