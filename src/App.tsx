import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20">
              <span className="text-xl">⚡</span>
            </div>
            <span className="text-2xl font-extrabold uppercase tracking-tight">
              SkillPulse
            </span>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden items-center gap-8 font-semibold text-slate-400 md:flex">
              <button className="transition-colors hover:text-white">คลังเกม</button>
              <button className="transition-colors hover:text-white">ประวัติการเล่น</button>
            </div>

            <div className="flex rounded-full border border-slate-700 bg-slate-800 p-1">
              <button className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                TH
              </button>
              <button className="rounded-full px-3 py-1 text-xs font-bold text-slate-400">
                EN
              </button>
            </div>

            <button className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30">
              เข้าสู่ระบบ
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-7xl px-6 py-20 md:py-28">
        <section className="page-transition text-center">
          <h1 className="mb-6 text-5xl font-black leading-tight md:text-8xl">
            <span>ทดสอบทักษะของคุณ </span>
            <span className="gradient-text">ผ่านการเล่น</span>
          </h1>

          <p className="mx-auto mb-12 max-w-3xl text-xl text-slate-400 md:text-2xl">
            ท้าทายขีดจำกัดของคุณด้วยมินิเกมที่ออกแบบมาเพื่อวัดสมาธิ,
            การตอบสนอง, ความจำ และการตัดสินใจบน SkillPulse
          </p>

          <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
            <button className="w-full rounded-2xl bg-indigo-600 px-10 py-5 text-xl font-bold text-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/40 md:w-auto">
              เริ่มต้นใช้งาน
            </button>

            <button className="glass-card w-full px-10 py-5 text-xl font-bold transition hover:bg-slate-800 md:w-auto">
              ดูอันดับผู้นำ
            </button>
          </div>

          <div className="mt-24 grid grid-cols-1 gap-8 text-left md:grid-cols-3">
            <FeatureCard
              icon="✓"
              color="emerald"
              title="มาตรวัดทางวิทยาศาสตร์"
              desc="การทดสอบของเราได้รับแรงบันดาลใจจากเกณฑ์มาตรฐานทางประสาทวิทยาเพื่อวัดการตอบสนองและความจำ"
            />

            <FeatureCard
              icon="↗"
              color="blue"
              title="ติดตามความคืบหน้า"
              desc="ดูการพัฒนาของคุณเมื่อเวลาผ่านไป พร้อมประวัติการเล่นที่ละเอียดและบทวิเคราะห์เปอร์เซ็นไทล์"
            />

            <FeatureCard
              icon="♙"
              color="pink"
              title="ขับเคลื่อนโดยชุมชน"
              desc="เปรียบเทียบคะแนนของคุณกับกลุ่มอายุเดียวกันและชุมชน SkillPulse ทั่วโลก"
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 p-12 text-center text-slate-500">
        © 2024 SkillPulse Lab. วัดประสิทธิภาพศักยภาพมนุษย์
      </footer>
    </div>
  )
}

type FeatureCardProps = {
  icon: string
  color: 'emerald' | 'blue' | 'pink'
  title: string
  desc: string
}

function FeatureCard({ icon, color, title, desc }: FeatureCardProps) {
  const colorClass = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/20 text-blue-400',
    pink: 'bg-pink-500/20 text-pink-400',
  }[color]

  return (
    <article className="glass-card p-8">
      <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold ${colorClass}`}>
        {icon}
      </div>

      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="leading-relaxed text-slate-400">{desc}</p>
    </article>
  )
}

export default App