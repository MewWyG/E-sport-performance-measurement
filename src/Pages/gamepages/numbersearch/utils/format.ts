import {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_MINUTE,
} from '../config'

export function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(milliseconds / MILLISECONDS_PER_SECOND, 0)
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  const seconds = totalSeconds % SECONDS_PER_MINUTE

  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`
  }

  return `${seconds.toFixed(1)}s`
}