import { useNavigate } from 'react-router'
import { GameCard } from '../../components/game/GameCard'
import { TargetIcon } from '../../components/icons/AppIcons'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { SiteHeader } from '../../components/layout/SiteHeader'

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
    icon: '🎯',
    iconClassName: 'bg-sp-info-soft text-sp-info',
    path: '/gameinfo/continuous-tracking',
    isAvailable: true,
  },
  {
    id: 'number-search',
    title: 'ตามหาตัวเลข',
    description:
      'ทดสอบความเร็วในการมองหาเป้าหมายและประมวลผลในการทำตามลำดับอย่างถูกต้อง',
    icon: '🔢',
    iconClassName: 'bg-sp-info-soft text-sp-info',
    path: '',
    isAvailable: false,
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