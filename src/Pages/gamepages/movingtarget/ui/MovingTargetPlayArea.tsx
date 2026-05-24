import type { RefObject } from 'react'
import type {
  GameMode,
  GameState,
  MovingTarget,
  MovingTargetStats,
} from '../types'
import { MovingTargetReadyState } from './MovingTargetReadyState'
import { MovingTargetResultState } from './MovingTargetResultState'
import { MovingTargetTarget } from './MovingTargetTarget'

type MovingTargetPlayAreaProps = {
  areaRef: RefObject<HTMLDivElement | null>
  gameState: GameState
  selectedMode: GameMode
  targets: MovingTarget[]
  stats: MovingTargetStats
  onAreaClick: () => void
  onStart: () => void
  onStop: () => void
  onModeChange: (mode: GameMode) => void
  onTargetClick: (target: MovingTarget) => void
  onRetry: () => void
  onBack: () => void
}

// ส่วนแสดงสนามเล่นของ Moving Target
// จัดการทั้งสถานะ ready/running/finished และรับ event จากผู้เล่น
export function MovingTargetPlayArea({
  areaRef,
  gameState,
  selectedMode,
  targets,
  stats,
  onAreaClick,
  onStart,
  onStop,
  onModeChange,
  onTargetClick,
  onRetry,
  onBack,
}: MovingTargetPlayAreaProps) {
  return (
    <div
      ref={areaRef}
      onClick={() => {
        if (gameState === 'running') {
          onAreaClick()
        }
      }}
      className="sp-game-grid-bg relative min-h-[520px] cursor-crosshair select-none overflow-hidden rounded-sp-card border-2 border-sp-border shadow-2xl"
    >
      {gameState === 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
          <MovingTargetReadyState
            selectedMode={selectedMode}
            onModeChange={onModeChange}
            onStart={onStart}
          />
        </div>
      )}

      {gameState === 'running' && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onStop()
            }}
            className="absolute right-4 top-4 z-30 rounded-sp-pill border border-sp-border bg-sp-surface/80 px-4 py-2 text-sm font-bold text-sp-text-muted backdrop-blur-xl transition-colors hover:border-sp-danger hover:text-sp-danger"
          >
            จบเกม
          </button>

          {targets.map((target) => (
            <MovingTargetTarget
              key={target.id}
              target={target}
              onClick={onTargetClick}
            />
          ))}
        </>
      )}

      {gameState === 'finished' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto p-8 text-center">
          <MovingTargetResultState
            stats={stats}
            onRetry={onRetry}
            onBack={onBack}
          />
        </div>
      )}
    </div>
  )
}