import type { RefObject } from 'react'
import type {
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
  targets: MovingTarget[]
  stats: MovingTargetStats
  onAreaClick: () => void
  onStart: () => void
  onStop: () => void
  onTargetClick: (target: MovingTarget) => void
  onRetry: () => void
  onBack: () => void
}

export function MovingTargetPlayArea({
  areaRef,
  gameState,
  targets,
  stats,
  onAreaClick,
  onStart,
  onStop,
  onTargetClick,
  onRetry,
  onBack,
}: MovingTargetPlayAreaProps) {
  return (
    <div
      ref={areaRef}
      onClick={() => {
        if (gameState !== 'running') {
          return
        }

        onAreaClick()
      }}
      className="sp-game-grid-bg relative flex min-h-[520px] cursor-crosshair select-none items-center justify-center overflow-hidden rounded-sp-card border-2 border-sp-border p-8 text-center shadow-2xl"
    >
      {gameState === 'ready' && (
        <MovingTargetReadyState onStart={onStart} />
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
            หยุดเกม
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
        <MovingTargetResultState
          stats={stats}
          onRetry={onRetry}
          onBack={onBack}
        />
      )}
    </div>
  )
}