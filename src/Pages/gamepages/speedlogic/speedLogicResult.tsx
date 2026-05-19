import { Link, useLocation, useNavigate } from 'react-router'
import { AppButton } from '../../../components/common/AppButton'
import { SpeedLogicIcon } from '../../../components/icons/AppIcons'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'
import { MetricCard } from './components/MetricCard'
import { ResultPanel } from './components/ResultPanel'
import type { SpeedLogicResult } from './types'

type ResultLocationState = {
  result?: SpeedLogicResult
}

export default function SpeedLogicResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as ResultLocationState | null) ?? null

  const storedResult = localStorage.getItem('latest_speed_logic_result')
  const fallbackResult = storedResult
    ? (JSON.parse(storedResult) as SpeedLogicResult)
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
              <AppButton onClick={() => navigate('/gameplay/speedlogic')}>
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

  const config = result.configSnapshot

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
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sp-xl bg-sp-warning-soft text-sp-warning shadow-sp-brand">
                <SpeedLogicIcon className="h-8 w-8" />
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-sp-secondary">
                  Speed Logic Result
                </p>

                <h1 className="mt-2 text-4xl font-black text-sp-text md:text-5xl">
                  ผลลัพธ์การทดสอบ
                </h1>

                <p className="mt-3 max-w-3xl text-sp-text-muted">
                  สรุปผลความเร็วในการประมวลผล ความถูกต้อง และระดับความยากที่ทำได้
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <AppButton onClick={() => navigate('/gameplay/speedlogic')}>
                เล่นอีกครั้ง
              </AppButton>

              <Link
                to="/gameinfo/speedlogic"
                className="rounded-sp-lg border border-sp-border bg-sp-surface px-6 py-3 font-bold text-sp-text transition-colors hover:bg-sp-surface-strong"
              >
                ดูข้อมูลเกม
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Weighted Score"
              value={`${result.score}`}
              helper="คะแนนรวมจากคำตอบที่ถูก โดยถ่วงน้ำหนักตาม difficulty และประเภทโจทย์"
            />

            <MetricCard
              label="Test Mode"
              value={result.testMode.toUpperCase()}
              helper="โหมดที่ใช้ในการทดสอบ"
            />

            <MetricCard
              label="Accuracy"
              value={`${result.accuracy}%`}
              helper="เปอร์เซ็นต์คำตอบที่ถูกต้อง"
            />

            <MetricCard
              label="Avg Response"
              value={`${result.avgResponseTimeMs} ms`}
              helper="เวลาตอบเฉลี่ยต่อคำถาม"
            />

            <MetricCard
              label="Max Difficulty"
              value={`${result.maxDifficulty}`}
              helper="ระดับความยากสูงสุด"
            />

            <MetricCard
              label="Throughput"
              value={`${result.throughput} / sec`}
              helper="จำนวนคำตอบถูกต่อวินาที"
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
                <ResultRow label="Total Answers" value={`${result.totalAnswers}`} />
                <ResultRow label="Weighted Score" value={`${result.score}`} />
                <ResultRow label="Correct Answers" value={`${result.correctAnswers}`} />
                <ResultRow label="Wrong Answers" value={`${result.wrongAnswers}`} />
                <ResultRow label="Fastest Response" value={`${result.fastestResponseMs} ms`} />
                <ResultRow label="Slowest Response" value={`${result.slowestResponseMs} ms`} />
                <ResultRow label="Final Difficulty" value={`${result.finalDifficulty}`} />
                <ResultRow label="Duration" value={`${Math.round(result.durationMs / 1000)} s`} />
                <ResultRow label="Played At" value={new Date(result.playedAt).toLocaleString()} />
              </div>
            </section>

            <ResultPanel result={result} />
          </div>

          <section className="mt-8 rounded-sp-card border border-sp-border bg-sp-glass p-6 backdrop-blur-xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sp-secondary">
              Fairness Configuration
            </p>

            <h2 className="mt-2 text-2xl font-black text-sp-text">
              ข้อมูลโหมดและ Question Schedule
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-sp-text-muted">
              ข้อมูลส่วนนี้ใช้ตรวจสอบว่า session นี้เล่นด้วยโหมดอะไร และใช้ schedule
              ชุดไหน เพื่อให้ backend สามารถเปรียบเทียบผลของผู้เล่นในกลุ่มเดียวกันได้ยุติธรรมขึ้น
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ConfigCard
                label="Test Mode"
                value={result.testMode.toUpperCase()}
              />

              <ConfigCard
                label="Schedule Version"
                value={result.scheduleVersion}
              />

              <ConfigCard
                label="Initial Difficulty"
                value={`${config.initialDifficulty}`}
              />

              <ConfigCard
                label="Difficulty Range"
                value={`${config.minDifficulty}-${config.maxDifficulty}`}
              />

              <ConfigCard
                label="Answer Choices"
                value={`${config.answerChoiceCount}`}
              />

              <ConfigCard
                label="Max Same Type Streak"
                value={`${config.maxSameTypeStreak}`}
              />

              <ConfigCard
                label="Increase Rule"
                value={`${config.streakToIncreaseDifficulty} correct streak`}
              />

              <ConfigCard
                label="Decrease Rule"
                value={`${config.mistakesToDecreaseDifficulty} mistakes`}
              />

              <ConfigCard
                label="Min Answer Delay"
                value={`${config.minAnswerDelayMs} ms`}
              />
            </div>
          </section>

          <section className="mt-8 rounded-sp-card border border-sp-border bg-sp-glass p-6 backdrop-blur-xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sp-secondary">
              Schedule Stage Breakdown
            </p>

            <h2 className="mt-2 text-2xl font-black text-sp-text">
              สถิติแยกตามช่วงเวลา
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-sp-text-muted">
              แต่ละช่วงเวลาจะกำหนดประเภทโจทย์และกรอบ difficulty ที่แตกต่างกัน
              เพื่อให้ทุก session มีโครงความยากใกล้เคียงกัน แต่ยังคงสุ่มโจทย์ภายในกรอบนั้น
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-sp-border text-sp-text-subtle">
                    <th className="py-3 pr-4 font-bold">Stage</th>
                    <th className="py-3 pr-4 font-bold">Time</th>
                    <th className="py-3 pr-4 font-bold">Allowed Types</th>
                    <th className="py-3 pr-4 font-bold">Total</th>
                    <th className="py-3 pr-4 font-bold">Correct</th>
                    <th className="py-3 pr-4 font-bold">Accuracy</th>
                    <th className="py-3 pr-4 font-bold">Avg Response</th>
                    <th className="py-3 pr-4 font-bold">Score</th>
                  </tr>
                </thead>

                <tbody>
                  {Object.values(result.scheduleStageBreakdown).map((stage) => (
                    <tr
                      key={stage.stageId}
                      className="border-b border-sp-border/70 last:border-b-0"
                    >
                      <td className="py-3 pr-4 font-bold text-sp-text">
                        {stage.stageId}
                      </td>

                      <td className="py-3 pr-4 text-sp-text-muted">
                        {stage.startSec}s - {stage.endSec}s
                      </td>

                      <td className="py-3 pr-4 text-sp-text-muted">
                        {stage.allowedTypes.map(formatQuestionType).join(', ')}
                      </td>

                      <td className="py-3 pr-4 text-sp-text-muted">
                        {stage.total}
                      </td>

                      <td className="py-3 pr-4 text-sp-text-muted">
                        {stage.correct}
                      </td>

                      <td className="py-3 pr-4 text-sp-text-muted">
                        {stage.accuracy}%
                      </td>

                      <td className="py-3 pr-4 text-sp-text-muted">
                        {stage.avgResponseTimeMs} ms
                      </td>

                      <td className="py-3 pr-4 font-bold text-sp-text">
                        {stage.totalEarnedScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8 rounded-sp-card border border-sp-border bg-sp-glass p-6 backdrop-blur-xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sp-secondary">
              Question Type Breakdown
            </p>

            <h2 className="mt-2 text-2xl font-black text-sp-text">
              สถิติแยกตามประเภทโจทย์
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(result.questionTypeBreakdown).map(([type, data]) => (
                <div
                  key={type}
                  className="rounded-sp-xl border border-sp-border bg-sp-surface/55 p-5"
                >
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-sp-text-subtle">
                    {formatQuestionType(type)}
                  </p>

                  <div className="mt-4 space-y-2 text-sm">
                    <BreakdownRow label="Total" value={`${data.total}`} />
                    <BreakdownRow label="Correct" value={`${data.correct}`} />
                    <BreakdownRow label="Accuracy" value={`${data.accuracy}%`} />
                    <BreakdownRow
                      label="Avg Response"
                      value={`${data.avgResponseTimeMs} ms`}
                    />
                    <BreakdownRow
                      label="Score"
                      value={`${data.totalEarnedScore}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
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
      <span className="text-sm text-sp-text-muted">
        {label}
      </span>

      <span className="text-sm font-black text-sp-text">
        {value}
      </span>
    </div>
  )
}

type ConfigCardProps = {
  label: string
  value: string
}

function ConfigCard({ label, value }: ConfigCardProps) {
  return (
    <div className="rounded-sp-xl border border-sp-border bg-sp-surface/55 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-sp-text-subtle">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-black text-sp-text">
        {value}
      </p>
    </div>
  )
}

type BreakdownRowProps = {
  label: string
  value: string
}

function BreakdownRow({ label, value }: BreakdownRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sp-text-muted">
        {label}
      </span>

      <span className="font-bold text-sp-text">
        {value}
      </span>
    </div>
  )
}

function formatQuestionType(type: string) {
  if (type === 'addition') return 'Addition'
  if (type === 'subtraction') return 'Subtraction'
  if (type === 'multiplication') return 'Multiplication'
  if (type === 'comparison') return 'Comparison'
  if (type === 'odd_even') return 'Odd / Even'
  if (type === 'true_false') return 'True / False'

  return type
}