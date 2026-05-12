import type { DualTaskResult } from '../types'

type ResultPanelProps = {
  result: DualTaskResult
}

export function ResultPanel({ result }: ResultPanelProps) {
  return (
    <section className="rounded-sp-card border border-sp-success/25 bg-sp-success-soft p-6">
      <div className="mb-5">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-sp-success">
          Result Ready
        </p>

        <h2 className="mt-2 text-2xl font-black text-sp-text">
          ผลลัพธ์พร้อมส่งต่อ Backend
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-sp-text-muted">
          ข้อมูลชุดนี้ถูกเก็บใน localStorage และสามารถนำไปส่ง API เพื่อบันทึกลงฐานข้อมูลได้
          พร้อมข้อมูล difficulty และ movement schedule สำหรับตรวจสอบความเสมอภาคของการทดสอบ
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ResultItem
          label="Difficulty Mode"
          value={result.difficultyMode.toUpperCase()}
        />

        <ResultItem
          label="Schedule Version"
          value={result.movementScheduleVersion}
        />

        <ResultItem
          label="Tracking Accuracy"
          value={`${result.trackingAccuracy}%`}
        />

        <ResultItem
          label="Input Accuracy"
          value={`${result.inputAccuracy}%`}
        />

        <ResultItem
          label="Avg Reaction"
          value={`${result.avgInputReactionMs} ms`}
        />

        <ResultItem
          label="Multitask Score"
          value={`${result.multitaskScore}`}
        />

        <ResultItem
          label="Stability"
          value={`${result.stability}%`}
        />

        <ResultItem
          label="Completed Sequences"
          value={`${result.completedSequences}`}
        />
      </div>

      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-bold text-sp-success">
          ดู JSON Output
        </summary>

        <pre className="mt-4 max-h-72 overflow-auto rounded-sp-xl bg-sp-bg p-4 text-xs leading-relaxed text-sp-text-muted">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </section>
  )
}

type ResultItemProps = {
  label: string
  value: string
}

function ResultItem({ label, value }: ResultItemProps) {
  return (
    <div className="rounded-sp-lg border border-sp-border bg-sp-bg/50 p-4">
      <p className="text-xs font-semibold text-sp-text-subtle">
        {label}
      </p>

      <p className="mt-1 break-words text-xl font-black text-sp-text">
        {value}
      </p>
    </div>
  )
}