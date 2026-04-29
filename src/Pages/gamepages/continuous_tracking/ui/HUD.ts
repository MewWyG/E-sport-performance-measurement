import type { HUDRenderArgs, TrialStateValue } from '../types'

export class HUD {
  root: HTMLElement

  constructor(root: HTMLElement) {
    this.root = root
    this.render({
      state: 'idle',
      timeLeft: 0,
      metrics: null,
      seedInfo: '-',
      seedMode: 'random',
    })
  }

  render({
    state,
    timeLeft,
    metrics,
    seedInfo = '-',
    seedMode = 'random',
  }: HUDRenderArgs): void {
    this.root.innerHTML = `
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-sp-card border border-sp-border bg-sp-glass p-5 backdrop-blur-xl">
          <div class="text-xs font-semibold text-sp-text-muted">สถานะ</div>
          <div class="mt-2 text-2xl font-black text-sp-text">${this.getStateLabel(state)}</div>
        </div>

        <div class="rounded-sp-card border border-sp-border bg-sp-glass p-5 backdrop-blur-xl">
          <div class="text-xs font-semibold text-sp-text-muted">เวลาคงเหลือ</div>
          <div class="mt-2 text-2xl font-black text-sp-text">${timeLeft.toFixed(1)}s</div>
        </div>
      </div>

      <div class="mt-4 rounded-sp-card border border-sp-border bg-sp-glass p-5 backdrop-blur-xl">
        <div class="text-xs font-semibold text-sp-text-muted">Seed ที่ใช้งาน</div>
        <div class="mt-2 break-all text-2xl font-black text-sp-success">${seedInfo}</div>
        <div class="mt-2 text-sm text-sp-text-muted">โหมด: ${seedMode === 'fixed' ? 'Fixed Seed' : 'Random'}</div>
      </div>

      ${
        metrics
          ? `
            <div class="mt-4 rounded-sp-card border border-sp-border bg-sp-glass p-5 backdrop-blur-xl">
              <div class="mb-4 flex items-center justify-between gap-3">
                <h3 class="text-lg font-bold text-sp-text">ผลการทดสอบ</h3>
                <div class="rounded-sp-pill border border-sp-info/20 bg-sp-info-soft px-3 py-1 text-xs font-bold text-sp-info">Completed</div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                ${this.resultItem('Time on Target', `${metrics.timeOnTargetPct.toFixed(2)}%`)}
                ${this.resultItem('Mean Error', `${metrics.meanError.toFixed(2)} px`)}
                ${this.resultItem('RMSE', `${metrics.rmse.toFixed(2)} px`)}
                ${this.resultItem('Max Error', `${metrics.maxError.toFixed(2)} px`)}
                ${this.resultItem('On Target Time', `${metrics.onTargetTime.toFixed(2)} s`)}
                ${this.resultItem('Total Time', `${metrics.totalTime.toFixed(2)} s`)}
              </div>
            </div>
          `
          : `
            <div class="mt-4 rounded-sp-card border border-sp-border bg-sp-glass p-5 backdrop-blur-xl">
              <div class="mb-4 flex items-center justify-between gap-3">
                <h3 class="text-lg font-bold text-sp-text">ผลการทดสอบ</h3>
                <div class="rounded-sp-pill border border-sp-info/20 bg-sp-info-soft px-3 py-1 text-xs font-bold text-sp-info">Waiting</div>
              </div>
              <div class="text-sm leading-relaxed text-sp-text-muted">ยังไม่มีผลลัพธ์ เริ่มการทดสอบเพื่อบันทึกคะแนน</div>
            </div>
          `
      }
    `
  }

  private resultItem(label: string, value: string): string {
    return `
      <div class="rounded-sp-xl border border-sp-border bg-sp-surface/50 p-4">
        <div class="text-xs font-semibold text-sp-text-muted">${label}</div>
        <div class="mt-2 break-words text-xl font-black text-sp-text">${value}</div>
      </div>
    `
  }

  getStateLabel(state: TrialStateValue): string {
    const map: Record<TrialStateValue, string> = {
      idle: 'พร้อม',
      countdown: 'เตรียม',
      running: 'กำลังทดสอบ',
      finished: 'เสร็จสิ้น',
    }
    return map[state] || state
  }
}
