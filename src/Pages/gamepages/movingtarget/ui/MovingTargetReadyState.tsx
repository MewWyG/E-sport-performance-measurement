import { AppButton } from '../../../../components/common/AppButton'
import { TargetIcon } from '../../../../components/icons/AppIcons'
import { GAME_MODE_CONFIG, TOTAL_TARGETS } from '../config'
import type { GameMode } from '../types'

// หน้าจอเริ่มเกมให้เลือกโหมด และปุ่มเริ่มเล่น
type MovingTargetReadyStateProps = {
  selectedMode: GameMode
  onModeChange: (mode: GameMode) => void
  onStart: () => void
}

const modes: GameMode[] = ['easy', 'normal', 'hard']

export function MovingTargetReadyState({
  selectedMode,
  onModeChange,
  onStart,
}: MovingTargetReadyStateProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-sp-card bg-sp-danger-soft text-sp-danger shadow-sp-brand">
        <TargetIcon className="h-12 w-12" />
      </div>

      <h1 className="mb-4 text-4xl font-black text-sp-text md:text-5xl">
        เป้าเคลื่อนที่
      </h1>

      <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-sp-text-muted">
        เกมจะมีเป้าหมายจริงเกิดทั้งหมด {TOTAL_TARGETS} เป้า
        โดยระบบจะควบคุมระยะการเกิดและระยะการเคลื่อนที่ของเป้า
        เพื่อให้ผู้เล่นเจอความยากใกล้เคียงกันมากขึ้น
      </p>

      <div className="mx-auto mb-8 grid max-w-2xl grid-cols-1 gap-3 md:grid-cols-3">
        {modes.map((mode) => {
          const isActive = selectedMode === mode
          const modeConfig = GAME_MODE_CONFIG[mode]

          return (
            <button
              key={mode}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onModeChange(mode)
              }}
              className={[
                'rounded-sp-xl border p-4 text-left transition-all',
                isActive
                  ? 'border-sp-primary bg-sp-primary/10 shadow-sp-brand'
                  : 'border-sp-border bg-sp-surface/50 hover:border-sp-primary/60',
              ].join(' ')}
            >
              <p
                className={[
                  'mb-1 text-sm font-black uppercase tracking-widest',
                  isActive ? 'text-sp-primary-hover' : 'text-sp-text-muted',
                ].join(' ')}
              >
                {modeConfig.label}
              </p>

              <p className="text-sm leading-relaxed text-sp-text-subtle">
                {getModeDescription(mode)}
              </p>
            </button>
          )
        })}
      </div>

      <AppButton
        onClick={(event) => {
          event.stopPropagation()
          onStart()
        }}
        className="px-12 py-5 text-xl"
      >
        เริ่มเล่น
      </AppButton>
    </div>
  )
}

// คืนคำอธิบายสั้นๆ ของแต่ละโหมดเกม
function getModeDescription(mode: GameMode) {
  if (mode === 'easy') {
    return 'เป้าใหญ่กว่า เคลื่อนที่ช้ากว่า และมีเวลาให้ตอบสนองมากขึ้น'
  }

  if (mode === 'hard') {
    return 'เป้าเล็กลง เคลื่อนที่เร็วขึ้น และมีเป้าหลอกเร็วกว่า'
  }

  return 'ระดับมาตรฐาน เหมาะสำหรับการทดสอบทั่วไป'
}