import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import {
  BOARD_DEFAULT_HEIGHT,
  BOARD_DEFAULT_WIDTH,
  BOARD_MIN_HEIGHT,
  BOARD_MIN_WIDTH,
  MAX_NUMBER_SEARCH_LEVEL,
} from '../config'
import { getLevelConfig } from '../engine/difficulty'
import { createNumberSet } from '../engine/numberFactory'
import { createNumberTiles } from '../engine/placement'
import {
  calculateAverageFindTime,
  calculateScore,
} from '../engine/scoring'
import type {
  GameState,
  NumberSearchInputEvent,
  NumberSearchLevelEvent,
  NumberSearchStats,
  NumberSearchTargetEvent,
  NumberTileData,
} from '../types'

type UseNumberSearchGameParams = {
  areaRef: RefObject<HTMLDivElement | null>
}

export function useNumberSearchGame({ areaRef }: UseNumberSearchGameParams) {
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
  const levelStartedAtRef = useRef<number | null>(null)

  const levelCorrectStartRef = useRef(0)
  const levelWrongStartRef = useRef(0)
  const levelFindTimeStartRef = useRef(0)

  const answerSequenceRef = useRef<number[]>([])
  const clickedNumbersRef = useRef<number[]>([])
  const currentIndexRef = useRef(0)

  const tilesRef = useRef<NumberTileData[]>([])
  const targetEventsRef = useRef<NumberSearchTargetEvent[]>([])
  const inputEventsRef = useRef<NumberSearchInputEvent[]>([])
  const levelEventsRef = useRef<NumberSearchLevelEvent[]>([])

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

  const [targetEvents, setTargetEvents] = useState<
    NumberSearchTargetEvent[]
  >([])
  const [inputEvents, setInputEvents] = useState<NumberSearchInputEvent[]>([])
  const [levelEvents, setLevelEvents] = useState<NumberSearchLevelEvent[]>([])

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

  function getGameTime(now = performance.now()) {
    return startTimeRef.current === null
      ? 0
      : Math.round(now - startTimeRef.current)
  }

  function getBoardBounds() {
    const width = areaRef.current?.clientWidth ?? BOARD_DEFAULT_WIDTH
    const height = areaRef.current?.clientHeight ?? BOARD_DEFAULT_HEIGHT

    return {
      width: Math.max(width, BOARD_MIN_WIDTH),
      height: Math.max(height, BOARD_MIN_HEIGHT),
    }
  }

  function getTileByValue(value: number) {
    return tilesRef.current.find((tile) => tile.value === value)
  }

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
    levelStartedAtRef.current = null

    levelCorrectStartRef.current = 0
    levelWrongStartRef.current = 0
    levelFindTimeStartRef.current = 0

    answerSequenceRef.current = []
    clickedNumbersRef.current = []
    currentIndexRef.current = 0

    tilesRef.current = []
    targetEventsRef.current = []
    inputEventsRef.current = []
    levelEventsRef.current = []

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
    setTargetEvents([])
    setInputEvents([])
    setLevelEvents([])
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

    const nextTiles = createNumberTiles(
      answerSequence,
      nextLevel,
      getBoardBounds(),
    )

    levelRef.current = nextLevel
    answerSequenceRef.current = answerSequence
    clickedNumbersRef.current = []
    currentIndexRef.current = 0
    targetStartedAtRef.current = now
    levelStartedAtRef.current = now

    levelCorrectStartRef.current = correctClicksRef.current
    levelWrongStartRef.current = wrongClicksRef.current
    levelFindTimeStartRef.current = totalFindTimeRef.current

    totalNumbersShownRef.current += answerSequence.length
    tilesRef.current = nextTiles

    setLevel(nextLevel)
    setTiles(nextTiles)
    setClickedNumbers([])
    setTotalNumbersShown(totalNumbersShownRef.current)
  }

  function recordTargetEvent({
    clickedValue,
    responseTime,
    now,
    clickedNumbersBefore,
    clickedNumbersAfter,
    remainingNumbers,
  }: {
    clickedValue: number
    responseTime: number
    now: number
    clickedNumbersBefore: number[]
    clickedNumbersAfter: number[]
    remainingNumbers: number[]
  }) {
    const tile = getTileByValue(clickedValue)
    const targetStartedAt = targetStartedAtRef.current ?? now

    const event: NumberSearchTargetEvent = {
      level: levelRef.current,
      levelTargetCount: answerSequenceRef.current.length,
      targetOrder: currentIndexRef.current + 1,

      expectedValue: clickedValue,
      clickedValue,
      outcome: 'correct',

      responseTimeMs: Math.round(responseTime),

      clickedNumbersBefore,
      clickedNumbersAfter,
      remainingNumbers,

      xPercent: Number((tile?.xPercent ?? 0).toFixed(2)),
      yPercent: Number((tile?.yPercent ?? 0).toFixed(2)),

      targetStartedAtMs: getGameTime(targetStartedAt),
      completedAtMs: getGameTime(now),
    }

    targetEventsRef.current = [...targetEventsRef.current, event]
    setTargetEvents(targetEventsRef.current)
  }

  function recordWrongInputEvent({
    clickedValue,
    expectedValue,
    now,
    wrongClickCount,
  }: {
    clickedValue: number
    expectedValue: number
    now: number
    wrongClickCount: number
  }) {
    const tile = getTileByValue(clickedValue)

    const event: NumberSearchInputEvent = {
      eventType: 'wrong_number_click',

      level: levelRef.current,
      targetOrder: currentIndexRef.current + 1,

      expectedValue,
      clickedValue,

      wrongClickCount,

      xPercent: Number((tile?.xPercent ?? 0).toFixed(2)),
      yPercent: Number((tile?.yPercent ?? 0).toFixed(2)),

      gameTimeMs: getGameTime(now),
    }

    inputEventsRef.current = [...inputEventsRef.current, event]
    setInputEvents(inputEventsRef.current)
  }

  function recordCompletedLevelEvent(now = performance.now()) {
    const levelStartedAt = levelStartedAtRef.current ?? now

    const levelCorrectClicks =
      correctClicksRef.current - levelCorrectStartRef.current

    const levelWrongClicks =
      wrongClicksRef.current - levelWrongStartRef.current

    const levelFindTime =
      totalFindTimeRef.current - levelFindTimeStartRef.current

    const event: NumberSearchLevelEvent = {
      level: levelRef.current,
      numberCount: answerSequenceRef.current.length,

      startedAtMs: getGameTime(levelStartedAt),
      completedAtMs: getGameTime(now),
      durationMs: Math.round(now - levelStartedAt),

      correctClicks: levelCorrectClicks,
      wrongClicks: levelWrongClicks,
      averageFindTime: calculateAverageFindTime(
        levelFindTime,
        levelCorrectClicks,
      ),
    }

    levelEventsRef.current = [...levelEventsRef.current, event]
    setLevelEvents(levelEventsRef.current)
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

      recordWrongInputEvent({
        clickedValue: value,
        expectedValue,
        now,
        wrongClickCount: nextWrongClicks,
      })

      updateScore()
      return
    }

    const targetStartedAt = targetStartedAtRef.current ?? now
    const responseTime = now - targetStartedAt

    const clickedNumbersBefore = [...clickedNumbersRef.current]
    const nextClickedNumbers = [...clickedNumbersRef.current, value]

    const nextIndex = currentIndexRef.current + 1
    const answerSequence = answerSequenceRef.current
    const remainingNumbers = answerSequence.slice(nextIndex)

    const nextCorrectClicks = correctClicksRef.current + 1

    correctClicksRef.current = nextCorrectClicks
    clickedNumbersRef.current = nextClickedNumbers
    totalFindTimeRef.current += responseTime

    recordTargetEvent({
      clickedValue: value,
      responseTime,
      now,
      clickedNumbersBefore,
      clickedNumbersAfter: nextClickedNumbers,
      remainingNumbers,
    })

    setCorrectClicks(nextCorrectClicks)
    setClickedNumbers(nextClickedNumbers)
    setAverageFindTime(
      calculateAverageFindTime(
        totalFindTimeRef.current,
        nextCorrectClicks,
      ),
    )

    const nextTiles = tilesRef.current.map((tile) =>
      tile.value === value ? { ...tile, isCleared: true } : tile,
    )

    tilesRef.current = nextTiles
    setTiles(nextTiles)

    if (nextIndex >= answerSequence.length) {
      const nextCompletedLevels = completedLevelsRef.current + 1
      const currentLevel = levelRef.current
      const nextLevel = currentLevel + 1

      completedLevelsRef.current = nextCompletedLevels
      setCompletedLevels(nextCompletedLevels)

      recordCompletedLevelEvent(now)

      if (currentLevel >= MAX_NUMBER_SEARCH_LEVEL) {
        updateScore(MAX_NUMBER_SEARCH_LEVEL)
        finishGame(now)
        return
      }

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
    targetEvents,
    inputEvents,
    levelEvents,
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

    targetEvents,
    inputEvents,
    levelEvents,

    startGame,
    stopGame,
    handleTileClick,
  }
}