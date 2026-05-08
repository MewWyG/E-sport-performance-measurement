import { Link, useNavigate } from 'react-router'
import { AppButton } from '../../../components/common/AppButton'
import { ContinuousTrackingIcon } from '../../../components/icons/AppIcons'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'

const instructions = [
  'เลือกระดับความยาก Easy, Normal หรือ Hard และเลือกระยะเวลาที่ต้องการทดสอบ',
  'เมื่อเริ่มเกม เมาส์จะถูกล็อกไว้ในพื้นที่ทดสอบ และเป้าหมายสีเขียวจะเคลื่อนที่ต่อเนื่อง',
  'ควบคุม cursor ให้ตามเป้าหมายให้ได้นานที่สุด โดยพยายามให้อยู่ใกล้กึ่งกลางเป้ามากที่สุด',
  'ระบบจะสุ่มทิศทางและความเร็วแบบมีมาตรฐาน ถ้าทิศทางที่สุ่มจะชนขอบ ระบบจะเลือกทิศทางใหม่แทน',
  'หลังจบเกม ระบบจะแสดงผล เช่น อยู่บนเป้าหมาย ความแม่นกลางเป้า ระยะพลาดเฉลี่ย และคะแนนรวม',
]

const metrics = [
  {
    label: 'อยู่บนเป้าหมาย',
    value: 'เปอร์เซ็นต์เวลาที่ cursor อยู่ในวงเป้าหมายสีเขียว',
  },
  {
    label: 'ความแม่นกลางเป้า',
    value: 'คะแนนความใกล้กึ่งกลางเป้า ยิ่งอยู่ใกล้กลางยิ่งสูง',
  },
  {
    label: 'ระยะพลาดเฉลี่ย',
    value: 'ระยะห่างเฉลี่ยระหว่าง cursor กับจุดกึ่งกลางเป้า',
  },
]

export function ContinuousTrackingInfoPage() {
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
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-sp-card bg-sp-success-soft text-sp-success shadow-sp-brand md:h-48 md:w-48">
                <ContinuousTrackingIcon className="h-16 w-16 md:h-24 md:w-24" />
              </div>

              <div className="flex-grow text-center md:text-left">
                <h1 className="mb-4 text-4xl font-black text-sp-text md:text-5xl">
                  Continuous Tracking
                </h1>

                <p className="mb-8 text-xl leading-relaxed text-sp-text-muted">
                  แบบทดสอบการติดตามเป้าหมายต่อเนื่อง ใช้วัดความสามารถในการควบคุมเมาส์ให้ตามเป้าหมายที่เคลื่อนที่ตลอดเวลา
                  โดยเน้น motor control, eye-hand coordination และความแม่นยำในการควบคุม cursor ให้อยู่ใกล้กึ่งกลางเป้า
                </p>

                <AppButton
                  onClick={() => navigate('/gameplay/continuous-tracking')}
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
                label="ระดับความยาก"
                value="Easy / Normal / Hard"
              />

              <InfoBox
                label="วัดทักษะหลัก"
                value="Motor Control / Eye-Hand Coordination"
              />

              <InfoBox
                label="คะแนนรวม"
                value="คิดจากความใกล้กึ่งกลางเป้าเป็นหลัก"
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

export default ContinuousTrackingInfoPage