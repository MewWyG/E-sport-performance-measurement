export function calculateAccuracy(
  hits: number,
  misses: number,
  wrongClicks: number,
) {
  const totalAttempts = hits + misses + wrongClicks

  if (totalAttempts === 0) {
    return 100
  }

  return Math.round((hits / totalAttempts) * 100)
}

export function calculateAverageResponseTime(
  totalResponseTime: number,
  hits: number,
) {
  if (hits <= 0) {
    return 0
  }

  return Math.round(totalResponseTime / hits)
}