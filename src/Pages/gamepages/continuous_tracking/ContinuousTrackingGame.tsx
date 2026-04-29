import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AppButton } from '../../../components/common/AppButton'
import { SiteFooter } from '../../../components/layout/SiteFooter'
import { SiteHeader } from '../../../components/layout/SiteHeader'
import { CONFIG } from './config'
import { CustomPathManager } from './engine/CustomPathManager'
import { GameEngine } from './engine/gameengine'
import { HUD } from './ui/HUD'
import type {
  ExportedCustomPath,
  PathValidationResult,
  Pattern,
  SeedMode,
} from './types'

type PatternOption = {
  value: Pattern
  label: string
}

const patternOptions: PatternOption[] = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'linear', label: 'Linear' },
  { value: 'zigzag', label: 'Zig-Zag' },
  { value: 'sinusoidal', label: 'Sinusoidal' },
  { value: 'jitter', label: 'Random Jitter' },
  { value: 'custom', label: 'Custom Path' },
]

const durationOptions = [20, 30, 45, 60]

function generateRandomSeed() {
  return Math.floor(Math.random() * 2147483647) + 1
}

function validatePathText(text: string): PathValidationResult {
  let parsed: Partial<ExportedCustomPath>

  try {
    parsed = JSON.parse(text) as Partial<ExportedCustomPath>
  } catch {
    return {
      ok: false,
      message: 'รูปแบบ JSON ไม่ถูกต้อง',
    }
  }

  if (!parsed || parsed.type !== 'custom_path') {
    return {
      ok: false,
      message: 'ข้อมูลนี้ไม่ใช่ custom_path',
    }
  }

  if (!Array.isArray(parsed.points)) {
    return {
      ok: false,
      message: 'ไม่พบ points ใน path',
    }
  }

  if (parsed.points.length < 2) {
    return {
      ok: false,
      message: 'path ต้องมีอย่างน้อย 2 points',
    }
  }

  const hasInvalidPoint = parsed.points.some((p) => {
    return (
      !p ||
      typeof p.x !== 'number' ||
      typeof p.y !== 'number' ||
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.y)
    )
  })

  if (hasInvalidPoint) {
    return {
      ok: false,
      message: 'points ต้องมีค่า x และ y เป็นตัวเลข',
    }
  }

  return {
    ok: true,
    message: 'Path ใช้งานได้',
  }
}

