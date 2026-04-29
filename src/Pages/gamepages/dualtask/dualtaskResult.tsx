import { Link, useLocation, useNavigate } from 'react-router'
import { AppButton } from '../../../components/common/AppButton'
import { DualTaskIcon } from '../../../components/icons/AppIcons'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'
import { MetricCard } from './components/MetricCard'
import { ResultPanel } from './components/ResultPanel'
import type { DualTaskResult } from './types'

type ResultLocationState = {
  result?: DualTaskResult
}

export default function DualTaskResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as ResultLocationState | null) ?? null

  const storedResult = localStorage.getItem('latest_dual_task_result')
  const fallbackResult = storedResult
    ? (JSON.parse(storedResult) as DualTaskResult)
    : null

  const result = state?.result ?? fallbackResult

  if (!result) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
        <SiteHeader />

        <main className="mx-auto flex w-full max-w-sp-page flex-grow items-center justify-center px-6 py-12 md:px-12">
          <div className="w-full max-w-2xl rounded-sp-card border border-sp-border bg-sp-glass p-8 text-center backdrop-blur-xl">
            <h1 className="text-3xl font-black text-sp-text">
              ยังไม่มีผลการทดสอบ
            </h1>

            <p className="mt-3 text-sp-text-muted">
              กรุณาเล่นเกมก่อน แล้วระบบจะแสดงผลลัพธ์ในหน้านี้
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <AppButton onClick={() => navigate('/gameplay/dualtask')}>
                ไปหน้าเกม
              </AppButton>

              <Link
                to="/librarygame"
                className="rounded-sp-lg border border-sp-border bg-sp-surface px-6 py-3 font-bold text-sp-text transition-colors hover:bg-sp-surface-strong"
              >
                กลับคลังเกม
              </Link>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-sp-page flex-grow px-6 py-10 md:px-12 md:py-14">
        <section className="animate-sp-fade-in">
          <Link
            to="/librarygame"
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
            <span>กลับไปคลังเกม</span>
          </Link>

          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sp-xl bg-sp-info-soft text-sp-info shadow-sp-brand">
                <DualTaskIcon className="h-8 w-8" />
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-sp-secondary">
                  Dual Task Result
                </p>

                <h1 className="mt-2 text-4xl font-black text-sp-text md:text-5xl">
                  ผลลัพธ์การทดสอบ
                </h1>

                <p className="mt-3 max-w-3xl text-sp-text-muted">
                  สรุปผลการทำงานร่วมกันระหว่างการติดตามเป้าหมายด้วยเมาส์
                  และการกดปุ่มตามลำดับ
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <AppButton onClick={() => navigate('/gameplay/dualtask')}>
                เล่นอีกครั้ง
              </AppButton>

              <Link
                to="/gameinfo/dualtask"
                className="rounded-sp-lg border border-sp-border bg-sp-surface px-6 py-3 font-bold text-sp-text transition-colors hover:bg-sp-surface-strong"
              >
                ดูข้อมูลเกม
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Multitask Score"
              value={`${result.multitaskScore}`}
              helper="คะแนนรวมจากการทำสองงานพร้อมกัน"
            />

            <MetricCard
              label="Tracking Accuracy"
              value={`${result.trackingAccuracy}%`}
              helper="เปอร์เซ็นต์ที่เมาส์อยู่ในเป้าหมาย"
            />

            <MetricCard
              label="Input Accuracy"
              value={`${result.inputAccuracy}%`}
              helper="เปอร์เซ็นต์การกดปุ่มถูกต้อง"
            />

            <MetricCard
              label="Average Reaction"
              value={`${result.avgInputReactionMs} ms`}
              helper="เวลาเริ่มตอบ sequence"
            />

            <MetricCard
              label="Stability"
              value={`${result.stability}%`}
              helper="ความนิ่งของการติดตาม"
            />

            <MetricCard
              label="Completed Sequences"
              value={`${result.completedSequences}`}
              helper="จำนวน sequence ที่ทำครบ"
            />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-sp-card border border-sp-border bg-sp-glass p-6 backdrop-blur-xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-sp-secondary">
                Performance Breakdown
              </p>

              <h2 className="mt-2 text-2xl font-black text-sp-text">
                รายละเอียดผลการเล่น
              </h2>

              <div className="mt-5 space-y-4">
                <ResultRow label="Average Distance" value={`${result.averageDistance} px`} />
                <ResultRow label="Total Key Inputs" value={`${result.totalKeyInputs}`} />
                <ResultRow label="Correct Key Inputs" value={`${result.correctKeyInputs}`} />
                <ResultRow label="Wrong Key Inputs" value={`${result.wrongKeyInputs}`} />
                <ResultRow label="Duration" value={`${Math.round(result.durationMs / 1000)} s`} />
                <ResultRow label="Played At" value={new Date(result.playedAt).toLocaleString()} />
              </div>
            </section>

            <ResultPanel result={result} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

type ResultRowProps = {
  label: string
  value: string
}

function ResultRow({ label, value }: ResultRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-sp-border pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-sp-text-muted">{label}</span>
      <span className="text-sm font-black text-sp-text">{value}</span>
    </div>
  )
}