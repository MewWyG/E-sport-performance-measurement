import { TargetIcon } from '../../../../components/icons/AppIcons'
import type { MovingTarget } from '../types'

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
      className={[
        'absolute flex items-center justify-center rounded-full transition-shadow duration-150',
        target.isCorrect
          ? 'border-4 border-sp-danger bg-sp-danger-soft text-sp-danger shadow-sp-brand hover:shadow-sp-brand-lg'
          : 'border-2 border-sp-border bg-sp-surface/80 text-sp-text-subtle opacity-80',
      ].join(' ')}
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
        <span className="text-lg font-black">×</span>
      )}
    </button>
  )
}