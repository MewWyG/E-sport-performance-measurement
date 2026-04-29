import { Link, useNavigate } from 'react-router'
import { DualTaskIcon } from '../../../components/icons/AppIcons'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'
import { DualTaskCanvas } from './components/DualTaskCanvas'
import { SequenceOverlay } from './components/SequenceOverlay'
import { useDualTaskGame } from './hooks/useDualTaskGame'

export default function DualTaskGamePage() {
  const navigate = useNavigate()

  const {
    status,
    liveStats,
    activeSequence,
    targetRef,
    pointerRef,
    startGame,
    resetGame,
    updatePointer,
  } = useDualTaskGame({
    onFinish: (result) => {
      navigate('/gameplay/dualtask/result', {
        state: { result },
      })
    },
  })

  const timeLeftSec = Math.ceil(liveStats.timeLeftMs / 1000)

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-sp-page flex-grow px-6 py-10 md:px-12 md:py-14">
        <section className="animate-sp-fade-in">
          <Link
            to="/gameinfo/dualtask"
            className="group mb-8 inline-flex items-center gap-2 text-sp-text-muted transition-colors hover:text-sp-text"
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
            <span>กลับไปหน้าข้อมูลเกม</span>
          </Link>


          <section className="rounded-sp-card border border-sp-border bg-sp-glass p-4 backdrop-blur-xl md:p-5">
            <div className="relative overflow-hidden rounded-sp-card border border-sp-border bg-sp-bg-soft">
              {/* HUD ด้านบนในกรอบเกม */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 p-4 md:p-5">
                <div className="flex flex-wrap gap-3">
                  <HudChip label="TIME" value={`${timeLeftSec}s`} />
                  <HudChip
                    label="TRACK"
                    value={`${liveStats.trackingAccuracy.toFixed(1)}%`}
                  />
                  <HudChip
                    label="INPUT"
                    value={`${liveStats.inputAccuracy.toFixed(1)}%`}
                  />
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetGame}
                    className="rounded-sp-lg border border-sp-border bg-sp-surface/90 px-4 py-2 text-sm font-bold text-sp-text transition-colors hover:bg-sp-surface-strong"
                  >
                    รีเซ็ต
                  </button>
                </div>
              </div>

              {/* สนามเล่น */}
              <DualTaskCanvas
                targetRef={targetRef}
                pointerRef={pointerRef}
                onPointerMove={updatePointer}
              />

              {/* ลำดับกดอยู่กลางสนาม */}
              {status === 'playing' ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4">
                  <SequenceOverlay sequence={activeSequence} />
                </div>
              ) : null}

              {/* overlay สำหรับคลิกเริ่ม */}
              {status !== 'playing' ? (
                <button
                  type="button"
                  onClick={startGame}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-sp-bg/55 px-6 text-center backdrop-blur-[2px] transition hover:bg-sp-bg/45"
                >
                  <div className="rounded-sp-xl border border-sp-border bg-sp-glass px-8 py-8 shadow-sp-brand backdrop-blur-xl">
                    <p className="text-sm font-bold uppercase tracking-[0.24em] text-sp-secondary">
                      Click To Start
                    </p>

                    <h2 className="mt-3 text-4xl font-black text-sp-text">
                      กดเพื่อเริ่มเล่น
                    </h2>

                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-sp-text-muted md:text-base">
                      คลิกในกรอบนี้เพื่อเริ่มทดสอบทันที
                      จากนั้นให้ใช้เมาส์ติดตามเป้าหมาย
                      และกดปุ่มตามลำดับที่แสดงตรงกลางสนาม
                    </p>
                  </div>
                </button>
              ) : null}
            </div>
          </section>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

type HudChipProps = {
  label: string
  value: string
}

function HudChip({ label, value }: HudChipProps) {
  return (
    <div className="min-w-[96px] rounded-sp-lg border border-sp-border bg-sp-glass/90 px-4 py-3 backdrop-blur-xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sp-text-subtle">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-sp-text md:text-xl">
        {value}
      </p>
    </div>
  )
}