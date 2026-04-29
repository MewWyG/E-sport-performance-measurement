import type { ReactNode } from 'react'

type GameCardProps = {
  icon: ReactNode
  iconClassName: string
  title: string
  description: string
  onSelect?: () => void
}

export function GameCard({
  icon,
  iconClassName,
  title,
  description,
  onSelect,
}: GameCardProps) {
  return (
    <article
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect?.()
        }
      }}
      className="group flex h-full cursor-pointer flex-col rounded-sp-card border border-sp-border bg-sp-surface/70 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-sp-primary-hover"
    >
      <div
        className={[
          'mb-6 flex h-14 w-14 items-center justify-center rounded-sp-xl text-2xl',
          iconClassName,
        ].join(' ')}
      >
        {icon}
      </div>

      <h3 className="mb-2 text-2xl font-bold text-sp-text">
        {title}
      </h3>

      <p className="flex-grow leading-relaxed text-sp-text-muted">
        {description}
      </p>

      <div className="mt-8 flex items-center gap-2 font-bold text-sp-primary-hover">
        <span>เริ่มทดสอบ</span>

        <svg
          className="h-5 w-5 transition-transform group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
      </div>
    </article>
  )
}