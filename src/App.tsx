import { useNavigate } from 'react-router'
import { AppButton } from './components/common/AppButton'
import {
  CheckCircleIcon,
  TrendIcon,
  UsersIcon,
} from './components/icons/AppIcons'
import { SiteFooter } from './components/layout/SiteFooter'
import { SiteHeader } from './components/layout/SiteHeader'
import { FeatureCard } from './features/landing/FeatureCard'

const features = [
  {
    title: 'มาตรวัดทางวิทยาศาสตร์',
    description:
      'การทดสอบของเราได้รับแรงบันดาลใจจากเกณฑ์มาตรฐานทางประสาทวิทยาเพื่อวัดการตอบสนองและความจำ',
    icon: <CheckCircleIcon className="h-6 w-6" />,
    iconClassName: 'bg-sp-success-soft text-sp-success',
  },
  {
    title: 'ติดตามความคืบหน้า',
    description:
      'ดูการพัฒนาของคุณเมื่อเวลาผ่านไป พร้อมประวัติการเล่นที่ละเอียดและบทวิเคราะห์เปอร์เซ็นไทล์',
    icon: <TrendIcon className="h-6 w-6" />,
    iconClassName: 'bg-sp-info-soft text-sp-info',
  },
  {
    title: 'ขับเคลื่อนโดยชุมชน',
    description:
      'เปรียบเทียบคะแนนของคุณกับกลุ่มอายุเดียวกันและชุมชน SkillPulse ทั่วโลก',
    icon: <UsersIcon className="h-6 w-6" />,
    iconClassName: 'bg-sp-pink-soft text-sp-pink',
  },
]

function App() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-sp-page flex-grow px-6 py-12 md:px-12 md:py-24">
        <section className="animate-sp-fade-in text-center">
          <h1 className="mb-6 text-5xl font-black leading-tight text-sp-text md:text-8xl">
            <span>ทดสอบทักษะของคุณ </span>
            <span className="whitespace-nowrap bg-gradient-to-br from-sp-gradient-start to-sp-gradient-end bg-clip-text text-transparent">
              ผ่านการเล่น
            </span>
          </h1>

          <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-sp-text-muted md:text-2xl">
            ท้าทายขีดจำกัดของคุณด้วยมินิเกมที่ออกแบบมาเพื่อวัดสมาธิ,
            การตอบสนอง, ความจำ และการตัดสินใจบน SkillPulse
          </p>

          <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
            <AppButton
              onClick={() => navigate('/librarygame')}
              className="w-full px-10 py-5 text-xl md:w-auto"
            >
              เริ่มต้นใช้งาน
            </AppButton>

            <AppButton
              variant="glass"
              className="w-full px-10 py-5 text-xl md:w-auto"
            >
              ดูอันดับผู้นำ
            </AppButton>
          </div>

          <div className="mt-24 grid grid-cols-1 gap-8 text-left md:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                iconClassName={feature.iconClassName}
              />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default App