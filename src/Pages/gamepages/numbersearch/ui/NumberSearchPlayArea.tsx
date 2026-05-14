import type { RefObject } from 'react'
import { BOARD_MIN_HEIGHT } from '../config'
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
      className="sp-game-grid-bg relative flex select-none items-center justify-center overflow-hidden rounded-sp-card border-2 border-sp-border p-8 text-center shadow-2xl"
      style={{ minHeight: BOARD_MIN_HEIGHT }}
    >
      {gameState === 'ready' && (
        <NumberSearchReadyState onStart={onStart} />
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
        <NumberSearchResultState
          stats={stats}
          onRetry={onRetry}
          onBack={onBack}
        />
      )}
    </div>
  )
}