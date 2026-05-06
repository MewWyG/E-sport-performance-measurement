import { useEffect, useRef, useState } from 'react'
import { WRONG_CLICK_LIMIT } from '../config'
import { getLevelConfig } from '../engine/difficulty'
import { createNumberSet } from '../engine/numberFactory'
import { createNumberTiles } from '../engine/placement'
import {
  calculateAverageFindTime,
  calculateScore,
} from '../engine/scoring'
import type {
  GameState,
  NumberSearchStats,
  NumberTileData,
} from '../types'

export function useNumberSearchGame() {
  const intervalRef = useRef<number | null>(null)

  const gameStateRef = useRef<GameState>('ready')
  const levelRef = useRef(1)
  const completedLevelsRef = useRef(0)
  const correctClicksRef = useRef(0)
  const wrongClicksRef = useRef(0)
  const totalNumbersShownRef = useRef(0)
  const totalFindTimeRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)
  const targetStartedAtRef = useRef<number | null>(null)
  const answerSequenceRef = useRef<number[]>([])
  const clickedNumbersRef = useRef<number[]>([])
  const currentIndexRef = useRef(0)

  const [gameState, setGameState] = useState<GameState>('ready')
  const [level, setLevel] = useState(1)
  const [completedLevels, setCompletedLevels] = useState(0)
  const [tiles, setTiles] = useState<NumberTileData[]>([])
  const [clickedNumbers, setClickedNumbers] = useState<number[]>([])
  const [correctClicks, setCorrectClicks] = useState(0)
  const [wrongClicks, setWrongClicks] = useState(0)
  const [totalNumbersShown, setTotalNumbersShown] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [averageFindTime, setAverageFindTime] = useState(0)
  const [score, setScore] = useState(0)

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    if (gameState !== 'running') {
      return
    }

    intervalRef.current = window.setInterval(() => {
      if (startTimeRef.current === null) {
        return
      }

      setElapsedMs(performance.now() - startTimeRef.current)
    }, 100)

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [gameState])

  function resetGame() {
    gameStateRef.current = 'ready'
    levelRef.current = 1
    completedLevelsRef.current = 0
    correctClicksRef.current = 0
    wrongClicksRef.current = 0
    totalNumbersShownRef.current = 0
    totalFindTimeRef.current = 0
    startTimeRef.current = null
    targetStartedAtRef.current = null
    answerSequenceRef.current = []
    clickedNumbersRef.current = []
    currentIndexRef.current = 0

    setLevel(1)
    setCompletedLevels(0)
    setTiles([])
    setClickedNumbers([])
    setCorrectClicks(0)
    setWrongClicks(0)
    setTotalNumbersShown(0)
    setElapsedMs(0)
    setAverageFindTime(0)
    setScore(0)
  }

  function startGame() {
    resetGame()

    const now = performance.now()

    startTimeRef.current = now
    gameStateRef.current = 'running'
    setGameState('running')

    startLevel(1, now)
  }

  function stopGame() {
    finishGame()
  }

  function finishGame(now = performance.now()) {
    gameStateRef.current = 'finished'

    if (startTimeRef.current !== null) {
      setElapsedMs(now - startTimeRef.current)
    }

    setGameState('finished')
  }

  function startLevel(nextLevel: number, now = performance.now()) {
    const levelConfig = getLevelConfig(nextLevel)

    const answerSequence = createNumberSet(
      levelConfig.numberPoolMax,
      levelConfig.playCount,
    )

    const nextTiles = createNumberTiles(answerSequence, nextLevel)

    levelRef.current = nextLevel
    answerSequenceRef.current = answerSequence
    clickedNumbersRef.current = []
    currentIndexRef.current = 0
    targetStartedAtRef.current = now
    totalNumbersShownRef.current += answerSequence.length

    setLevel(nextLevel)
    setTiles(nextTiles)
    setClickedNumbers([])
    setTotalNumbersShown(totalNumbersShownRef.current)
  }

  function handleTileClick(value: number) {
    if (gameStateRef.current !== 'running') {
      return
    }

    const expectedValue = answerSequenceRef.current[currentIndexRef.current]
    const now = performance.now()

    if (value !== expectedValue) {
      const nextWrongClicks = wrongClicksRef.current + 1

      wrongClicksRef.current = nextWrongClicks
      setWrongClicks(nextWrongClicks)
      updateScore()

      if (nextWrongClicks >= WRONG_CLICK_LIMIT) {
        finishGame(now)
      }

      return
    }

    const targetStartedAt = targetStartedAtRef.current ?? now
    const responseTime = now - targetStartedAt
    const nextCorrectClicks = correctClicksRef.current + 1
    const nextClickedNumbers = [...clickedNumbersRef.current, value]

    correctClicksRef.current = nextCorrectClicks
    clickedNumbersRef.current = nextClickedNumbers
    totalFindTimeRef.current += responseTime

    setCorrectClicks(nextCorrectClicks)
    setClickedNumbers(nextClickedNumbers)
    setAverageFindTime(
      calculateAverageFindTime(
        totalFindTimeRef.current,
        nextCorrectClicks,
      ),
    )

    setTiles((currentTiles) =>
      currentTiles.map((tile) =>
        tile.value === value ? { ...tile, isCleared: true } : tile,
      ),
    )

    const nextIndex = currentIndexRef.current + 1
    const answerSequence = answerSequenceRef.current

    if (nextIndex >= answerSequence.length) {
      const nextCompletedLevels = completedLevelsRef.current + 1
      const nextLevel = levelRef.current + 1

      completedLevelsRef.current = nextCompletedLevels
      setCompletedLevels(nextCompletedLevels)

      updateScore(nextLevel)
      startLevel(nextLevel, now)

      return
    }

    currentIndexRef.current = nextIndex
    targetStartedAtRef.current = now
    updateScore()
  }

  function updateScore(levelOverride = levelRef.current) {
    setScore(
      calculateScore({
        correctClicks: correctClicksRef.current,
        levelReached: levelOverride,
        wrongClicks: wrongClicksRef.current,
      }),
    )
  }

  const stats: NumberSearchStats = {
    levelReached: level,
    completedLevels,
    correctClicks,
    wrongClicks,
    totalNumbersShown,
    elapsedMs,
    averageFindTime,
    score,
  }

  return {
    gameState,
    level,
    tiles,
    clickedNumbers,
    correctClicks,
    wrongClicks,
    elapsedMs,
    averageFindTime,
    score,
    stats,
    startGame,
    stopGame,
    handleTileClick,
  }
}