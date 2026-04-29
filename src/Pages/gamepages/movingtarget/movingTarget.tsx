import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AppButton } from '../../../components/common/AppButton'
import { TargetIcon } from '../../../components/icons/AppIcons'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'

const TOTAL_TARGETS = 30

type GameState = 'ready' | 'running' | 'finished'

type MovementPattern = 'straight' | 'bounce' | 'random'

type MovingTarget = {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  bornAt: number
  lifetime: number
  isCorrect: boolean
  pattern: MovementPattern
  nextTurnAt: number
}

type Bounds = {
  width: number
  height: number
}

type Difficulty = {
  size: number
  speed: number
  lifetime: number
  decoyCount: number
  pattern: MovementPattern
  label: string
}

function MovingTargetGamePage() {
  const navigate = useNavigate()
  const areaRef = useRef<HTMLDivElement | null>(null)
  const animationRef = useRef<number | null>(null)

  const gameStateRef = useRef<GameState>('ready')
  const targetsRef = useRef<MovingTarget[]>([])
  const hitsRef = useRef(0)
  const missesRef = useRef(0)
  const wrongClicksRef = useRef(0)
  const totalResponseTimeRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  const [gameState, setGameState] = useState<GameState>('ready')
  const [targets, setTargets] = useState<MovingTarget[]>([])
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [wrongClicks, setWrongClicks] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)

  const totalAttempts = hits + misses + wrongClicks
  const accuracy = totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 100
  const averageResponseTime =
    hits > 0 ? Math.round(totalResponseTimeRef.current / hits) : 0

  const currentDifficulty = useMemo(() => {
    return getDifficulty(hits)
  }, [hits])

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    if (gameState !== 'running') {
      return
    }

    let lastFrameTime = performance.now()

    const tick = (now: number) => {
      if (gameStateRef.current !== 'running') {
        return
      }

      const startTime = startTimeRef.current
      if (startTime !== null) {
        setElapsedMs(now - startTime)
      }

      const deltaMs = Math.min(now - lastFrameTime, 32)
      lastFrameTime = now

      const bounds = getPlayAreaBounds()
      const updatedTargets = updateTargets(
        targetsRef.current,
        deltaMs,
        now,
        bounds,
      )

      const correctTarget = updatedTargets.find((target) => target.isCorrect)
      const isExpired =
        correctTarget !== undefined &&
        now - correctTarget.bornAt >= correctTarget.lifetime

      if (isExpired) {
        addMiss()
        spawnTargets(hitsRef.current, now)
      } else {
        targetsRef.current = updatedTargets
        setTargets(updatedTargets)
      }

      animationRef.current = requestAnimationFrame(tick)
    }

    animationRef.current = requestAnimationFrame(tick)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState])

  function getPlayAreaBounds(): Bounds {
    const width = areaRef.current?.clientWidth ?? 900
    const height = areaRef.current?.clientHeight ?? 520

    return {
      width: Math.max(width, 320),
      height: Math.max(height, 360),
    }
  }

  function resetStats() {
    hitsRef.current = 0
    missesRef.current = 0
    wrongClicksRef.current = 0
    totalResponseTimeRef.current = 0
    startTimeRef.current = null
    targetsRef.current = []

    setHits(0)
    setMisses(0)
    setWrongClicks(0)
    setElapsedMs(0)
    setTargets([])
  }

  function startGame() {
    resetStats()

    const now = performance.now()
    startTimeRef.current = now
    gameStateRef.current = 'running'

    setGameState('running')
    spawnTargets(0, now)
  }

  function finishGame(now = performance.now()) {
    gameStateRef.current = 'finished'
    targetsRef.current = []

    setTargets([])
    setElapsedMs(startTimeRef.current === null ? 0 : now - startTimeRef.current)
    setGameState('finished')
  }

  function spawnTargets(currentHits: number, now = performance.now()) {
    const bounds = getPlayAreaBounds()
    const difficulty = getDifficulty(currentHits)
    const nextTargets = createTargets(difficulty, bounds, now)

    targetsRef.current = nextTargets
    setTargets(nextTargets)
  }

  function addMiss() {
    missesRef.current += 1
    setMisses(missesRef.current)
  }

  function addWrongClick() {
    wrongClicksRef.current += 1
    setWrongClicks(wrongClicksRef.current)
  }

  function handleAreaClick() {
    if (gameStateRef.current !== 'running') {
      return
    }

    addMiss()
  }

  function handleTargetClick(
    event: React.MouseEvent<HTMLButtonElement>,
    target: MovingTarget,
  ) {
    event.stopPropagation()

    if (gameStateRef.current !== 'running') {
      return
    }

    const now = performance.now()

    if (!target.isCorrect) {
      addWrongClick()
      return
    }

    const nextHits = hitsRef.current + 1
    hitsRef.current = nextHits
    totalResponseTimeRef.current += now - target.bornAt

    setHits(nextHits)

    if (nextHits >= TOTAL_TARGETS) {
      finishGame(now)
      return
    }

    spawnTargets(nextHits, now)
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-sp-page flex-grow px-6 py-8 md:px-12 md:py-12">
        <section className="animate-sp-fade-in mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link
              to="/gameinfo/movingtarget"
              className="group inline-flex w-fit items-center gap-2 text-sp-text-muted transition-colors hover:text-sp-text"
            >
              <svg
                className="h-5 w-5 transition-transform group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>กลับไปหน้ารายละเอียดเกม</span>
            </Link>

            <div className="w-fit rounded-sp-pill border border-sp-primary/20 bg-sp-primary/10 px-4 py-2 font-mono text-sm font-bold uppercase tracking-widest text-sp-primary-hover">
              Moving Target
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard label="เป้าหมาย" value={`${hits}/${TOTAL_TARGETS}`} />
            <StatCard label="พลาด" value={`${misses}`} />
            <StatCard label="คลิกผิด" value={`${wrongClicks}`} />
            <StatCard label="ความแม่นยำ" value={`${accuracy}%`} />
            <StatCard label="เวลา" value={formatTime(elapsedMs)} />
          </div>

          <div
            ref={areaRef}
            onClick={handleAreaClick}
            className="relative flex min-h-[520px] cursor-crosshair select-none items-center justify-center overflow-hidden rounded-sp-card border-2 border-sp-border bg-sp-glass p-8 text-center shadow-2xl backdrop-blur-xl"
          >
            {gameState === 'ready' && (
              <ReadyState onStart={startGame} />
            )}

            {gameState === 'running' && (
              <>
                <div className="pointer-events-none absolute left-6 top-6 z-10 rounded-sp-pill border border-sp-border bg-sp-surface/70 px-4 py-2 text-sm font-bold text-sp-text-muted backdrop-blur-xl">
                  ระดับ: {currentDifficulty.label}
                </div>

                <div className="pointer-events-none absolute bottom-6 left-6 z-10 max-w-md text-left text-sm text-sp-text-subtle">
                  คลิกเป้าหมายหลักให้ครบ 30 เป้า ก่อนที่เป้าจะหายไป
                </div>

                {targets.map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    aria-label={target.isCorrect ? 'เป้าหมายที่ถูกต้อง' : 'เป้าหมายหลอก'}
                    onClick={(event) => handleTargetClick(event, target)}
                    className={[
                      'absolute flex items-center justify-center rounded-full transition-shadow duration-150',
                      target.isCorrect
                        ? 'border-4 border-sp-danger bg-sp-danger-soft text-sp-danger shadow-sp-brand hover:shadow-sp-brand-lg'
                        : 'border-2 border-sp-border bg-sp-surface/80 text-sp-text-subtle opacity-80',
                    ].join(' ')}
                    style={{
                      width: target.size,
                      height: target.size,
                      left: target.x - target.size / 2,
                      top: target.y - target.size / 2,
                    }}
                  >
                    {target.isCorrect ? (
                      <TargetIcon className="h-3/5 w-3/5" />
                    ) : (
                      <span className="text-lg font-black">×</span>
                    )}
                  </button>
                ))}
              </>
            )}

            {gameState === 'finished' && (
              <ResultState
                elapsedMs={elapsedMs}
                hits={hits}
                misses={misses}
                wrongClicks={wrongClicks}
                accuracy={accuracy}
                averageResponseTime={averageResponseTime}
                onRetry={startGame}
                onBack={() => navigate('/librarygame')}
              />
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 px-2 text-sm text-sp-text-subtle md:flex-row md:items-center md:justify-between">
            <span>เคล็ดลับ: คุมเมาส์ให้นิ่ง มองทิศทางเป้า และอย่าคลิกเป้าหมายหลอก</span>
            <span className="font-mono font-bold text-sp-primary-hover">
              Average Response: {averageResponseTime || '-'} ms
            </span>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

type ReadyStateProps = {
  onStart: () => void
}

function ReadyState({ onStart }: ReadyStateProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-sp-card bg-sp-danger-soft text-sp-danger shadow-sp-brand">
        <TargetIcon className="h-12 w-12" />
      </div>

      <h1 className="mb-4 text-4xl font-black text-sp-text md:text-5xl">
        เป้าเคลื่อนที่
      </h1>

      <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-sp-text-muted">
        คลิกเป้าหมายที่เคลื่อนที่ให้ครบ 30 เป้า ระดับความยากจะเพิ่มขึ้นเรื่อย ๆ
        ทั้งความเร็ว ขนาดเป้า และเป้าหมายหลอก
      </p>

      <AppButton onClick={onStart} className="px-12 py-5 text-xl">
        เริ่มเล่น
      </AppButton>
    </div>
  )
}

type ResultStateProps = {
  elapsedMs: number
  hits: number
  misses: number
  wrongClicks: number
  accuracy: number
  averageResponseTime: number
  onRetry: () => void
  onBack: () => void
}

function ResultState({
  elapsedMs,
  hits,
  misses,
  wrongClicks,
  accuracy,
  averageResponseTime,
  onRetry,
  onBack,
}: ResultStateProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sp-primary text-white shadow-sp-brand">
        <svg
          className="h-10 w-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="mb-2 text-4xl font-black text-sp-text">
        ทดสอบเสร็จสมบูรณ์!
      </h2>

      <p className="mb-8 text-sp-text-muted">
        นี่คือผลการเล่น Moving Target ของคุณ
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <ResultBox label="เวลา" value={formatTime(elapsedMs)} />
        <ResultBox label="เป้าที่โดน" value={`${hits}`} />
        <ResultBox label="ความแม่นยำ" value={`${accuracy}%`} />
        <ResultBox label="เวลาเฉลี่ย" value={`${averageResponseTime} ms`} />
        <ResultBox label="พลาด" value={`${misses}`} />
        <ResultBox label="คลิกผิด" value={`${wrongClicks}`} />
      </div>

      <div className="flex flex-col justify-center gap-4 md:flex-row">
        <AppButton onClick={onRetry} className="px-8 py-4">
          เล่นใหม่อีกครั้ง
        </AppButton>

        <AppButton
          variant="glass"
          onClick={onBack}
          className="px-8 py-4"
        >
          กลับไปคลังเกม
        </AppButton>
      </div>
    </div>
  )
}

