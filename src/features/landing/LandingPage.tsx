import { LandingHero } from './LandingHero'
import { FeatureGrid } from './FeatureGrid'

export function LandingPage() {
  return (
    <section className="animate-sp-fade-in text-center">
      <LandingHero />
      <FeatureGrid />
    </section>
  )
}