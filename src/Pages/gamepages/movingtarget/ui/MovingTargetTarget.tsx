import { TargetIcon } from '../../../../components/icons/AppIcons'
import type { MovingTarget } from '../types'

// ปุ่มเป้าหมายในสนามเล่น จะแสดงต่างกันระหว่างเป้าจริงและเป้าหลอก
type MovingTargetTargetProps = {
  target: MovingTarget
  onClick: (target: MovingTarget) => void
}

export function MovingTargetTarget({
  target,
  onClick,
}: MovingTargetTargetProps) {
  return (
    <button
      type="button"
      aria-label={target.isCorrect ? 'เป้าหมายที่ถูกต้อง' : 'เป้าหมายหลอก'}
      onClick={(event) => {
        event.stopPropagation()
        onClick(target)
      }}
      className="absolute flex items-center justify-center rounded-full border-4 border-sp-danger bg-sp-danger-soft text-sp-danger shadow-sp-brand transition-shadow duration-150 hover:shadow-sp-brand-lg"
      style={{
        width: target.size,
        height: target.size,
        left: target.x - target.size / 2,
        top: target.y - target.size / 2,
      }}
    >
      {target.isCorrect ? (
        <TargetIcon className="h-3/5 w-3/5" />
      ) : (
        <DecoyXMark />
      )}
    </button>
  )
}

// เฟืองเครื่องหมาย X สำหรับแสดงเป้าหลอก
function DecoyXMark() {
  return (
    <span className="relative block h-3/5 w-3/5" aria-hidden="true">
      <span className="absolute left-1/2 top-1/2 block h-[18%] w-full -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-current" />
      <span className="absolute left-1/2 top-1/2 block h-[18%] w-full -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
    </span>
  )
}