export function calculatePercentage(part: number, total: number): number {
  if (total <= 0) return 0
  return (part / total) * 100
}

export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function calculateStability(distanceSamples: number[]): number {
  if (distanceSamples.length === 0) return 0

  const mean = calculateAverage(distanceSamples)

  const variance =
    distanceSamples.reduce((sum, value) => {
      return sum + Math.pow(value - mean, 2)
    }, 0) / distanceSamples.length

  const standardDeviation = Math.sqrt(variance)

  const stability = 100 - Math.min(standardDeviation, 100)

  return Math.max(0, stability)
}

type MultitaskScoreParams = {
  trackingAccuracy: number
  inputAccuracy: number
  avgInputReactionMs: number
  completedSequences: number
  wrongInputs: number
}

export function calculateMultitaskScore({
  trackingAccuracy,
  inputAccuracy,
  avgInputReactionMs,
  completedSequences,
  wrongInputs,
}: MultitaskScoreParams): number {
  const trackingPart = trackingAccuracy * 4.2
  const inputPart = inputAccuracy * 4.2

  const reactionPenalty = Math.min(avgInputReactionMs / 9, 130)
  const wrongPenalty = wrongInputs * 8
  const sequenceBonus = completedSequences * 10

  const score =
    trackingPart + inputPart + sequenceBonus - reactionPenalty - wrongPenalty

  return Math.max(0, Math.round(score))
}