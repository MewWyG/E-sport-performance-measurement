import { PERCENT_SCALE } from '../config'

// คำนวณความแม่นยำเป็นเปอร์เซ็นต์ โดยใช้จำนวน hits เทียบกับ attempts ทั้งหมด
export function calculateAccuracy(
  hits: number,
  misses: number,
  wrongClicks: number,
) {
  const totalAttempts = hits + misses + wrongClicks

  if (totalAttempts === 0) {
    return PERCENT_SCALE
  }

  return Math.round((hits / totalAttempts) * PERCENT_SCALE)
}

// คำนวณเวลาเฉลี่ยต่อการยิงโดนหนึ่งครั้ง
export function calculateAverageResponseTime(
  totalResponseTime: number,
  hits: number,
) {
  if (hits <= 0) {
    return 0
  }

  return Math.round(totalResponseTime / hits)
}