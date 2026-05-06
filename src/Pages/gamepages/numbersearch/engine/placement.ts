import type { NumberTileData } from '../types'
import { shuffleArray } from './numberFactory'

export function createNumberTiles(numbers: number[], level: number) {
  const displayNumbers = shuffleArray(numbers)
  const cells = createPlacementCells(displayNumbers.length)
  const shuffledCells = shuffleArray(cells)

  return displayNumbers.map<NumberTileData>((value, index) => {
    const cell = shuffledCells[index]

    return {
      id: `level-${level}-number-${value}`,
      value,
      xPercent: cell.xPercent,
      yPercent: cell.yPercent,
      isCleared: false,
    }
  })
}

type PlacementCell = {
  xPercent: number
  yPercent: number
}

function createPlacementCells(count: number): PlacementCell[] {
  const columns = Math.ceil(Math.sqrt(count * 1.4))
  const rows = Math.ceil(count / columns)

  const xMargin = 10
  const yMargin = 14

  const cells: PlacementCell[] = []

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      cells.push({
        xPercent:
          xMargin +
          ((column + 0.5) / columns) * (100 - xMargin * 2),
        yPercent:
          yMargin +
          ((row + 0.5) / rows) * (100 - yMargin * 2),
      })
    }
  }

  return cells
}