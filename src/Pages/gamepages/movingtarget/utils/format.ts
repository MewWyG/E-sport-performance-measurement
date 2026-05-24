// ฟังก์ชันแปลงเวลาเป็นสตริงให้อ่านง่าย
export function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(milliseconds / 1000, 0)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`
  }

  return `${seconds.toFixed(1)}s`
}