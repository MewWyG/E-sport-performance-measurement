import { Link, useNavigate } from "react-router";
import { AppButton } from "../../../components/common/AppButton";
import { SiteFooter } from "../../../components/layout/SiteFooter";
import { SiteHeader } from "../../../components/layout/SiteHeader";

const instructions = [
  "ปืน Full-Auto ขนาดแม็ก 30 นัด (ปรับได้ใน config) จะดีดขึ้นและแกว่งตามเวลา",
  "กดเมาส์ซ้ายค้างเพื่อเริ่มยิง สเปรย์จะดีดขึ้นเองตาม pattern ของเกม FPS",
  "ลากเมาส์ลงเพื่อสวน recoil แนวตั้ง และซ้าย-ขวาเพื่อแก้แนวนอน ให้กลุ่มกระสุนเกาะวงเป้า",
  "ต้องกดค้างจนยิงครบทั้งแม็ก — ปล่อยปุ่มกลางทาง = FOUL ไม่นับคะแนน",
];

const metricsExplain = [
  { label: "Hit Rate", description: "เปอร์เซ็นต์กระสุนที่เข้าวงเป้า" },
  { label: "Perfect %", description: "เปอร์เซ็นต์กระสุนที่ตกในวงกลางเป้า (perfect zone)" },
  { label: "Grouping", description: "ความเกาะกลุ่มของกระสุน — น้อย = นิ่ง" },
  { label: "Vertical / Horizontal Control", description: "ความสามารถในการคุมแกนตั้งและแกนนอน" },
  { label: "First Shot Time", description: "Reaction time จากสัญญาณ READY ถึงนัดแรก" },
  { label: "Quadrant Heatmap", description: "การกระจายของกระสุนรอบเป้า 4 ทิศ" },
];

export function SprayControlInfoPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-sp-page flex-grow px-6 py-12 md:px-12 md:py-20">
        <section className="animate-sp-fade-in mx-auto max-w-4xl">
          <Link
            to="/librarygame"
            className="group mb-8 inline-flex items-center gap-2 text-sp-text-muted transition-colors hover:text-sp-text"
          >
            <svg className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>กลับไปยังคลังเกม</span>
          </Link>

          <div className="rounded-sp-card border border-sp-border bg-sp-glass p-8 backdrop-blur-xl md:p-12">
            <div className="flex flex-col items-center gap-10 md:flex-row md:gap-12">
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-sp-card bg-sp-danger-soft text-6xl shadow-sp-brand md:h-48 md:w-48 md:text-8xl">
                🎯
              </div>

              <div className="flex-grow text-center md:text-left">
                <h1 className="mb-4 text-4xl font-black text-sp-text md:text-5xl">
                  Spray Control
                </h1>

                <p className="mb-8 text-xl leading-relaxed text-sp-text-muted">
                  ทดสอบทักษะการคุมเมาส์ตอน "สเปรย์" — ยิงค้างหนึ่งแม็กแล้วลากเมาส์สวน recoil
                  ให้กระสุนเกาะวงเป้า เป็นทักษะพื้นฐานสำคัญของผู้เล่น FPS ระดับ Pro
                </p>

                <AppButton
                  onClick={() => navigate("/gameplay/spray-control")}
                  className="w-full px-12 py-5 text-xl md:w-auto"
                >
                  เล่นเลย
                </AppButton>
              </div>
            </div>

            <hr className="my-10 border-sp-border" />

            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <h2 className="mb-4 text-2xl font-bold text-sp-text">วิธีเล่น</h2>
                <ol className="space-y-3 text-sp-text-muted">
                  {instructions.map((line, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sp-pill bg-sp-danger-soft font-bold text-sp-danger">
                        {i + 1}
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h2 className="mb-4 text-2xl font-bold text-sp-text">ค่าที่วัด</h2>
                <ul className="space-y-3 text-sm">
                  {metricsExplain.map((m) => (
                    <li key={m.label} className="rounded-sp-md border border-sp-border bg-sp-bg-soft p-3">
                      <div className="font-bold text-sp-text">{m.label}</div>
                      <div className="text-sp-text-muted">{m.description}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
