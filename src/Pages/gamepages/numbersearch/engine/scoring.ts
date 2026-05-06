export function calculateAverageFindTime(
  totalFindTime: number,
  correctClicks: number,
) {
  if (correctClicks <= 0) {
    return 0
  }

  return Math.round(totalFindTime / correctClicks)
}

export function calculateScore({
  correctClicks,
  levelReached,
  wrongClicks,
}: {
  correctClicks: number
  levelReached: number
  wrongClicks: number
}) {
  return Math.max(
    correctClicks * 100 + levelReached * 500 - wrongClicks * 300,
    0,
  )
}