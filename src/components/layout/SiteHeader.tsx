import { AppButton } from '../common/AppButton'
import { BrandLogo } from '../common/BrandLogo'
import { LanguageToggle } from '../common/LanguageToggle'
import { Link } from 'react-router'

export function SiteHeader() {
  return (
    <nav className="sticky top-0 z-50 border-b border-sp-border bg-sp-glass px-4 py-4 backdrop-blur-xl md:px-6">
      <div className="flex w-full items-center justify-between">
        <BrandLogo />

        <div className="flex items-center gap-4 font-semibold md:gap-8">
          <div className="hidden items-center gap-8 text-sp-text-muted md:flex">
            <Link to="/librarygame" className="transition-colors hover:text-sp-text">
              คลังเกม
            </Link>

            <button className="transition-colors hover:text-sp-text">
              ประวัติการเล่น
            </button>
          </div>

          <LanguageToggle activeLanguage="th" />

          <AppButton
            variant="primary"
            className="rounded-sp-pill px-5 py-2.5 text-sm hover:-translate-y-0.5"
          >
            เข้าสู่ระบบ
          </AppButton>
        </div>
      </div>
    </nav>
  )
}