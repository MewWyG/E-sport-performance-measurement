import type { ReactNode } from 'react'

type FeatureCardProps = {
  icon: ReactNode
  iconClassName: string
  title: string
  description: string
}

export function FeatureCard({
  icon,
  iconClassName,
  title,
  description,
}: FeatureCardProps) {
  return (
    <article className="rounded-sp-card border border-sp-border bg-sp-glass p-8 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-sp-primary-hover">
      <div
        className={[
          'mb-6 flex h-12 w-12 items-center justify-center rounded-sp-sm',
          iconClassName,
        ].join(' ')}
      >
        {icon}
      </div>

      <h3 className="mb-2 text-xl font-bold text-sp-text">{title}</h3>
      <p className="leading-relaxed text-sp-text-muted">{description}</p>
    </article>
  )
}