import type { AnswerChoice } from '../types'

type AnswerButtonProps = {
  choice: AnswerChoice
  disabled?: boolean
  onSelect: (choiceId: string) => void
}

export function AnswerButton({
  choice,
  disabled = false,
  onSelect,
}: AnswerButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(choice.id)}
      className="group rounded-sp-card border border-sp-border bg-sp-surface/70 p-6 text-center transition-all hover:-translate-y-1 hover:border-sp-secondary/50 hover:bg-sp-surface-strong hover:shadow-sp-brand disabled:pointer-events-none disabled:opacity-50"
    >
      <span className="text-3xl font-black text-sp-text md:text-4xl">
        {choice.label}
      </span>
    </button>
  )
}