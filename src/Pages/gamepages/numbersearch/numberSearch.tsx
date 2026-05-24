import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'
import { MAX_NUMBER_SEARCH_LEVEL } from './config'
import { useNumberSearchGame } from './hooks/useNumberSearchGame'
import { NumberSearchPlayArea } from './ui/NumberSearchPlayArea'
import { NumberSearchProgressPanel } from './ui/NumberSearchProgressPanel'
import { NumberSearchStatCard } from './ui/NumberSearchStatCard'
import { formatTime } from './utils/format'
import { buildNumberSearchResultPayload } from './utils/resultPayload'

// หน้าเกมหลักของ Number Search
// แสดงสถิติ เลเวล และสนามเล่น พร้อมควบคุมการเริ่ม/หยุดเกม
function NumberSearchGamePage() {
  const navigate = useNavigate()
  const areaRef = useRef<HTMLDivElement | null>(null)
  const hasPreparedResultRef = useRef(false)

  const {
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
  } = useNumberSearchGame({ areaRef })

  const resultStats = useMemo(
    () => stats,
    [
      stats.levelReached,
      stats.completedLevels,
      stats.correctClicks,
      stats.wrongClicks,
      stats.totalNumbersShown,
      stats.elapsedMs,
      stats.averageFindTime,
      stats.score,
      stats.targetEvents,
      stats.inputEvents,
      stats.levelEvents,
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

    const resultPayload = buildNumberSearchResultPayload({
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
              to="/gameinfo/numbersearch"
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
              Number Search
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <NumberSearchStatCard
              label="Level"
              value={`${level}/${MAX_NUMBER_SEARCH_LEVEL}`}
            />

            <NumberSearchStatCard
              label="กดถูก"
              value={`${correctClicks}`}
            />

            <NumberSearchStatCard
              label="กดผิด"
              value={`${wrongClicks}`}
            />

            <NumberSearchStatCard
              label="เวลาเฉลี่ย"
              value={averageFindTime > 0 ? `${averageFindTime} ms` : '-'}
            />

            <NumberSearchStatCard
              label="เวลา"
              value={formatTime(elapsedMs)}
            />

            <NumberSearchStatCard label="Score" value={`${score}`} />
          </div>

          {gameState === 'running' && (
            <NumberSearchProgressPanel clickedNumbers={clickedNumbers} />
          )}

          <NumberSearchPlayArea
            areaRef={areaRef}
            gameState={gameState}
            tiles={tiles}
            stats={resultStats}
            onStart={startGame}
            onStop={stopGame}
            onTileClick={handleTileClick}
            onRetry={startGame}
            onBack={() => navigate('/librarygame')}
          />

          <div className="mt-8 flex flex-col gap-3 px-2 text-sm text-sp-text-subtle md:flex-row md:items-center md:justify-between">
            <span>
              เคล็ดลับ: มองหาตัวเลขที่น้อยที่สุดที่ยังเหลืออยู่บนสนาม
              แล้วคลิกเรียงจากน้อยไปมาก
            </span>

            <span className="font-mono font-bold text-sp-primary-hover">
              เล่นให้ครบ Level {MAX_NUMBER_SEARCH_LEVEL} แล้วระบบจะสรุปผล
            </span>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default NumberSearchGamePage