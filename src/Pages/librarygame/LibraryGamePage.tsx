import { useNavigate } from 'react-router'
import { GameCard } from '../../components/game/GameCard'
import { PredictionInterceptIcon, TargetIcon } from '../../components/icons/AppIcons'
import { DualTaskIcon } from '../../components/icons/AppIcons'
import { SpeedLogicIcon } from '../../components/icons/AppIcons'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { ContinuousTrackingIcon } from '../../components/icons/AppIcons'

const games = [
  {
    id: 'moving-target',
    title: 'เป้าเคลื่อนที่',
    description:
      'ทดสอบการเล็ง การตอบสนอง และการติดตามเป้าหมายที่เคลื่อนที่บนหน้าจอ',
    icon: <TargetIcon className="h-7 w-7" />,
    iconClassName: 'bg-sp-danger-soft text-sp-danger',
    path: '/gameinfo/movingtarget',
    isAvailable: true,
  },
  {
    id: 'continuous-tracking',
    title: 'การติดตามเป้าหมายต่อเนื่อง',
    description:
      'ทดสอบการควบคุมเมาส์และการประสานงานระหว่างสายตากับมือ โดยติดตามเป้าหมายที่เคลื่อนที่ต่อเนื่อง',
    icon: <ContinuousTrackingIcon className="h-7 w-7" />,
    iconClassName: 'bg-sp-info-soft text-sp-info',
    path: '/gameinfo/continuous-tracking',
    isAvailable: true,
  },
  {
    id: 'number-search',
    title: 'ตามหาตัวเลข',
    description:
      'คลิกตัวเลขเรียงจากน้อยไปมาก เล่นไปเรื่อย ๆ เป็น Level และพยายามอย่ากดผิดครบ 3 ครั้ง',
    icon: '🔢',
    iconClassName: 'bg-sp-info-soft text-sp-info',
    path: '/gameinfo/numbersearch',
    isAvailable: true,
  },
  {
    id: 'dual-task',
    title: 'Aim & Input',
    description:
      'ทดสอบการติดตามเป้าหมายด้วยเมาส์ พร้อมกับกดปุ่มตามลำดับแบบ Esports',
    icon: <DualTaskIcon className="h-7 w-7" />,
    iconClassName: 'bg-sp-info-soft text-sp-info',
    path: '/gameinfo/dualtask',
    isAvailable: true,
  },
  {
    id: 'speed-logic',
    title: 'Speed Logic',
    description:
      'ทดสอบความเร็วในการคิด การตัดสินใจ และความถูกต้องภายใต้เวลาจำกัด',
    icon: <SpeedLogicIcon className="h-7 w-7" />,
    iconClassName: 'bg-sp-warning-soft text-sp-warning',
    path: '/gameinfo/speedlogic',
    isAvailable: true,
  },
  {
  id: 'prediction-intercept',
  title: 'การคาดการณ์ตำแหน่งเป้าหมาย',
  description:
    'ทดสอบความสามารถในการคาดการณ์การเคลื่อนที่ล่วงหน้า โดยคลิกตำแหน่งที่คิดว่าเป้าหมายจะไปถึงหลังจากเป้าหมายหายไป',
  icon: <PredictionInterceptIcon className="h-7 w-7" />,
  iconClassName: 'bg-sp-warning-soft text-sp-warning',
  path: '/gameinfo/prediction-intercept',
  isAvailable: true,
  },
  {
    id: 'spray-control',
    title: 'Spray Control',
    description:
      'ทดสอบการคุมเมาส์ตอนสเปรย์ — ลากสวน recoil ให้กระสุนเกาะวงเป้าทั้งแม็ก',
    icon: '🎯',
    iconClassName: 'bg-sp-danger-soft text-sp-danger',
    path: '/gameinfo/spray-control',
    isAvailable: true,
  },
  {
    id: 'auditory-localization',
    title: 'Auditory Localization',
    description:
      'ฟังเสียง 3D ผ่านหูฟัง แล้วระบุตำแหน่งของเสียง ทั้งทิศและระยะใกล้-ไกล',
    icon: '🎧',
    iconClassName: 'bg-sp-primary/15 text-sp-primary-hover',
    path: '/gameinfo/auditory-localization',
    isAvailable: true,
  },
]

export function LibraryGamePage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-sp-page flex-grow px-6 py-12 md:px-12">
        <section className="animate-sp-fade-in">
          <div className="mb-12">
            <h1 className="mb-2 text-4xl font-black text-sp-text">
              คลังเกม
            </h1>

            <p className="text-sp-text-muted">
              เลือกเกมที่ต้องการเพื่อเริ่มทดสอบขีดจำกัดของคุณ
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <GameCard
                key={game.id}
                icon={game.icon}
                iconClassName={game.iconClassName}
                title={game.title}
                description={game.description}
                onSelect={() => {

                  if (!game.isAvailable || !game.path) return

                  navigate(game.path)
                }}
              />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}