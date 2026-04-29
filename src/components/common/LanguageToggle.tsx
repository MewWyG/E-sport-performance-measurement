type Language = 'th' | 'en'

type LanguageToggleProps = {
  activeLanguage?: Language
  onChange?: (language: Language) => void
}

export function LanguageToggle({
  activeLanguage = 'th',
  onChange,
}: LanguageToggleProps) {
  return (
    <div className="flex rounded-sp-pill border border-sp-border-strong bg-sp-surface p-1">
      <button
        type="button"
        onClick={() => onChange?.('th')}
        className={[
          'rounded-sp-pill px-3 py-1 text-xs font-bold transition-all',
          activeLanguage === 'th'
            ? 'bg-sp-primary text-white'
            : 'text-sp-text-muted hover:text-sp-text',
        ].join(' ')}
      >
        TH
      </button>

      <button
        type="button"
        onClick={() => onChange?.('en')}
        className={[
          'rounded-sp-pill px-3 py-1 text-xs font-bold transition-all',
          activeLanguage === 'en'
            ? 'bg-sp-primary text-white'
            : 'text-sp-text-muted hover:text-sp-text',
        ].join(' ')}
      >
        EN
      </button>
    </div>
  )
}