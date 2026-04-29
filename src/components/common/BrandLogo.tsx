import { Link } from 'react-router'
import { LightningIcon } from '../icons/AppIcons'

export function BrandLogo() {
  return (
    <Link to="/" className="flex cursor-pointer items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-sp-md bg-sp-primary shadow-sp-brand-sm">
        <LightningIcon className="h-6 w-6 text-white" />
      </div>

      <span className="text-2xl font-extrabold uppercase tracking-tight text-sp-text">
        SkillPulse
      </span>
    </Link>
  )
}