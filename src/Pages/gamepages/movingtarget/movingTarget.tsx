import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'
import { GAME_MODE_CONFIG, TOTAL_TARGETS } from './config'
import { useMovingTargetGame } from './hooks/useMovingTargetGame'
import { MovingTargetPlayArea } from './ui/MovingTargetPlayArea'
import { MovingTargetStatCard } from './ui/MovingTargetStatCard'
import { formatTime } from './utils/format'
import { buildMovingTargetResultPayload } from './utils/resultPayload'

// หน้าจอหลักของเกม Moving Target
// รวมสถิติ แสดงสนามเล่น และส่งผลลัพธ์เมื่อจบเกม
function MovingTargetGamePage() {
  const navigate = useNavigate()
  const areaRef = useRef<HTMLDivElement | null>(null)
  const hasPreparedResultRef = useRef(false)

  // ref เพื่อป้องกันการ dispatch event ผลลัพธ์ซ้ำหลายครั้ง

  const {
    gameState,
    selectedMode,
    targets,
    hits,
    misses,
    wrongClicks,
    spawnedTargetCount,
    elapsedMs,
    accuracy,
    averageResponseTime,
    targetEvents,
    inputEvents,
    startGame,
    stopGame,
    setSelectedMode,
    handleAreaClick,
    handleTargetClick,
  } = useMovingTargetGame({ areaRef })

  const resultStats = useMemo(
    () => ({
      hits,
      misses,
      wrongClicks,
      spawnedTargetCount,
      elapsedMs,
      accuracy,
      averageResponseTime,
      mode: selectedMode,
      targetEvents,
      inputEvents,
    }),
    [
      hits,
      misses,
      wrongClicks,
      spawnedTargetCount,
      elapsedMs,
      accuracy,
      averageResponseTime,
      selectedMode,
      targetEvents,
      inputEvents,
    ],
  )

  useEffect(() => {
    if (gameState !== 'finished') {
      hasPreparedResultRef.current = false
      return
    }

    if (hasPreparedResultRef.current) {
      return
    }

    hasPreparedResultRef.current = true

    const resultPayload = buildMovingTargetResultPayload({
      stats: resultStats,
    })

    window.dispatchEvent(
      new CustomEvent('skillpulse:game-result-ready', {
        detail: resultPayload,
      }),
    )
  }, [gameState, resultStats])

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
              Moving Target · {GAME_MODE_CONFIG[selectedMode].label}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
            <MovingTargetStatCard
              label="โหมด"
              value={GAME_MODE_CONFIG[selectedMode].label}
            />

            <MovingTargetStatCard
              label="เป้าจริง"
              value={`${spawnedTargetCount}/${TOTAL_TARGETS}`}
            />

            <MovingTargetStatCard label="ยิงโดน" value={`${hits}`} />

            <MovingTargetStatCard label="พลาด" value={`${misses}`} />

            <MovingTargetStatCard
              label="คลิกผิด"
              value={`${wrongClicks}`}
            />

            <MovingTargetStatCard
              label="ความแม่นยำ"
              value={`${accuracy}%`}
            />

            <MovingTargetStatCard label="เวลา" value={formatTime(elapsedMs)} />
          </div>

          <MovingTargetPlayArea
            areaRef={areaRef}
            gameState={gameState}
            selectedMode={selectedMode}
            targets={targets}
            stats={resultStats}
            onAreaClick={handleAreaClick}
            onStart={startGame}
            onStop={stopGame}
            onModeChange={setSelectedMode}
            onTargetClick={handleTargetClick}
            onRetry={startGame}
            onBack={() => navigate('/librarygame')}
          />

          <div className="mt-8 flex flex-col gap-3 px-2 text-sm text-sp-text-subtle md:flex-row md:items-center md:justify-between">
            <span>
              เคล็ดลับ: คุมเมาส์ให้นิ่ง มองทิศทางเป้า
              และอย่าคลิกเป้าหมายหลอก
            </span>

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

export default MovingTargetGamePage