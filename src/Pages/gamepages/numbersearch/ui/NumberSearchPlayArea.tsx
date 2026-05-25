import type { RefObject } from 'react'
import { BOARD_DEFAULT_HEIGHT } from '../config'
import type { GameState, NumberSearchStats, NumberTileData } from '../types'
import { NumberSearchReadyState } from './NumberSearchReadyState'
import { NumberSearchResultState } from './NumberSearchResultState'
import { NumberTile } from './NumberTile'

type NumberSearchPlayAreaProps = {
  areaRef: RefObject<HTMLDivElement | null>
  gameState: GameState
  tiles: NumberTileData[]
  stats: NumberSearchStats
  onStart: () => void
  onStop: () => void
  onTileClick: (value: number) => void
  onRetry: () => void
  onBack: () => void
}

// ส่วนแสดงสนามเล่น Number Search
// เปลี่ยนหน้า UI ตามสถานะ ready, running, finished
export function NumberSearchPlayArea({
  areaRef,
  gameState,
  tiles,
  stats,
  onStart,
  onStop,
  onTileClick,
  onRetry,
  onBack,
}: NumberSearchPlayAreaProps) {
  return (
    <div
      ref={areaRef}
      className="sp-game-grid-bg relative w-full overflow-hidden rounded-sp-card border-2 border-sp-border shadow-2xl"
      style={{ height: BOARD_DEFAULT_HEIGHT }}
    >
      {gameState === 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
          <NumberSearchReadyState onStart={onStart} />
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

          {tiles.map((tile) => (
            <NumberTile
              key={tile.id}
              tile={tile}
              onClick={onTileClick}
            />
          ))}
        </>
      )}

      {gameState === 'finished' && (
        <div className="absolute inset-0 overflow-y-auto px-6 py-10 text-center md:px-10">
          <NumberSearchResultState
            stats={stats}
            onRetry={onRetry}
            onBack={onBack}
          />
        </div>
      )}
    </div>
  )
}