type StatCardProps = {
  label: string
  value: string
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-sp-xl border border-sp-border bg-sp-surface/50 p-4">
      <p className="mb-1 text-xs font-semibold text-sp-text-subtle">{label}</p>
      <p className="text-xl font-black text-sp-text">{value}</p>
    </div>
  )
}

function ResultBox({ label, value }: StatCardProps) {
  return (
    <div className="rounded-sp-xl border border-sp-border bg-sp-surface/60 p-5">
      <p className="mb-1 text-sm font-semibold text-sp-text-subtle">{label}</p>
      <p className="text-xl font-black text-sp-text">{value}</p>
    </div>
  )
}

function getDifficulty(hitCount: number): Difficulty {
  const progress = Math.min(hitCount / (TOTAL_TARGETS - 1), 1)

  if (hitCount < 10) {
    return {
      size: 72 - progress * 10,
      speed: 0.08,
      lifetime: 2300,
      decoyCount: 0,
      pattern: 'straight',
      label: 'พื้นฐาน',
    }
  }

  if (hitCount < 20) {
    return {
      size: 58 - progress * 16,
      speed: 0.13,
      lifetime: 1850,
      decoyCount: 0,
      pattern: 'bounce',
      label: 'ปานกลาง',
    }
  }

  if (hitCount < 26) {
    return {
      size: 46 - progress * 10,
      speed: 0.17,
      lifetime: 1500,
      decoyCount: 1,
      pattern: 'bounce',
      label: 'ยาก',
    }
  }

  return {
    size: 38,
    speed: 0.22,
    lifetime: 1250,
    decoyCount: 2,
    pattern: 'random',
    label: 'ท้าทาย',
  }
}

