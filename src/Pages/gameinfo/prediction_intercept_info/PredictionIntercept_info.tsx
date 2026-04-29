import { Link } from 'react-router'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'

export function PredictionInterceptInfoPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-sp-page flex-grow px-6 py-12 md:px-12">
        <section className="animate-sp-fade-in">
          <div className="mb-10">
            <Link
              to="/librarygame"
              className="mb-6 inline-flex text-sm font-bold text-sp-primary hover:underline"
            >
              ← กลับไปคลังเกม
            </Link>

            <h1 className="mb-3 text-4xl font-black text-sp-text">
              แบบทดสอบการคาดการณ์ตำแหน่งเป้าหมาย
            </h1>

            <p className="max-w-3xl text-lg text-sp-text-muted">
              Prediction Intercept Game ใช้วัดความสามารถในการคาดการณ์การเคลื่อนที่ล่วงหน้า
              ผู้เล่นต้องประเมินว่าเป้าหมายที่หายไปจะเคลื่อนที่ไปอยู่ตำแหน่งใด
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <section className="rounded-3xl border border-sp-border bg-sp-card p-8 shadow-sp-card">
              <h2 className="mb-4 text-2xl font-black text-sp-text">
                แนวคิดของเกม
              </h2>

              <p className="mb-4 text-sp-text-muted">
                เกมนี้ไม่ได้วัดแค่ reflex แต่เน้นการวัด predictive model หรือความสามารถของสมองในการเดาการเคลื่อนที่ล่วงหน้า
              </p>

              <ul className="space-y-3 text-sp-text-muted">
                <li>• เป้าหมายเคลื่อนที่บนหน้าจอ</li>
                <li>• เป้าหมายจะหายไปช่วงเวลาหนึ่ง</li>
                <li>• ผู้เล่นต้องคลิกตำแหน่งที่คิดว่าเป้าหมายจะไปถึง</li>
                <li>• ระบบจะแสดงตำแหน่งจริงและคำนวณความคลาดเคลื่อน</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-sp-border bg-sp-card p-8 shadow-sp-card">
              <h2 className="mb-4 text-2xl font-black text-sp-text">
                สิ่งที่วัดผล
              </h2>

              <ul className="space-y-4 text-sp-text-muted">
                <li>
                  <strong className="text-sp-text">Prediction Error</strong>
                  <br />
                  ระยะห่างระหว่างตำแหน่งที่คลิกกับตำแหน่งจริงของเป้าหมาย ยิ่งน้อยยิ่งดี
                </li>

                <li>
                  <strong className="text-sp-text">Timing Error</strong>
                  <br />
                  คลิกเร็วหรือช้ากว่าช่วงเวลาที่เป้าหมายควรไปถึงมากน้อยแค่ไหน
                </li>

                <li>
                  <strong className="text-sp-text">Bias</strong>
                  <br />
                  วิเคราะห์แนวโน้มว่าผู้เล่นมักเดานำหน้า ช้ากว่า หรือเบี่ยงออกจากเส้นทาง
                </li>
              </ul>
            </section>
          </div>

          <div className="mt-10 rounded-3xl border border-sp-border bg-sp-card p-8 shadow-sp-card">
            <h2 className="mb-4 text-2xl font-black text-sp-text">
              วิธีเล่น
            </h2>

            <ol className="list-decimal space-y-3 pl-6 text-sp-text-muted">
              <li>กดเริ่มทดสอบ</li>
              <li>สังเกตการเคลื่อนที่ของเป้าหมาย</li>
              <li>เมื่อเป้าหมายหายไป ให้คลิกตำแหน่งที่คิดว่าเป้าหมายจะไปถึง</li>
              <li>ระบบจะแสดงตำแหน่งจริงและคะแนนความคลาดเคลื่อน</li>
              <li>ทำจนครบจำนวนรอบที่กำหนด</li>
            </ol>

            <div className="mt-8">
              <Link to="/gameplay/prediction-intercept">
                <button className="rounded-2xl bg-sp-primary px-6 py-3 font-bold text-white hover:opacity-90">
                  เริ่มทดสอบ
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default PredictionInterceptInfoPage