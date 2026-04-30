import type { GameStatus, SpeedLogicQuestion } from '../types'
import { AnswerButton } from './AnswerButton'

type QuestionCardProps = {
  question: SpeedLogicQuestion | null
  status: GameStatus
  countdown: number | null
  disabled?: boolean
  onAnswer: (choiceId: string) => void
  onStartRequest: () => void
  onReset: () => void
}

export function QuestionCard({
  question,
  status,
  countdown,
  disabled = false,
  onAnswer,
  onStartRequest,
  onReset,
}: QuestionCardProps) {
  const showStartOverlay = status !== 'playing' && countdown === null
  const showCountdownOverlay = countdown !== null
  const showQuestion = status === 'playing' && question !== null

  return (
    <section className="rounded-[32px] border border-sp-border bg-sp-glass p-5 backdrop-blur-xl md:p-6">
      <div className="relative min-h-[620px] overflow-hidden rounded-[28px] border border-sp-border bg-[#08162f]/90 shadow-sp-brand">
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              'linear-gradient(rgba(117, 134, 173, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(117, 134, 173, 0.12) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(90,108,255,0.12),transparent_60%)]" />

        <button
          type="button"
          onClick={onReset}
          className="absolute right-5 top-5 z-30 rounded-sp-pill border border-sp-border bg-sp-surface/85 px-5 py-2.5 text-sm font-bold text-sp-text transition-all hover:bg-sp-surface-strong"
        >
          รีเซ็ต
        </button>

        {showQuestion ? (
          <div className="relative z-10 flex min-h-[620px] flex-col px-6 py-6 md:px-10 md:py-8">
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <Badge label={formatQuestionType(question.type)} />
              <Badge label={`Level ${question.difficulty}`} />
            </div>

            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="w-full max-w-5xl">
                <div className="rounded-[28px] border border-sp-border bg-sp-surface/45 px-6 py-10 text-center md:px-10 md:py-14">
                  <h2 className="text-4xl font-black tracking-tight text-sp-text md:text-6xl xl:text-7xl">
                    {question.prompt}
                  </h2>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {question.choices.map((choice) => (
                    <AnswerButton
                      key={choice.id}
                      choice={choice}
                      disabled={disabled}
                      onSelect={onAnswer}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {showStartOverlay ? (
          <button
            type="button"
            onClick={onStartRequest}
            className="absolute inset-0 z-20 flex items-center justify-center bg-[#08162f]/58 text-left transition-colors hover:bg-[#08162f]/48"
          >
            <div className="mx-6 w-full max-w-3xl rounded-[28px] border border-sp-border bg-sp-glass px-8 py-10 text-center shadow-sp-brand backdrop-blur-xl md:px-12 md:py-14">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-sp-secondary">
                Click To Start
              </p>

              <h2 className="mt-4 text-4xl font-black text-sp-text md:text-6xl">
                กดเพื่อเริ่มเล่น
              </h2>

              <p className="mt-5 text-base leading-relaxed text-sp-text-muted md:text-lg">
                คลิกในกรอบนี้เพื่อเริ่มทดสอบ
                หลังจากนั้นระบบจะนับถอยหลัง 3 วินาที
                แล้วเริ่มแสดงโจทย์ทันที
              </p>
            </div>
          </button>
        ) : null}

        {showCountdownOverlay ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#08162f]/72">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-sp-secondary">
                Get Ready
              </p>

              <div className="mt-5 text-8xl font-black leading-none text-sp-text md:text-9xl">
                {countdown}
              </div>

              <p className="mt-5 text-base text-sp-text-muted md:text-lg">
                เตรียมตอบโจทย์ให้เร็วและแม่นยำ
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

type BadgeProps = {
  label: string
}

function Badge({ label }: BadgeProps) {
  return (
    <div className="rounded-sp-pill border border-sp-border bg-sp-surface/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sp-text">
      {label}
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