function createTargets(
  difficulty: Difficulty,
  bounds: Bounds,
  now: number,
): MovingTarget[] {
  const targets: MovingTarget[] = []

  targets.push(
    createTarget({
      id: `correct-${now}`,
      isCorrect: true,
      difficulty,
      bounds,
      now,
    }),
  )

  for (let i = 0; i < difficulty.decoyCount; i += 1) {
    targets.push(
      createTarget({
        id: `decoy-${i}-${now}`,
        isCorrect: false,
        difficulty: {
          ...difficulty,
          size: Math.max(difficulty.size * 0.9, 28),
          speed: difficulty.speed * 0.85,
          lifetime: difficulty.lifetime,
        },
        bounds,
        now,
      }),
    )
  }

  return targets
}

type CreateTargetParams = {
  id: string
  isCorrect: boolean
  difficulty: Difficulty
  bounds: Bounds
  now: number
}

function createTarget({
  id,
  isCorrect,
  difficulty,
  bounds,
  now,
}: CreateTargetParams): MovingTarget {
  const safeSize = Math.max(difficulty.size, 28)
  const halfSize = safeSize / 2

  const x = randomBetween(halfSize + 8, bounds.width - halfSize - 8)
  const y = randomBetween(halfSize + 8, bounds.height - halfSize - 8)

  const angle = Math.random() * Math.PI * 2
  const speedMultiplier = isCorrect ? 1 : 0.8
  const speed = difficulty.speed * speedMultiplier

  return {
    id,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: safeSize,
    bornAt: now,
    lifetime: difficulty.lifetime,
    isCorrect,
    pattern: difficulty.pattern,
    nextTurnAt: now + randomBetween(450, 850),
  }
}

