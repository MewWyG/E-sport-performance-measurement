import type { ButtonHTMLAttributes, ReactNode } from 'react'

type AppButtonVariant = 'primary' | 'glass'

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: AppButtonVariant
}

const variantClassNames: Record<AppButtonVariant, string> = {
  primary:
    'bg-sp-primary text-white hover:-translate-y-1 hover:bg-sp-primary-hover hover:shadow-sp-brand',
  glass:
    'border border-sp-border bg-sp-glass text-white backdrop-blur-xl hover:bg-sp-surface',
}

export function AppButton({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={[
        'rounded-sp-lg font-bold transition duration-300',
        variantClassNames[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}