export default function ContinuousTrackingGamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const hudRootRef = useRef<HTMLDivElement | null>(null)

  const engineRef = useRef<GameEngine | null>(null)
  const customPathRef = useRef<CustomPathManager | null>(null)
  const isMouseDownForPathRef = useRef(false)
  const copyStatusTimerRef = useRef<number | null>(null)

  const [pattern, setPattern] = useState<Pattern>('mixed')
  const [durationSec, setDurationSec] = useState(30)
  const [seedMode, setSeedMode] = useState<SeedMode>('random')
  const [seedInput, setSeedInput] = useState('20260422')
  const [sensitivity, setSensitivity] = useState(1)
  const [copySeedStatus, setCopySeedStatus] = useState('')
  const [customPathStatus, setCustomPathStatus] = useState('ยังไม่มี path')
  const [pathDataInput, setPathDataInput] = useState('')

  useEffect(() => {
    if (!canvasRef.current || !overlayRef.current || !hudRootRef.current) return

    canvasRef.current.width = CONFIG.canvas.width
    canvasRef.current.height = CONFIG.canvas.height

    const hud = new HUD(hudRootRef.current)
    const engine = new GameEngine(canvasRef.current, hud, overlayRef.current)
    const customPathManager = new CustomPathManager(
      CONFIG.canvas.width,
      CONFIG.canvas.height,
    )

    engine.setSensitivity(sensitivity)
    engine.setPreviewPattern(pattern, customPathManager)

    engineRef.current = engine
    customPathRef.current = customPathManager
    updateCustomPathStatus(customPathManager)

    return () => {
      if (copyStatusTimerRef.current) {
        window.clearTimeout(copyStatusTimerRef.current)
      }

      engine.reset()
      engineRef.current = null
      customPathRef.current = null
    }
    // สร้าง engine ครั้งแรกเท่านั้น
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateCustomPathStatus(manager = customPathRef.current) {
    if (!manager) return

    const pointCount = manager.points.length
    const totalLength = manager.getTotalLength().toFixed(1)

    if (manager.hasValidPath()) {
      setCustomPathStatus(
        `Path พร้อมใช้งาน • ${pointCount} points • length ${totalLength}px • ระบบจะปิดเส้นกลับจุดเริ่มให้อัตโนมัติ`,
      )
    } else if (manager.isDrawing) {
      setCustomPathStatus(`กำลังวาด path... (${pointCount} points)`)
    } else {
      setCustomPathStatus('ยังไม่มี path')
    }
  }

  function updatePatternPreview(nextPattern = pattern) {
    const engine = engineRef.current
    const customPathManager = customPathRef.current
    if (!engine || !customPathManager) return

    engine.setPreviewPattern(nextPattern, customPathManager)
  }

  function showCopyStatus(message: string) {
    setCopySeedStatus(message)

    if (copyStatusTimerRef.current) {
      window.clearTimeout(copyStatusTimerRef.current)
    }

    copyStatusTimerRef.current = window.setTimeout(() => {
      setCopySeedStatus('')
    }, 1800)
  }

  async function copySeedToClipboard() {
    const engine = engineRef.current
    if (!engine) return

    let seedToCopy: number | null = null

    if (seedMode === 'fixed') {
      seedToCopy = Number(seedInput) || 1
    } else {
      seedToCopy = engine.getCurrentSeed()
    }

    if (!seedToCopy) {
      showCopyStatus('ยังไม่มี seed ให้คัดลอก')
      return
    }

    try {
      await navigator.clipboard.writeText(String(seedToCopy))
      showCopyStatus(`คัดลอก Seed ${seedToCopy} แล้ว`)
    } catch {
      showCopyStatus('คัดลอกไม่สำเร็จ')
    }
  }

  function handlePatternChange(nextPattern: Pattern) {
    const engine = engineRef.current
    const customPathManager = customPathRef.current

    setPattern(nextPattern)

    if (!engine || !customPathManager) return

    engine.resetForPatternChange(nextPattern, customPathManager)
    engine.setPreviewPattern(nextPattern, customPathManager)
    updateCustomPathStatus(customPathManager)
  }

  function handleSensitivityChange(value: number) {
    setSensitivity(value)
    engineRef.current?.setSensitivity(value)
  }

  function handleDrawPath() {
    const engine = engineRef.current
    const customPathManager = customPathRef.current
    if (!engine || !customPathManager) return

    setPattern('custom')
    setPathDataInput('')

    engine.resetForPatternChange('custom', customPathManager)
    customPathManager.startDrawing()

    updateCustomPathStatus(customPathManager)
    engine.setPreviewPattern('custom', customPathManager)
  }

  function handleFinishPath() {
    const customPathManager = customPathRef.current
    if (!customPathManager) return

    customPathManager.stopDrawing()
    updateCustomPathStatus(customPathManager)
    updatePatternPreview('custom')
  }

  function handleClearPath() {
    const engine = engineRef.current
    const customPathManager = customPathRef.current
    if (!engine || !customPathManager) return

    engine.resetForPatternChange('custom', customPathManager)
    customPathManager.clear()
    isMouseDownForPathRef.current = false

    setPathDataInput('')
    setCustomPathStatus('ล้าง path แล้ว')
    updateCustomPathStatus(customPathManager)
    engine.setPreviewPattern('custom', customPathManager)
  }

  async function handleCopyCurrentPath() {
    const customPathManager = customPathRef.current
    if (!customPathManager) return

    if (!customPathManager.hasValidPath()) {
      setCustomPathStatus('ยังไม่มี path ที่ copy ได้')
      return
    }

    const text = customPathManager.exportPath()

    try {
      await navigator.clipboard.writeText(text)
      setCustomPathStatus(
        'คัดลอก path แล้ว สามารถนำไปวางในช่อง Load Path Data เพื่อใช้ซ้ำได้',
      )
    } catch {
      setCustomPathStatus('คัดลอก path ไม่สำเร็จ')
    }
  }

  function handleLoadPath() {
    const engine = engineRef.current
    const customPathManager = customPathRef.current
    if (!engine || !customPathManager) return

    const text = pathDataInput.trim()

    if (!text) {
      setCustomPathStatus('กรุณาวาง path JSON ลงในช่อง Load Path Data ก่อน')
      return
    }

    const validation = validatePathText(text)

    if (!validation.ok) {
      setCustomPathStatus(`โหลด path ไม่สำเร็จ: ${validation.message}`)
      return
    }

    try {
      engine.resetForPatternChange('custom', customPathManager)
      customPathManager.importPath(text)
      customPathManager.stopDrawing()

      setPattern('custom')
      updateCustomPathStatus(customPathManager)
      engine.setPreviewPattern('custom', customPathManager)
      setCustomPathStatus('โหลด path สำเร็จ')
    } catch {
      setCustomPathStatus('โหลด path ไม่สำเร็จ หรือข้อมูลไม่ถูกต้อง')
    }
  }

  function getCanvasPoint(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    }
  }

  function handleCanvasMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    const engine = engineRef.current
    const customPathManager = customPathRef.current
    if (!engine || !customPathManager) return

    if (pattern !== 'custom') return
    if (!customPathManager.isDrawing) return

    const point = getCanvasPoint(event)
    if (!point) return

    isMouseDownForPathRef.current = true
    customPathManager.addPoint(point.x, point.y)
    updateCustomPathStatus(customPathManager)
    engine.setPreviewPattern('custom', customPathManager)
  }

  function handleCanvasMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    const engine = engineRef.current
    const customPathManager = customPathRef.current
    if (!engine || !customPathManager) return

    if (pattern !== 'custom') return
    if (!customPathManager.isDrawing || !isMouseDownForPathRef.current) return

    const point = getCanvasPoint(event)
    if (!point) return

    customPathManager.addPoint(point.x, point.y)
    updateCustomPathStatus(customPathManager)
    engine.setPreviewPattern('custom', customPathManager)
  }

  function handleCanvasMouseUp() {
    isMouseDownForPathRef.current = false
  }

  function startGame() {
    const engine = engineRef.current
    const customPathManager = customPathRef.current
    if (!engine || !customPathManager) return

    if (pattern === 'custom' && !customPathManager.hasValidPath()) {
      setCustomPathStatus('กรุณาวาด path หรือโหลด path ก่อนเริ่ม')
      return
    }

    const seed =
      seedMode === 'fixed' ? Number(seedInput) || 1 : generateRandomSeed()

    engine.setSensitivity(sensitivity)
    engine.start({
      durationSec,
      seed,
      pattern,
      seedMode,
      customPathManager,
    })

    engine.requestPointerLock()

    if (seedMode === 'random') {
      showCopyStatus(`สุ่ม Seed ${seed} แล้ว`)
    }
  }

  function resetGame() {
    const engine = engineRef.current
    if (!engine) return

    engine.reset()
    engine.setSensitivity(sensitivity)

    setCopySeedStatus('')
    updateCustomPathStatus()
    updatePatternPreview(pattern)
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-sp-bg font-sans text-sp-text">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[96rem] flex-grow px-4 py-8 md:px-8">
        <section className="animate-sp-fade-in">
          <Link
            to="/gameinfo/continuous-tracking"
            className="group mb-6 inline-flex items-center gap-2 text-sp-text-muted transition-colors hover:text-sp-text"
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
            <span>กลับไปยังรายละเอียดเกม</span>
          </Link>

          <div className="mb-6 rounded-sp-card border border-sp-border bg-sp-glass p-6 backdrop-blur-xl">
            <div className="mb-6">
              <h1 className="text-3xl font-black text-sp-text md:text-4xl">
                Continuous Tracking
              </h1>
              <p className="mt-2 text-sp-text-muted">
                ควบคุมเมาส์ให้ติดตามเป้าหมายที่เคลื่อนที่ต่อเนื่องให้นานที่สุด
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <label className="text-sm font-semibold text-sp-text-muted">
                รูปแบบ
                <select
                  value={pattern}
                  onChange={(event) =>
                    handlePatternChange(event.target.value as Pattern)
                  }
                  className="mt-2 w-full rounded-sp-md border border-sp-border bg-sp-surface px-4 py-3 text-sp-text outline-none transition focus:border-sp-primary-hover"
                >
                  {patternOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-sp-text-muted">
                ระยะเวลา
                <select
                  value={durationSec}
                  onChange={(event) => setDurationSec(Number(event.target.value))}
                  className="mt-2 w-full rounded-sp-md border border-sp-border bg-sp-surface px-4 py-3 text-sp-text outline-none transition focus:border-sp-primary-hover"
                >
                  {durationOptions.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration}s
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-sp-text-muted">
                โหมด Seed
                <select
                  value={seedMode}
                  onChange={(event) => setSeedMode(event.target.value as SeedMode)}
                  className="mt-2 w-full rounded-sp-md border border-sp-border bg-sp-surface px-4 py-3 text-sp-text outline-none transition focus:border-sp-primary-hover"
                >
                  <option value="random">Random</option>
                  <option value="fixed">Fixed Seed</option>
                </select>
              </label>

              {seedMode === 'fixed' && (
                <label className="text-sm font-semibold text-sp-text-muted">
                  Seed
                  <div className="mt-2 flex gap-2">
                    <input
                      type="number"
                      value={seedInput}
                      onChange={(event) => setSeedInput(event.target.value)}
                      className="min-w-0 flex-1 rounded-sp-md border border-sp-border bg-sp-surface px-4 py-3 text-sp-text outline-none transition focus:border-sp-primary-hover"
                    />
                    <button
                      type="button"
                      onClick={copySeedToClipboard}
                      className="rounded-sp-md border border-sp-border bg-sp-surface px-3 py-2 text-sm font-bold text-sp-text transition hover:border-sp-primary-hover"
                    >
                      Copy
                    </button>
                  </div>
                </label>
              )}

              <label className="text-sm font-semibold text-sp-text-muted">
                Mouse Sensitivity
                <div className="mt-2 flex items-center gap-3 rounded-sp-md border border-sp-border bg-sp-surface px-4 py-3">
                  <input
                    type="range"
                    min="0.3"
                    max="2.5"
                    step="0.1"
                    value={sensitivity}
                    onChange={(event) =>
                      handleSensitivityChange(Number(event.target.value))
                    }
                    className="min-w-0 flex-1 accent-sp-primary-hover"
                  />
                  <span className="rounded-sp-pill bg-sp-success-soft px-3 py-1 text-sm font-bold text-sp-success">
                    {sensitivity.toFixed(1)}
                  </span>
                </div>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <AppButton onClick={startGame}>เริ่มทดสอบ</AppButton>
              <AppButton variant="glass" onClick={resetGame}>
                รีเซ็ต
              </AppButton>
              {copySeedStatus && (
                <span className="text-sm font-semibold text-sp-success">
                  {copySeedStatus}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="min-w-0 rounded-sp-card border border-sp-border bg-sp-glass p-5 backdrop-blur-xl">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-sp-text">พื้นที่ทดสอบ</h2>
                <p className="mt-1 text-sp-text-muted">
                  เมื่อเริ่มทดสอบ เมาส์จะถูกล็อกไว้ในพื้นที่เกม • กด{' '}
                  <strong className="text-sp-text">Esc</strong>{' '}
                  เพื่อออกจากการควบคุมและถือว่าจบเกมทันที
                </p>
              </div>

              <section className="relative overflow-hidden rounded-sp-card border border-sp-border bg-[#020617]">
                <canvas
                  ref={canvasRef}
                  width={1000}
                  height={640}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className="block h-auto w-full cursor-crosshair bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[length:40px_40px,40px_40px] [&.locked]:cursor-none"
                />
                <div
                  ref={overlayRef}
                  className="hidden absolute inset-0 place-items-center bg-slate-950/40 text-7xl font-black text-sp-text backdrop-blur-sm"
                />
              </section>

              {pattern === 'custom' && (
                <div className="mt-5 rounded-sp-card border border-sp-border bg-sp-surface/60 p-5">
                  <h3 className="text-lg font-bold text-sp-text">Custom Path</h3>

                  <div className="mt-4 rounded-sp-xl border border-sp-info/20 bg-sp-info-soft/40 p-4 text-sm leading-relaxed text-sp-text-muted">
                    <strong className="text-sp-text">วิธีใช้ Custom Path</strong>
                    <ol className="mt-2 list-decimal space-y-1 pl-5">
                      <li>กด <strong className="text-sp-text">Draw Path</strong></li>
                      <li>ลากเมาส์บนพื้นที่ทดสอบเพื่อวาดเส้นทาง</li>
                      <li>กด <strong className="text-sp-text">Finish Path</strong> เมื่อวาดเสร็จ</li>
                      <li>กด <strong className="text-sp-text">เริ่มทดสอบ</strong> เพื่อให้เป้าหมายเคลื่อนที่ตามเส้นที่วาด</li>
                      <li>กด <strong className="text-sp-text">Copy Current Path</strong> เพื่อเก็บ path ไว้ใช้ซ้ำ</li>
                      <li>วาง path ในช่อง <strong className="text-sp-text">Load Path Data</strong> แล้วกด <strong className="text-sp-text">Load Path</strong></li>
                    </ol>
                    <p className="mt-2 text-sp-info">ระบบจะเชื่อมเส้นสุดท้ายกลับไปยังจุดเริ่มต้นให้อัตโนมัติ</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" className="rounded-sp-md border border-sp-border bg-sp-surface px-4 py-2 font-bold text-sp-text transition hover:border-sp-primary-hover" onClick={handleDrawPath}>Draw Path</button>
                    <button type="button" className="rounded-sp-md border border-sp-border bg-sp-surface px-4 py-2 font-bold text-sp-text transition hover:border-sp-primary-hover" onClick={handleFinishPath}>Finish Path</button>
                    <button type="button" className="rounded-sp-md border border-sp-border bg-sp-surface px-4 py-2 font-bold text-sp-text transition hover:border-sp-primary-hover" onClick={handleClearPath}>Clear Path</button>
                    <button type="button" className="rounded-sp-md border border-sp-border bg-sp-surface px-4 py-2 font-bold text-sp-text transition hover:border-sp-primary-hover" onClick={handleCopyCurrentPath}>Copy Current Path</button>
                    <button type="button" className="rounded-sp-md border border-sp-border bg-sp-surface px-4 py-2 font-bold text-sp-text transition hover:border-sp-primary-hover" onClick={handleLoadPath}>Load Path</button>
                  </div>

                  <label className="mt-4 block text-sm font-semibold text-sp-text-muted">
                    Load Path Data
                    <textarea
                      rows={8}
                      value={pathDataInput}
                      onChange={(event) => setPathDataInput(event.target.value)}
                      placeholder='วาง path JSON ตรงนี้ เช่น {"version":1,"type":"custom_path","points":[...]}'
                      className="mt-2 w-full resize-y rounded-sp-md border border-sp-border bg-sp-surface-muted p-4 font-mono text-sm text-sp-text outline-none transition focus:border-sp-primary-hover"
                    />
                  </label>

                  <p className="mt-3 text-sm text-sp-text-muted">{customPathStatus}</p>
                </div>
              )}
            </div>

            <aside className="space-y-5">
              <div ref={hudRootRef} />

              <div className="rounded-sp-card border border-sp-border bg-sp-glass p-6 backdrop-blur-xl">
                <h3 className="mb-3 text-lg font-bold text-sp-text">วิธีเล่น</h3>
                <p className="leading-relaxed text-sp-text-muted">
                  เป้าหมายจะเคลื่อนที่ต่อเนื่องบนจอ ผู้เล่นต้องควบคุมเมาส์ให้ตามเป้าให้ได้นานที่สุด
                </p>
                <p className="mt-3 leading-relaxed text-sp-text-muted">
                  ไม่ต้องคลิก ใช้การควบคุมเมาส์อย่างเดียว
                </p>
              </div>

              <div className="rounded-sp-card border border-sp-border bg-sp-glass p-6 backdrop-blur-xl">
                <h3 className="mb-3 text-lg font-bold text-sp-text">การวัดผล</h3>
                <ul className="list-disc space-y-2 pl-5 text-sp-text-muted">
                  <li><strong className="text-sp-text">Time on Target</strong> เวลาที่เคอร์เซอร์อยู่บนเป้า</li>
                  <li><strong className="text-sp-text">Mean Error</strong> ระยะเฉลี่ยจากเคอร์เซอร์ถึงเป้า</li>
                  <li><strong className="text-sp-text">RMSE</strong> ค่าความคลาดเคลื่อนแบบเน้นการพลาดหนัก</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