function updateTargets(
  targets: MovingTarget[],
  deltaMs: number,
  now: number,
  bounds: Bounds,
): MovingTarget[] {
  return targets.map((target) => {
    let { x, y, vx, vy, nextTurnAt } = target

    if (target.pattern === 'random' && now >= nextTurnAt) {
      const speed = Math.max(Math.hypot(vx, vy), 0.08)
      const angle = Math.random() * Math.PI * 2

      vx = Math.cos(angle) * speed
      vy = Math.sin(angle) * speed
      nextTurnAt = now + randomBetween(380, 700)
    }

    x += vx * deltaMs
    y += vy * deltaMs

    const halfSize = target.size / 2

    if (x <= halfSize) {
      x = halfSize
      vx = Math.abs(vx)
    }

    if (x >= bounds.width - halfSize) {
      x = bounds.width - halfSize
      vx = -Math.abs(vx)
    }

    if (y <= halfSize) {
      y = halfSize
      vy = Math.abs(vy)
    }

    if (y >= bounds.height - halfSize) {
      y = bounds.height - halfSize
      vy = -Math.abs(vy)
    }

    return {
      ...target,
      x,
      y,
      vx,
      vy,
      nextTurnAt,
    }
  })
}

function randomBetween(min: number, max: number) {
  if (max <= min) {
    return min
  }

  return Math.random() * (max - min) + min
}

function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(milliseconds / 1000, 0)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`
  }

  return `${seconds.toFixed(1)}s`
}

export default MovingTargetGamePage