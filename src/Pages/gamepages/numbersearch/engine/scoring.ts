import { NUMBER_SEARCH_SCORE_CONFIG } from '../config'

// คำนวณเวลาเฉลี่ยในการค้นหาต่อการคลิกถูกหนึ่งครั้ง
export function calculateAverageFindTime(
  totalFindTime: number,
  correctClicks: number,
) {
  if (correctClicks <= 0) {
    return 0
  }

  return Math.round(totalFindTime / correctClicks)
}

// คำนวณคะแนนรวมของเกมจากการคลิกถูก เลเวลที่จบ และเวลาตอบสนอง
export function calculateScore({
  correctClicks,
  completedLevels,
  wrongClicks,
  averageFindTime,
}: {
  correctClicks: number
  completedLevels: number
  wrongClicks: number
  averageFindTime: number
}) {
  const baseScore =
    correctClicks * NUMBER_SEARCH_SCORE_CONFIG.correctClickPoints +
    completedLevels * NUMBER_SEARCH_SCORE_CONFIG.completedLevelBonus -
    wrongClicks * NUMBER_SEARCH_SCORE_CONFIG.wrongClickPenalty

  const timeBonus = calculateTimeBonus(averageFindTime)

  return Math.max(
    baseScore + timeBonus,
    NUMBER_SEARCH_SCORE_CONFIG.minScore,
  )
}

// คำนวณโบนัสคะแนนตามเวลาเฉลี่ยที่เร็วกว่าค่าตั้งเป้า
function calculateTimeBonus(averageFindTime: number) {
  if (!NUMBER_SEARCH_SCORE_CONFIG.enableTimeBonus) {
    return 0
  }

  if (averageFindTime <= 0) {
    return 0
  }

  const fasterByMs =
    NUMBER_SEARCH_SCORE_CONFIG.targetAverageFindTimeMs - averageFindTime

  if (fasterByMs <= 0) {
    return 0
  }

  const bonusSteps = Math.floor(
    fasterByMs / NUMBER_SEARCH_SCORE_CONFIG.timeBonusStepMs,
  )

  const bonus =
    bonusSteps * NUMBER_SEARCH_SCORE_CONFIG.timeBonusPer100MsFaster

  return Math.min(bonus, NUMBER_SEARCH_SCORE_CONFIG.maxTimeBonus)
}