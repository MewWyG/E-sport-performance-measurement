import { Link, useNavigate } from 'react-router'
import { AppButton } from '../../../components/common/AppButton'
import { PredictionInterceptIcon } from '../../../components/icons/AppIcons'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'

const instructions = [
  'เป้าหมายสีเขียวจะเคลื่อนที่เป็นเส้นตรง ผู้เล่นต้องสังเกตทิศทางและความเร็วของเป้าหมาย',
  'เมื่อเป้าหมายหายไป ให้คลิกตำแหน่งที่คิดว่าเป้าหมายจะเคลื่อนที่ไปถึง',
  'สามารถใช้ Random Seed เพื่อสุ่มรูปแบบใหม่ หรือ Fixed Seed เพื่อใช้รูปแบบเดิมซ้ำได้',
  'หลังจบเกม ระบบจะแสดงผล เช่น ความแม่นยำรวม ระยะพลาดเฉลี่ย ความแม่นยำด้านเวลา และแนวโน้มการคาดการณ์',
]

const metrics = [
  {
    label: 'ความแม่นยำรวม',
    value: 'เปอร์เซ็นต์คะแนนรวมจากตำแหน่งที่คลิกและจังหวะการคลิก',
  },
  {
    label: 'ระยะพลาดเฉลี่ย',
    value: 'ระยะห่างเฉลี่ยระหว่างจุดที่คลิกกับตำแหน่งจริง',
  },
  {
    label: 'ความแม่นยำด้านเวลา',
    value: 'คะแนนจากการคลิกเร็วหรือช้าเกินไป',
  },
]

export function PredictionInterceptInfoPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-sp-page flex-grow px-6 py-12 md:px-12 md:py-20">
        <section className="animate-sp-fade-in mx-auto max-w-4xl">
          <Link
            to="/librarygame"
            className="group mb-8 inline-flex items-center gap-2 text-sp-text-muted transition-colors hover:text-sp-text"
          >
            <svg
              className="h-5 w-5 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>

            <span>กลับไปยังคลังเกม</span>
          </Link>

          <div className="rounded-sp-card border border-sp-border bg-sp-glass p-8 backdrop-blur-xl md:p-12">
            <div className="flex flex-col items-center gap-10 md:flex-row md:gap-12">
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-sp-card bg-sp-warning-soft text-sp-warning shadow-sp-brand md:h-48 md:w-48">
                <PredictionInterceptIcon className="h-16 w-16 md:h-24 md:w-24" />
              </div>

              <div className="flex-grow text-center md:text-left">
                <h1 className="mb-4 text-4xl font-black text-sp-text md:text-5xl">
                  Prediction Intercept
                </h1>

                <p className="mb-8 text-xl leading-relaxed text-sp-text-muted">
                  แบบทดสอบการคาดการณ์ตำแหน่งเป้าหมาย ใช้วัดความสามารถในการเดาทิศทางและตำแหน่งล่วงหน้า
                  เมื่อเป้าหมายหายไป เหมาะสำหรับประเมิน prediction, anticipation และ visual tracking
                </p>

                <AppButton
                  onClick={() => navigate('/gameplay/prediction-intercept')}
                  className="w-full px-12 py-5 text-xl md:w-auto"
                >
                  เล่นเลย
                </AppButton>
              </div>
            </div>

            <div className="mt-12 border-t border-sp-surface pt-12">
              <h2 className="mb-6 text-xl font-bold text-sp-text">
                วิธีการเล่น
              </h2>

              <ul className="space-y-4 text-sp-text-muted">
                {instructions.map((instruction, index) => (
                  <li key={instruction} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sp-pill bg-sp-surface-strong text-xs font-bold text-white">
                      {index + 1}
                    </span>

                    <span className="leading-relaxed">{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12 border-t border-sp-surface pt-12">
              <h2 className="mb-6 text-xl font-bold text-sp-text">
                การวัดผล
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {metrics.map((metric) => (
                  <InfoBox
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                  />
                ))}
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
              <InfoBox
                label="จำนวนรอบ"
                value="5 / 8 / 10 / 15 Trials"
              />

              <InfoBox
                label="วัดทักษะหลัก"
                value="Prediction / Anticipation / Visual Tracking"
              />

              <InfoBox
                label="โหมดมาตรฐาน"
                value="Fixed Seed สำหรับทดสอบหลายคน"
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

type InfoBoxProps = {
  label: string
  value: string
}

function InfoBox({ label, value }: InfoBoxProps) {
  return (
    <div className="rounded-sp-xl border border-sp-border bg-sp-surface/50 p-5">
      <p className="mb-1 text-sm font-semibold text-sp-text-subtle">
        {label}
      </p>

      <p className="text-lg font-bold text-sp-text">
        {value}
      </p>
    </div>
  )
}

export default PredictionInterceptInfoPage