import { TILE_SIZE } from '../config'
import type { NumberTileData } from '../types'

type NumberTileProps = {
  tile: NumberTileData
  onClick: (value: number) => void
}

// ปุ่มตัวเลขหนึ่งตัวบนกระดาน ถ้า cleared จะไม่แสดง
export function NumberTile({ tile, onClick }: NumberTileProps) {
  if (tile.isCleared) {
    return null
  }

  return (
    <button
      type="button"
      aria-label={`ตัวเลข ${tile.value}`}
      onClick={(event) => {
        event.stopPropagation()
        onClick(tile.value)
      }}
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sp-xl border border-sp-border bg-sp-surface/90 text-xl font-black text-sp-text shadow-sp-brand transition-transform hover:scale-110 hover:border-sp-primary hover:text-sp-primary"
      style={{
        left: `${tile.xPercent}%`,
        top: `${tile.yPercent}%`,
        width: TILE_SIZE,
        height: TILE_SIZE,
      }}
    >
      {tile.value}
    </button>
  )
}