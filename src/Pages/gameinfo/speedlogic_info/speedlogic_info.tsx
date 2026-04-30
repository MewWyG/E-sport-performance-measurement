import { Link, useNavigate } from 'react-router'
import { AppButton } from '../../../components/common/AppButton'
import { SpeedLogicIcon } from '../../../components/icons/AppIcons'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'

const instructions = [
  'ระบบจะแสดงโจทย์สั้น ๆ เช่น คณิตพื้นฐาน การเปรียบเทียบตัวเลข หรือคำถามจริง/เท็จ',
  'ผู้เล่นต้องเลือกคำตอบที่ถูกต้องให้เร็วที่สุดภายในเวลาที่กำหนด',
  'เมื่อผู้เล่นตอบถูกต่อเนื่อง ระบบจะค่อย ๆ เพิ่มระดับความยากของโจทย์',
  'เมื่อจบเกม ระบบจะแสดงค่าสถิติ เช่น ความเร็วในการตอบ ความถูกต้อง และคะแนนการประมวลผล',
]

export function SpeedLogicInfoPage() {
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
                <SpeedLogicIcon className="h-16 w-16 md:h-24 md:w-24" />
              </div>

              <div className="flex-grow text-center md:text-left">

                <h1 className="mb-4 text-4xl font-black text-sp-text md:text-5xl">
                  Speed Logic
                </h1>

                <p className="mb-8 text-xl leading-relaxed text-sp-text-muted">
                  ทดสอบความเร็วในการคิดและการตัดสินใจ
                  โดยผู้เล่นต้องตอบคำถาม logic หรือโจทย์ตัวเลขง่าย ๆ
                  ให้ถูกต้องและรวดเร็วภายใต้เวลาจำกัด
                </p>

                <AppButton
                  onClick={() => navigate('/gameplay/speedlogic')}
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

            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
              <InfoBox
                label="รูปแบบเกม"
                value="Logic / Number Questions"
              />

              <InfoBox
                label="วัดทักษะหลัก"
                value="Processing Speed"
              />

              <InfoBox
                label="ผลลัพธ์หลัก"
                value="Accuracy / Reaction / Score"
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoBox
                label="ค่าสถิติที่ได้"
                value="Accuracy, Average Response Time, Throughput, Max Difficulty"
              />

              <InfoBox
                label="เหมาะสำหรับ"
                value="การวัดความเร็วในการคิด การตัดสินใจ และความแม่นยำภายใต้เวลา"
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