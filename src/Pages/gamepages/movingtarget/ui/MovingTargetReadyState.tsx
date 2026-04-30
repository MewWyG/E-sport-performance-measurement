import { AppButton } from '../../../../components/common/AppButton'
import { TargetIcon } from '../../../../components/icons/AppIcons'
import { TOTAL_TARGETS } from '../config'

type MovingTargetReadyStateProps = {
  onStart: () => void
}

export function MovingTargetReadyState({
  onStart,
}: MovingTargetReadyStateProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-sp-card bg-sp-danger-soft text-sp-danger shadow-sp-brand">
        <TargetIcon className="h-12 w-12" />
      </div>

      <h1 className="mb-4 text-4xl font-black text-sp-text md:text-5xl">
        เป้าเคลื่อนที่
      </h1>

      <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-sp-text-muted">
        คลิกเป้าหมายที่เคลื่อนที่ให้ครบ {TOTAL_TARGETS} เป้า
        ระดับความยากจะเพิ่มขึ้นเรื่อย ๆ ทั้งความเร็ว ขนาดเป้า
        และเป้าหมายหลอก
      </p>

      <AppButton onClick={onStart} className="px-12 py-5 text-xl">
        เริ่มเล่น
      </AppButton>
    </div>
  )
}